"""
FDR business logic service.
Enforces workflow rules and status transitions.

Status values and transitions are derived from docs/API_CONTRACT.md.
"""
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from ..models.fdr import FDRRecord, FDRStatus
from ..models.audit import StatusHistory, AuditEvent
from ..models.user import User, UserRole
from ..models.fdr_version import FDRVersion
from fastapi import HTTPException, status

# ─────────────────────────────────────────────────────────────────────────────
# Allowed status transitions — rebuilt from API_CONTRACT.md
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_TRANSITIONS: dict[FDRStatus, set[FDRStatus]] = {
    FDRStatus.DRAFT: {FDRStatus.SUBMITTED},
    FDRStatus.SUBMITTED: {FDRStatus.UNDER_REVIEW, FDRStatus.REJECTED},
    FDRStatus.UNDER_REVIEW: {
        FDRStatus.VERIFIED,
        FDRStatus.RETURNED,
        FDRStatus.REJECTED,
    },
    FDRStatus.RETURNED: {FDRStatus.SUBMITTED},
    FDRStatus.VERIFIED: {FDRStatus.ACTIVE, FDRStatus.REJECTED},
    FDRStatus.ACTIVE: {FDRStatus.MATURING, FDRStatus.RELEASE_IN_PROGRESS, FDRStatus.RENEWED},
    FDRStatus.MATURING: {FDRStatus.RELEASE_IN_PROGRESS, FDRStatus.RENEWED},
    FDRStatus.RELEASE_IN_PROGRESS: {FDRStatus.RELEASED, FDRStatus.ACTIVE},
    FDRStatus.RENEWED: {FDRStatus.ACTIVE},
    FDRStatus.REJECTED: {FDRStatus.SUBMITTED},  # college can re-submit after rejection
    FDRStatus.RELEASED: set(),
    FDRStatus.WITHDRAWN: set(),
}

# Transitions that require a remark
REMARK_REQUIRED = {FDRStatus.RETURNED, FDRStatus.REJECTED}

# Transitions only admin-level roles can make
from ..core.deps import ADMIN_ROLES

ADMIN_ONLY_TRANSITIONS = {
    FDRStatus.UNDER_REVIEW,
    FDRStatus.VERIFIED,
    FDRStatus.RETURNED,
    FDRStatus.REJECTED,
    FDRStatus.ACTIVE,
    FDRStatus.MATURING,
    FDRStatus.RELEASE_IN_PROGRESS,
    FDRStatus.RELEASED,
    FDRStatus.RENEWED,
    FDRStatus.WITHDRAWN,
}


def generate_application_id(db: Session) -> str:
    """Generate a unique application reference ID."""
    import random, string
    year = datetime.now(timezone.utc).year
    while True:
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        app_id = f"FDR-{year}-{suffix}"
        exists = db.query(FDRRecord).filter(FDRRecord.application_id == app_id).first()
        if not exists:
            return app_id


def transition_status(
    db: Session,
    record: FDRRecord,
    new_status: FDRStatus,
    actor: User,
    remark: Optional[str] = None,
) -> FDRRecord:
    """Apply a validated status transition and record history."""
    current_status = record.status

    # Check allowed transitions
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Transition from '{current_status}' to '{new_status}' is not permitted.",
        )

    # Check role permissions
    if new_status in ADMIN_ONLY_TRANSITIONS and actor.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this status transition.",
        )

    # Remark required
    if new_status in REMARK_REQUIRED and (not remark or not remark.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A remark is required when returning or rejecting a record.",
        )

    # Apply transition
    record.status = new_status
    if new_status == FDRStatus.SUBMITTED:
        record.submitted_at = datetime.now(timezone.utc)
    if remark:
        record.admin_remark = remark.strip()

    # Record status history
    history = StatusHistory(
        fdr_record_id=record.id,
        actor_id=actor.id,
        from_status=current_status,
        to_status=new_status,
        remark=remark.strip() if remark else None,
    )
    db.add(history)

    # Record audit event
    audit = AuditEvent(
        actor_id=actor.id,
        fdr_record_id=record.id,
        action=f"status_changed_to_{new_status.value}",
        metadata_json=json.dumps({
            "from": current_status.value,
            "to": new_status.value,
            "remark": remark,
        }),
    )
    db.add(audit)

    # Snapshot FDR version for history tracking
    version_count = db.query(FDRVersion).filter(
        FDRVersion.fdr_record_id == record.id
    ).count()
    snapshot = FDRVersion(
        fdr_record_id=record.id,
        version_number=version_count + 1,
        fdr_number=record.fdr_number,
        bank_name=record.bank_name,
        branch_name=record.branch_name,
        amount=record.amount,
        issue_date=record.issue_date,
        maturity_date=record.maturity_date,
        status=new_status.value,
        remarks=record.remarks,
        changed_by_id=actor.id,
        diff_summary=(
            f"Status: {current_status.value} \u2192 {new_status.value}"
            + (f" | Remark: {remark}" if remark else "")
        ),
    )
    db.add(snapshot)

    db.commit()
    db.refresh(record)
    return record


def add_audit_event(
    db: Session,
    actor_id: Optional[int],
    fdr_record_id: Optional[int],
    action: str,
    metadata: Optional[dict] = None,
) -> None:
    event = AuditEvent(
        actor_id=actor_id,
        fdr_record_id=fdr_record_id,
        action=action,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(event)
    db.commit()
