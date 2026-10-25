"""
Bank verification endpoint.

POST /api/v1/fdr/{fdr_id}/verify-bank

Query params:
  simulate_outage=true   – trigger the outage / VERIFICATION_PENDING path

Roles allowed: BANK_VERIFIER, OFFICER, ADMIN, MANAGEMENT, APPROVER
College users cannot trigger a bank check.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..core.deps import get_current_user, ADMIN_ROLES
from ..models.user import User, UserRole
from ..models.fdr import FDRRecord, FDRStatus
from ..models.bank_verification import BankVerification, BankCheckStatus
from ..schemas.analytics import BankVerifyOut
from ..services.bank_adapter import verify_fdr
from ..services.hash_chain import append_audit_log
from ..services.fdr_service import transition_status

router = APIRouter(prefix="/v1/fdr", tags=["Bank Verification"])

_BANK_ALLOWED_ROLES = ADMIN_ROLES | {UserRole.BANK_VERIFIER}


def _load_fdr_owned(fdr_id: int, current_user: User, db: Session) -> FDRRecord:
    """Central ownership-checked FDR loader."""
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.bank_verifications),
    ).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    college_roles = {UserRole.COLLEGE_USER, UserRole.COLLEGE}
    if current_user.role in college_roles and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return record


@router.post("/{fdr_id}/verify-bank", response_model=BankVerifyOut, status_code=status.HTTP_200_OK)
def verify_bank(
    fdr_id: int,
    simulate_outage: bool = Query(False, description="Set true to simulate CBS outage"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Run a simulated CBS bank verification against the FDR's submitted values.

    - VERIFIED  → FDR transitions to Verified
    - FAILED    → FDR transitions to Returned (mismatch found)
    - VERIFICATION_PENDING → FDR status unchanged; retry metadata returned
    """
    # Role gate — only bank verifiers and admins
    if current_user.role not in _BANK_ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Only Bank Verifiers or Officers can trigger CBS checks")

    record = _load_fdr_owned(fdr_id, current_user, db)

    # Only makes sense on submitted / under-review FDRs
    if record.status not in (FDRStatus.SUBMITTED, FDRStatus.UNDER_REVIEW, FDRStatus.VERIFIED):
        raise HTTPException(
            status_code=409,
            detail=f"Bank check not allowed in status '{record.status.value}'",
        )

    # Get institution name for account holder matching
    institution_name = record.institution.name if record.institution else ""

    result = verify_fdr(
        fdr_number=record.fdr_number,
        principal_amount=record.amount,
        bank_name=record.bank_name,
        maturity_date=record.maturity_date,
        account_holder_name=institution_name,
        simulate_outage=simulate_outage,
    )

    bv = BankVerification(
        fdr_record_id=fdr_id,
        result=BankCheckStatus(result.status),
        simulated=True,
        submitted_snapshot=json.dumps(result.submitted_snapshot or {}),
        bank_snapshot=json.dumps(result.bank_snapshot or {}),
        discrepancies=json.dumps(result.discrepancies or []),
        bank_ref=result.bank_ref,
        retry_after_seconds=result.retry_after_seconds,
        outage_reason=result.outage_reason,
        checked_by_id=current_user.id,
    )
    db.add(bv)
    db.flush()

    # Transition FDR status based on result.
    # SUBMITTED -> VERIFIED is not a direct allowed move; step through UNDER_REVIEW first.
    if result.status == "VERIFIED":
        if record.status == FDRStatus.SUBMITTED:
            transition_status(db, record, FDRStatus.UNDER_REVIEW, current_user,
                              remark="Bank CBS check initiated (Simulated)",
                              privileged_roles={UserRole.BANK_VERIFIER})
        transition_status(db, record, FDRStatus.VERIFIED, current_user,
                          remark="Bank CBS verification passed (Simulated)",
                          privileged_roles={UserRole.BANK_VERIFIER})
    elif result.status == "FAILED":
        # RETURNED is only valid from UNDER_REVIEW; from SUBMITTED use REJECTED
        if record.status == FDRStatus.SUBMITTED:
            transition_status(db, record, FDRStatus.UNDER_REVIEW, current_user,
                              remark="Bank CBS check initiated (Simulated)",
                              privileged_roles={UserRole.BANK_VERIFIER})
        if record.status == FDRStatus.UNDER_REVIEW:
            transition_status(db, record, FDRStatus.RETURNED, current_user,
                              remark=f"Bank CBS mismatch on: {', '.join(result.discrepancies)} (Simulated)",
                              privileged_roles={UserRole.BANK_VERIFIER})
        else:
            transition_status(db, record, FDRStatus.REJECTED, current_user,
                              remark=f"Bank CBS mismatch on: {', '.join(result.discrepancies)} (Simulated)",
                              privileged_roles={UserRole.BANK_VERIFIER})

    # Append to hash-chained audit log
    append_audit_log(
        db,
        action=f"bank_verify_{result.status.lower()}",
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        record_id=fdr_id,
        record_type="FDRRecord",
        payload={
            "result": result.status,
            "discrepancies": result.discrepancies,
            "bank_ref": result.bank_ref,
            "simulated": True,
        },
    )
    db.commit()
    db.refresh(bv)
    return bv
