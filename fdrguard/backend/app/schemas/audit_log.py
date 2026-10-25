from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    action: str
    actor_id: Optional[int]
    actor_role: Optional[str]
    record_id: Optional[int]
    record_type: Optional[str]
    payload_snapshot: Optional[str]
    previous_hash: str
    current_hash: str

    model_config = {"from_attributes": True}


class ChainVerifyResult(BaseModel):
    is_valid: bool
    total_records: int
    broken_at_id: Optional[int]
    details: str
