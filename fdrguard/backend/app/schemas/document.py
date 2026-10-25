from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    fdr_record_id: int
    original_filename: str
    file_size: int
    mime_type: str
    document_type: str
    file_hash: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
