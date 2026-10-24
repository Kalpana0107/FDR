from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.fdr import FDRStatus


class StatusHistoryOut(BaseModel):
    id: int
    from_status: Optional[FDRStatus]
    to_status: FDRStatus
    remark: Optional[str]
    actor_id: int
    actor_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditEventOut(BaseModel):
    id: int
    actor_id: Optional[int]
    fdr_record_id: Optional[int]
    action: str
    metadata_json: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
