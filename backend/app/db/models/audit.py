"""Audit log model — compatible with SQLite and PostgreSQL."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String as SA_String
from app.db.base import Base, settings


def uuid_col(**kwargs):
    """UUID column — string for SQLite, native UUID for PostgreSQL."""
    if settings.DATABASE_URL.startswith("sqlite"):
        return Column(String(36), **kwargs)
    from sqlalchemy.dialects.postgresql import UUID
    return Column(UUID(as_uuid=True), **kwargs)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    username = Column(String(100))
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
