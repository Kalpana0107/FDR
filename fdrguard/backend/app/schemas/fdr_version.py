from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


class FDRVersionOut(BaseModel):
    id: int
    fdr_record_id: int
    version_number: int
    fdr_number: str
    bank_name: str
    branch_name: Optional[str]
    amount: Decimal
    issue_date: datetime
    maturity_date: datetime
    status: str
    remarks: Optional[str]
    changed_by_id: Optional[int]
    diff_summary: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
