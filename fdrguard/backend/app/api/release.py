"""
Two-person (dual-control) safe release engine.

POST /api/v1/fdr/{fdr_id}/request-release   – College or Officer initiates
POST /api/v1/fdr/{fdr_id}/approve-release   – Different Approver/Officer signs off
POST /api/v1/fdr/{fdr_id}/reject-release    – Reject an open release request

Constraints:
  1. requester_id != approver_id
  2. approver_id != fdr.submitted_by_id  (creator may not self-approve)
  3. Only one open release request per FDR
  4. FDR must be Active or Maturing to request release
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..core.deps import get_current_user, ADMIN_ROLES
from ..models.user import User, UserRole
from ..models.fdr import FDRRecord, FDRStatus
from ..models.audit import StatusHistory
from ..models.release_request import ReleaseRequest, ReleaseStatus
from ..schemas.release import ReleaseRequestCreate, ReleaseApprove, ReleaseRequestOut
from ..services.hash_chain import append_audit_log

router = APIRouter(prefix="/v1/fdr", tags=["Release (Dual-Control)"])

_COLLEGE_ROLES = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
_APPROVER_ROLES = {UserRole.APPROVER, UserRole.OFFICER, UserRole.MANAGEMENT, UserRole.ADMIN}


def _load_fdr(fdr_id: int, current_user: User, db: Session) -> FDRRecord:
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.release_requests),
    ).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    if current_user.role in _COLLEGE_ROLES and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied — wrong college")
    return record


@router.post("/{fdr_id}/request-release", response_model=ReleaseRequestOut,
             status_code=status.HTTP_201_CREATED)
def request_release(
    fdr_id: int,
    payload: ReleaseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """College or Officer initiates a release request."""
    if current_user.role not in (_COLLEGE_ROLES | _APPROVER_ROLES):
        raise HTTPException(status_code=403, detail="Insufficient privileges to request release")

    record = _load_fdr(fdr_id, current_user, db)

    if record.status not in (FDRStatus.ACTIVE, FDRStatus.MATURING):
        raise HTTPException(
            status_code=409,
            detail=f"Release can only be requested for Active or Maturing FDRs (current: {record.status.value})",
        )

    # Guard: only one open request at a time
    open_req = db.query(ReleaseRequest).filter(
        ReleaseRequest.fdr_record_id == fdr_id,
        ReleaseRequest.status == ReleaseStatus.REQUESTED,
    ).first()
    if open_req:
        raise HTTPException(status_code=409, detail="An open release request already exists for this FDR")

    release = ReleaseRequest(
        fdr_record_id=fdr_id,
        requester_id=current_user.id,
        status=ReleaseStatus.REQUESTED,
        reason=payload.reason,
    )
    db.add(release)
    db.flush()

    # Move FDR to Release in Progress directly (bypasses ADMIN_ONLY role gate;
    # release workflow has its own two-person authorization chain)
    prev_status = record.status
    record.status = FDRStatus.RELEASE_IN_PROGRESS
    history = StatusHistory(
        fdr_record_id=fdr_id,
        actor_id=current_user.id,
        from_status=prev_status,
        to_status=FDRStatus.RELEASE_IN_PROGRESS,
        remark=payload.reason or "Release requested",
    )
    db.add(history)

    append_audit_log(
        db,
        action="release_requested",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        record_id=fdr_id,
        record_type="FDRRecord",
        payload={"release_request_id": release.id, "reason": payload.reason},
    )
    db.commit()
    db.refresh(release)
    return release


@router.post("/{fdr_id}/approve-release", response_model=ReleaseRequestOut)
def approve_release(
    fdr_id: int,
    payload: ReleaseApprove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Approver signs off the release.
    Enforces two-person rule:
      - approver != requester
      - approver != original FDR submitter
    """
    if current_user.role not in _APPROVER_ROLES:
        raise HTTPException(status_code=403, detail="Only Approvers, Officers, or Management can approve releases")

    record = _load_fdr(fdr_id, current_user, db)

    release = db.query(ReleaseRequest).filter(
        ReleaseRequest.fdr_record_id == fdr_id,
        ReleaseRequest.status == ReleaseStatus.REQUESTED,
    ).first()
    if not release:
        raise HTTPException(status_code=404, detail="No open release request found for this FDR")

    # Two-person rule checks
    if release.requester_id == current_user.id:
        raise HTTPException(
            status_code=422,
            detail="Two-person rule violation: approver cannot be the same person who requested release",
        )
    if record.submitted_by_id == current_user.id:
        raise HTTPException(
            status_code=422,
            detail="Two-person rule violation: original FDR submitter cannot approve release",
        )

    now = datetime.now(timezone.utc)
    release.status = ReleaseStatus.APPROVED
    release.approver_id = current_user.id
    release.decision_at = now
    release.decision_remark = payload.decision_remark

    # Direct status update — approver role already validated above
    prev_status = record.status
    record.status = FDRStatus.RELEASED
    history = StatusHistory(
        fdr_record_id=fdr_id,
        actor_id=current_user.id,
        from_status=prev_status,
        to_status=FDRStatus.RELEASED,
        remark=payload.decision_remark or "Release approved",
    )
    db.add(history)

    append_audit_log(
        db,
        action="release_approved",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        record_id=fdr_id,
        record_type="FDRRecord",
        payload={
            "release_request_id": release.id,
            "approver_id": current_user.id,
            "requester_id": release.requester_id,
            "decision_remark": payload.decision_remark,
        },
    )
    db.commit()
    db.refresh(release)
    return release


@router.post("/{fdr_id}/reject-release", response_model=ReleaseRequestOut)
def reject_release(
    fdr_id: int,
    payload: ReleaseApprove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject an open release request; FDR reverts to Active."""
    if current_user.role not in _APPROVER_ROLES:
        raise HTTPException(status_code=403, detail="Only Approvers or Officers can reject releases")

    record = _load_fdr(fdr_id, current_user, db)

    release = db.query(ReleaseRequest).filter(
        ReleaseRequest.fdr_record_id == fdr_id,
        ReleaseRequest.status == ReleaseStatus.REQUESTED,
    ).first()
    if not release:
        raise HTTPException(status_code=404, detail="No open release request found for this FDR")

    if release.requester_id == current_user.id:
        raise HTTPException(status_code=422, detail="Two-person rule: requester cannot reject own request")

    now = datetime.now(timezone.utc)
    release.status = ReleaseStatus.REJECTED
    release.approver_id = current_user.id
    release.decision_at = now
    release.decision_remark = payload.decision_remark

    # Revert FDR to Active directly
    prev_status = record.status
    record.status = FDRStatus.ACTIVE
    history = StatusHistory(
        fdr_record_id=fdr_id,
        actor_id=current_user.id,
        from_status=prev_status,
        to_status=FDRStatus.ACTIVE,
        remark=payload.decision_remark or "Release rejected",
    )
    db.add(history)

    append_audit_log(
        db,
        action="release_rejected",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        record_id=fdr_id,
        record_type="FDRRecord",
        payload={"release_request_id": release.id, "reason": payload.decision_remark},
    )
    db.commit()
    db.refresh(release)
    return release
