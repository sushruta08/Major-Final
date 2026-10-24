"""Notification model — compatible with SQLite and PostgreSQL."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info")
    channel = Column(String(30), default="in_app")
    is_read = Column(Boolean, default=False)
    related_id = Column(String(36), nullable=True)
    related_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
