from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from ..models.bank_verification import BankCheckStatus


class BankVerifyOut(BaseModel):
    id: int
    fdr_record_id: int
    result: BankCheckStatus
    simulated: bool
    submitted_snapshot: Optional[str]
    bank_snapshot: Optional[str]
    discrepancies: Optional[str]  # JSON list
    bank_ref: Optional[str]
    retry_after_seconds: Optional[int]
    outage_reason: Optional[str]
    checked_at: datetime

    model_config = {"from_attributes": True}


class ReminderOut(BaseModel):
    fdr_record_id: int
    fdr_number: str
    milestone: str          # "90" | "60" | "30"
    days_remaining: int
    maturity_date: str      # ISO date
    institution_name: Optional[str]
    triggered_at: str       # ISO datetime
    already_sent: bool      # True if this was a duplicate (suppressed)


class DashboardStats(BaseModel):
    verified_count: int
    pending_count: int
    failed_count: int
    total_active_value: str   # Decimal as string to avoid float


class RadarMetrics(BaseModel):
    bank_concentration_risk: float       # 0-100
    approaching_maturity_risk: float     # 0-100
    documentation_discrepancy_rate: float
    bank_response_outage_index: float
    release_compliance_rate: float
