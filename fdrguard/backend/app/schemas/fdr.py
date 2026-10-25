from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator
from ..models.fdr import FDRStatus
from .document import DocumentOut
from .audit import StatusHistoryOut


class FDRCreate(BaseModel):
    fdr_number: str
    bank_name: str
    branch_name: Optional[str] = None
    amount: Decimal
    currency: str = "INR"
    issue_date: date
    maturity_date: date
    purpose: str
    remarks: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v

    @model_validator(mode="after")
    def maturity_after_issue(self):
        if self.maturity_date <= self.issue_date:
            raise ValueError("Maturity date must be later than issue date")
        return self


class FDRUpdate(BaseModel):
    fdr_number: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    issue_date: Optional[date] = None
    maturity_date: Optional[date] = None
    purpose: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("amount", mode="before")
    @classmethod
    def amount_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v


class FDRListItem(BaseModel):
    id: int
    application_id: str
    institution_id: int
    institution_name: Optional[str] = None
    fdr_number: str
    bank_name: str
    amount: Decimal
    currency: str
    issue_date: date
    maturity_date: date
    purpose: str
    status: FDRStatus
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class FDRDetail(FDRListItem):
    branch_name: Optional[str]
    remarks: Optional[str]
    admin_remark: Optional[str]
    submitted_by_id: int
    submitted_by_name: Optional[str] = None
    documents: List[DocumentOut] = []
    status_history: List[StatusHistoryOut] = []

    model_config = {"from_attributes": True}


class AdminStatusUpdate(BaseModel):
    new_status: FDRStatus
    remark: Optional[str] = None

    @model_validator(mode="after")
    def remark_required_for_return_reject(self):
        if self.new_status in (FDRStatus.RETURNED, FDRStatus.REJECTED):
            if not self.remark or not self.remark.strip():
                raise ValueError("A remark is required when returning or rejecting a record")
        return self


class CollegeDashboardStats(BaseModel):
    total: int
    draft: int
    submitted: int
    under_review: int
    returned: int
    verified: int
    rejected: int
    # Extended statuses
    active: int = 0
    maturing: int = 0
    released: int = 0
    withdrawn: int = 0


class AdminDashboardStats(BaseModel):
    total_submitted: int
    awaiting_review: int
    under_review: int
    verified: int
    returned: int
    rejected: int


class PaginatedFDRList(BaseModel):
    items: List[FDRListItem]
    total: int
    page: int
    page_size: int
    pages: int
