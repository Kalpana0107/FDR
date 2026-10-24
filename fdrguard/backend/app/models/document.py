from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from ..core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    fdr_record_id = Column(Integer, ForeignKey("fdr_records.id"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File metadata
    original_filename = Column(String(512), nullable=False)
    storage_key = Column(String(1024), nullable=False, unique=True)  # path or S3 key
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(128), nullable=False)
    document_type = Column(String(50), nullable=False, default="fdr_document")  # fdr_document | supporting

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    fdr_record = relationship("FDRRecord", back_populates="documents")
    uploaded_by = relationship("User")
