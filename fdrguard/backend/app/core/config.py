from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://fdrguard:fdrguard_dev_pass@localhost:5432/fdrguard"

    # JWT
    SECRET_KEY: str = "change_this_to_a_random_secret_key_at_least_32_chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

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

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
