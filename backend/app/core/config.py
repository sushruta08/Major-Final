"""
Application configuration — reads from .env file.
Falls back to SQLite for local development if DATABASE_URL not set.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "SecureCI - Security Automation Framework"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "dev-secureci-secret-key-change-in-production-32c"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database — defaults to SQLite if not overridden
    DATABASE_URL: str = "sqlite:///./secureci.db"

    # Redis (optional — only needed for Celery workers)
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS — allow frontend dev server and any Render deployment
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "https://secureci-frontend.onrender.com",
    ]

    @property
    def cors_origins(self) -> List[str]:
        """
        Merge static origins with any extra ones supplied via the
        ALLOWED_ORIGINS env var (comma-separated) at runtime.
        This lets Render inject the real URL without code changes.
        """
        import os
        extra = os.environ.get("ALLOWED_ORIGINS", "")
        extras = [o.strip() for o in extra.split(",") if o.strip()]
        return list(dict.fromkeys(self.ALLOWED_ORIGINS + extras))

    # Notifications (optional)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SLACK_WEBHOOK_URL: str = ""
    DISCORD_WEBHOOK_URL: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
