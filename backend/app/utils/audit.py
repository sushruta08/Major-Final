"""
Audit logging utility — records every significant user action.
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


def log_action(
    db,
    user_id: Optional[str],
    username: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """
    Write an audit log entry.

    Args:
        db: SQLAlchemy session
        user_id: UUID of the acting user
        username: Display username
        action: Action code (e.g. CREATE_PROJECT, TRIGGER_SCAN)
        resource_type: Type of affected resource (project, scan, vulnerability)
        resource_id: UUID of affected resource
        details: Additional context as dict
        ip_address: Client IP address
        user_agent: Client User-Agent string
    """
    try:
        from app.db.models.audit import AuditLog  # lazy import to avoid circular
        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
    except Exception as e:
        # Never let audit logging break the main request
        logger.error(f"Audit log write failed: {e}")
