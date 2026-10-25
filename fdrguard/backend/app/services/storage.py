"""
Storage service abstraction.
Stage 1: local filesystem storage.
Future: swap LocalStorageService for S3StorageService without changing callers.

Upload validation:
  - PDF only (application/pdf), detected via python-magic on file bytes.
  - Extension must also be .pdf.
  - Max 10 MB.
"""
import os
import uuid
import re
from abc import ABC, abstractmethod
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from ..core.config import settings

# ── MIME / extension allow-lists ──────────────────────────────────────────────
ALLOWED_MIME_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _sanitize_filename(filename: str) -> str:
    """Remove path traversal characters and keep only safe characters."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w.\-]", "_", filename)
    return filename[:200]  # cap length


def _detect_mime(data: bytes) -> str:
    """Return the MIME type detected from the first bytes of data."""
    try:
        import magic  # python-magic / python-magic-bin
        return magic.from_buffer(data, mime=True)
    except ImportError:
        # Fall back to checking PDF magic bytes if python-magic is unavailable
        if data[:4] == b"%PDF":
            return "application/pdf"
        return "application/octet-stream"


def validate_upload(data: bytes, filename: str) -> None:
    """
    Validate an uploaded file.

    Raises HTTPException (415 or 413) if:
      - The content detected by python-magic is not application/pdf.
      - The file extension is not .pdf.
      - The file exceeds MAX_FILE_SIZE_BYTES (10 MB).
    """
    # Size check
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB.",
        )
    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )

    # Extension check
    ext = ""
    if "." in (filename or ""):
        ext = "." + filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File extension '{ext}' is not allowed. Only PDF files are accepted.",
        )

    # Magic-byte (content) check
    detected_mime = _detect_mime(data)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"File content detected as '{detected_mime}', which is not allowed. "
                "Only PDF files are accepted."
            ),
        )


class StorageService(ABC):
    @abstractmethod
    async def save(self, file: UploadFile, prefix: str) -> tuple[str, int]:
        """Save file, return (storage_key, file_size)."""

    @abstractmethod
    def get_path(self, storage_key: str) -> str:
        """Return filesystem path or presigned URL."""

    @abstractmethod
    def delete(self, storage_key: str) -> None:
        """Delete stored file."""


class LocalStorageService(StorageService):
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, prefix: str = "") -> tuple[str, int]:
        safe_name = _sanitize_filename(file.filename or "upload")
        content = await file.read()

        # Validate before writing
        validate_upload(content, file.filename or "upload")

        unique_key = f"{prefix}/{uuid.uuid4().hex}_{safe_name}".lstrip("/")
        dest = self.base_dir / unique_key
        dest.parent.mkdir(parents=True, exist_ok=True)

        with open(dest, "wb") as f:
            f.write(content)

        return unique_key, len(content)

    def get_path(self, storage_key: str) -> str:
        path = (self.base_dir / storage_key).resolve()
        # Security: ensure path is within base_dir
        if not str(path).startswith(str(self.base_dir)):
            raise ValueError("Invalid storage key")
        return str(path)

    def delete(self, storage_key: str) -> None:
        path = Path(self.get_path(storage_key))
        if path.exists():
            path.unlink()


def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND == "s3":
        # Future: return S3StorageService(...)
        raise NotImplementedError("S3 storage not yet implemented")
    upload_dir = settings.LOCAL_UPLOAD_DIR
    return LocalStorageService(upload_dir)


storage_service = get_storage_service()
