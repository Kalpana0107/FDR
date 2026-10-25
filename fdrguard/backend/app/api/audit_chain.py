"""
Audit chain endpoints.

GET  /api/v1/audit/chain         – paginated log entries (admin only)
GET  /api/v1/audit/verify-chain  – full chain integrity verification (admin only)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.user import User
from ..models.audit_log import AuditLog
from ..schemas.audit_log import AuditLogOut, ChainVerifyResult
from ..services.hash_chain import verify_chain

router = APIRouter(prefix="/v1/audit", tags=["Audit Chain"])


@router.get("/chain", response_model=list[AuditLogOut])
def get_audit_chain(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Return paginated audit log entries in insertion order."""
    return db.query(AuditLog).order_by(AuditLog.id.asc()).offset(skip).limit(limit).all()


@router.get("/verify-chain", response_model=ChainVerifyResult)
def verify_audit_chain(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Traverse all audit log entries, recompute SHA-256 hashes, and
    verify both the previous-hash linkage and the stored current_hash.
    """
    return verify_chain(db)
