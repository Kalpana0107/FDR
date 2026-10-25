import os
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://fdrguard:fdrguard_dev_pass@localhost:5432/fdrguard"

    # JWT — no default; must be set in production
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Environment: "dev" | "staging" | "production"
    ENV: str = "dev"

    # File Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = "../uploads"

    # AWS S3 (optional)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_S3_REGION: str = "ap-south-1"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Legacy alias kept for compatibility
    ENVIRONMENT: str = "development"

    @model_validator(mode="after")
    def require_secret_key(self) -> "Settings":
        if not self.SECRET_KEY:
            if self.ENV == "dev":
                # Use an insecure fallback so dev/test works without .env
                object.__setattr__(
                    self,
                    "SECRET_KEY",
                    "dev-only-insecure-secret-key-do-not-use-in-prod-32chars",
                )
            else:
                raise ValueError(
                    "SECRET_KEY must be set when ENV != 'dev'. "
                    "Set the SECRET_KEY environment variable."
                )
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
