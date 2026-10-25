"""
Analytics dashboard endpoints.

GET /api/v1/dashboard/stats   – KPI counts + total active value
GET /api/v1/dashboard/radar   – 5-axis radar metrics (0-100 normalized)
"""
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_admin
from ..models.user import User
from ..models.fdr import FDRRecord, FDRStatus
from ..models.bank_verification import BankVerification, BankCheckStatus
from ..models.institution import Institution
from ..models.release_request import ReleaseRequest, ReleaseStatus
from ..schemas.analytics import DashboardStats, RadarMetrics

router = APIRouter(prefix="/v1/dashboard", tags=["Analytics Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Real-time KPI counts pulled directly from the DB."""

    def _count(status: FDRStatus) -> int:
        return db.query(FDRRecord).filter(FDRRecord.status == status).count()

    def _bv_count(result: BankCheckStatus) -> int:
        return db.query(BankVerification).filter(BankVerification.result == result).count()

    # Total active escrow value (Active + Maturing + Release in Progress)
    total_active_value: Decimal = db.query(
        func.coalesce(func.sum(FDRRecord.amount), Decimal("0"))
    ).filter(
        FDRRecord.status.in_([FDRStatus.ACTIVE, FDRStatus.MATURING, FDRStatus.RELEASE_IN_PROGRESS])
    ).scalar() or Decimal("0")

    return DashboardStats(
        verified_count=_count(FDRStatus.VERIFIED) + _count(FDRStatus.ACTIVE),
        pending_count=_count(FDRStatus.SUBMITTED) + _count(FDRStatus.UNDER_REVIEW),
        failed_count=_bv_count(BankCheckStatus.FAILED) + _count(FDRStatus.REJECTED),
        total_active_value=str(total_active_value),
    )


@router.get("/radar", response_model=RadarMetrics)
def dashboard_radar(
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Five-axis radar metrics normalized to 0-100.

    1. Bank Concentration Risk      — Herfindahl index on bank_name distribution
    2. Approaching Maturity Risk    — % of Active FDRs with ≤90 days to maturity
    3. Documentation Discrepancy Rate — FAILED bank checks / total checks × 100
    4. Bank Response Outage Index   — VERIFICATION_PENDING checks / total × 100
    5. Release Compliance Rate      — APPROVED releases / total release requests × 100
    """
    from ..services.demo_clock import get_current_time
    today = get_current_time().date()

    # ── 1. Bank Concentration Risk (HHI) ─────────────────────────────────────
    bank_rows = db.query(
        FDRRecord.bank_name,
        func.count(FDRRecord.id).label("cnt"),
    ).group_by(FDRRecord.bank_name).all()

    total_fdrs = sum(r.cnt for r in bank_rows) or 1
    hhi = sum((r.cnt / total_fdrs) ** 2 for r in bank_rows)  # 0..1
    bank_concentration_risk = round(hhi * 100, 2)

    # ── 2. Approaching Maturity Risk ──────────────────────────────────────────
    active_total = db.query(FDRRecord).filter(
        FDRRecord.status.in_([FDRStatus.ACTIVE, FDRStatus.MATURING])
    ).count() or 1

    from datetime import timedelta
    cutoff = today + timedelta(days=90)
    maturing_soon = db.query(FDRRecord).filter(
        FDRRecord.status.in_([FDRStatus.ACTIVE, FDRStatus.MATURING]),
        FDRRecord.maturity_date <= cutoff,
    ).count()
    approaching_maturity_risk = round((maturing_soon / active_total) * 100, 2)

    # ── 3. Documentation Discrepancy Rate ────────────────────────────────────
    total_bv = db.query(BankVerification).count() or 1
    failed_bv = db.query(BankVerification).filter(
        BankVerification.result == BankCheckStatus.FAILED
    ).count()
    documentation_discrepancy_rate = round((failed_bv / total_bv) * 100, 2)

    # ── 4. Bank Response Outage Index ─────────────────────────────────────────
    pending_bv = db.query(BankVerification).filter(
        BankVerification.result == BankCheckStatus.VERIFICATION_PENDING
    ).count()
    bank_response_outage_index = round((pending_bv / total_bv) * 100, 2)

    # ── 5. Release Compliance Rate ────────────────────────────────────────────
    total_rel = db.query(ReleaseRequest).count() or 1
    approved_rel = db.query(ReleaseRequest).filter(
        ReleaseRequest.status == ReleaseStatus.APPROVED
    ).count()
    release_compliance_rate = round((approved_rel / total_rel) * 100, 2)

    return RadarMetrics(
        bank_concentration_risk=bank_concentration_risk,
        approaching_maturity_risk=approaching_maturity_risk,
        documentation_discrepancy_rate=documentation_discrepancy_rate,
        bank_response_outage_index=bank_response_outage_index,
        release_compliance_rate=release_compliance_rate,
    )
