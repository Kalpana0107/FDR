"""
Document version history & QR receipt verification.

GET /api/v1/fdr/{fdr_id}/versions      – full version list for an FDR
GET /api/v1/fdr/{fdr_id}/receipt       – cryptographic receipt payload + QR data
GET /api/v1/receipts/verify?token=...  – public endpoint: verify a QR token
"""
import hashlib
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User, UserRole
from ..models.fdr import FDRRecord
from ..models.fdr_version import FDRVersion
from ..models.audit_log import AuditLog
from ..schemas.fdr_version import FDRVersionOut

router = APIRouter(tags=["Versions & Receipts"])

_COLLEGE_ROLES = {UserRole.COLLEGE_USER, UserRole.COLLEGE}


def _load_fdr_owned(fdr_id: int, current_user: User, db: Session) -> FDRRecord:
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
        joinedload(FDRRecord.versions),
    ).filter(FDRRecord.id == fdr_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="FDR record not found")
    if current_user.role in _COLLEGE_ROLES and record.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied — wrong college")
    return record


# ── Version history ────────────────────────────────────────────────────────────

@router.get("/v1/fdr/{fdr_id}/versions", response_model=list[FDRVersionOut])
def get_versions(
    fdr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all stored FDR snapshots in ascending version order."""
    record = _load_fdr_owned(fdr_id, current_user, db)
    return record.versions


# ── Receipt generation ─────────────────────────────────────────────────────────

def _build_receipt_token(fdr_id: int, current_hash: str, status: str, issued_at: str) -> str:
    """
    Deterministic token = SHA-256 of the receipt payload fields.
    Used as the scannable QR code payload.
    """
    raw = f"{fdr_id}|{current_hash}|{status}|{issued_at}"
    return hashlib.sha256(raw.encode()).hexdigest()


@router.get("/v1/fdr/{fdr_id}/receipt")
def get_receipt(
    fdr_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a digital receipt payload with a verifiable QR token.
    The QR code data contains: fdr_id, current_hash, verification_status, timestamp.
    """
    record = _load_fdr_owned(fdr_id, current_user, db)

    # Get the most recent AuditLog hash for this FDR
    last_log = db.query(AuditLog).filter(
        AuditLog.record_id == fdr_id,
        AuditLog.record_type == "FDRRecord",
    ).order_by(AuditLog.id.desc()).first()

    current_hash = last_log.current_hash if last_log else "0" * 64
    issued_at = datetime.now(timezone.utc).isoformat()

    token = _build_receipt_token(fdr_id, current_hash, record.status.value, issued_at)

    institution_name = record.institution.name if record.institution else "Unknown"

    return {
        "fdr_id": fdr_id,
        "fdr_number": record.fdr_number,
        "institution_name": institution_name,
        "amount": str(record.amount),
        "currency": record.currency,
        "bank_name": record.bank_name,
        "issue_date": record.issue_date.isoformat(),
        "maturity_date": record.maturity_date.isoformat(),
        "verification_status": record.status.value,
        "current_hash": current_hash,
        "issued_at": issued_at,
        "issuer": "All India Council for Technical Education (AICTE)",
        "simulated": True,                     # ← always shown in UI
        "qr_payload": {
            "fdr_id": fdr_id,
            "current_hash": current_hash,
            "verification_status": record.status.value,
            "timestamp": issued_at,
            "token": token,
        },
    }


# ── QR receipt verification (public/semi-public) ───────────────────────────────

@router.get("/v1/receipts/verify")
def verify_receipt(
    token: str = Query(..., description="SHA-256 token from the QR code payload"),
    fdr_id: int = Query(..., description="FDR ID from the QR code payload"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint: accepts a scanned QR token and verifies FDR authenticity.
    No auth required — anyone with the QR code can verify.
    """
    record = db.query(FDRRecord).options(
        joinedload(FDRRecord.institution),
    ).filter(FDRRecord.id == fdr_id).first()

    if not record:
        return {"valid": False, "reason": "FDR not found"}

    # Recreate all possible recent hashes for this FDR
    last_logs = db.query(AuditLog).filter(
        AuditLog.record_id == fdr_id,
        AuditLog.record_type == "FDRRecord",
    ).order_by(AuditLog.id.desc()).limit(10).all()

    for log in last_logs:
        candidate_token = _build_receipt_token(
            fdr_id, log.current_hash, record.status.value, log.timestamp.isoformat()
        )
        if candidate_token == token:
            return {
                "valid": True,
                "fdr_id": fdr_id,
                "fdr_number": record.fdr_number,
                "status": record.status.value,
                "institution_name": record.institution.name if record.institution else None,
                "matched_audit_entry_id": log.id,
                "simulated": True,
            }

    # Token not matched — still return basic FDR info but flag invalid
    return {
        "valid": False,
        "reason": "Token not found in recent audit chain for this FDR",
        "fdr_id": fdr_id,
        "fdr_number": record.fdr_number,
        "status": record.status.value,
    }
