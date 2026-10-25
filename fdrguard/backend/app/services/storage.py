"""
Storage service abstraction.
Stage 1: local filesystem storage.
Future: swap LocalStorageService for S3StorageService without changing callers.
"""
import os
import uuid
import re
from abc import ABC, abstractmethod
from pathlib import Path
from fastapi import UploadFile
from ..core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/tiff",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def _sanitize_filename(filename: str) -> str:
    """Remove path traversal characters and keep only safe characters."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w.\-]", "_", filename)
    return filename[:200]  # cap length


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
        unique_key = f"{prefix}/{uuid.uuid4().hex}_{safe_name}".lstrip("/")
        dest = self.base_dir / unique_key
        dest.parent.mkdir(parents=True, exist_ok=True)

        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB.")
        if file_size == 0:
            raise ValueError("Uploaded file is empty.")

        with open(dest, "wb") as f:
            f.write(content)

        return unique_key, file_size

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
