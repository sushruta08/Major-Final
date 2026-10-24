"""Report model — compatible with SQLite and PostgreSQL."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.db.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(300), nullable=False)
    project_id = Column(String(36), nullable=True)
    repository_id = Column(String(36), nullable=True)
    type = Column(String(30), nullable=False)
    format = Column(String(10), default="json")
    file_path = Column(String(500), nullable=True)
    created_by = Column(String(36), nullable=False)
    scan_ids = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
