from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.release_request import ReleaseStatus


class ReleaseRequestCreate(BaseModel):
    reason: Optional[str] = None


class ReleaseApprove(BaseModel):
    decision_remark: Optional[str] = None


class ReleaseRequestOut(BaseModel):
    id: int
    fdr_record_id: int
    status: ReleaseStatus
    reason: Optional[str]
    requester_id: int
    requested_at: datetime
    approver_id: Optional[int]
    decision_at: Optional[datetime]
    decision_remark: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
