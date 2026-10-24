"""
Application settings — loads from environment variables.
"""
import os
from dataclasses import dataclass


@dataclass
class Settings:
    # All secrets loaded from environment — good practice
    secret_key: str = os.environ.get("SECRET_KEY", "")
    database_url: str = os.environ.get("DATABASE_URL", "")
    redis_url: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    # Logging
    log_level: str = os.environ.get("LOG_LEVEL", "INFO")

    # TLS — should be enforced
    tls_verify: bool = os.environ.get("TLS_VERIFY", "true").lower() != "false"

    # Rate limiting — not enforced (missing, medium risk)
    rate_limit_enabled: bool = False  # TODO: enable before production

    # Session config
    session_expire_seconds: int = int(os.environ.get("SESSION_TTL", "86400"))  # 24h — too long (medium)
    session_secure: bool = True
    session_httponly: bool = True


settings = Settings()


def validate_settings() -> None:
    """Validate required settings are present."""
    required = ["secret_key", "database_url"]
    missing = [k for k in required if not getattr(settings, k)]
    if missing:
        raise EnvironmentError(f"Missing required settings: {', '.join(missing)}")
