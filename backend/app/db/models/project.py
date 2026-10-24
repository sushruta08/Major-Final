"""Project, Repository, Pipeline, Scan, Vulnerability models — SQLite + PostgreSQL."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    security_score = Column(Float, default=100.0)
    grade = Column(String(5), default="A+")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(200), nullable=False)
    url = Column(String(500), nullable=False)
    provider = Column(String(30), default="github")
    default_branch = Column(String(100), default="main")
    is_private = Column(Boolean, default=True)
    webhook_url = Column(String(500), nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    scan_count = Column(Integer, default=0)
    vulnerability_count = Column(Integer, default=0)
    security_score = Column(Float, default=100.0)
    grade = Column(String(5), default="A+")
    last_commit_sha = Column(String(40), nullable=True)
    last_commit_msg = Column(Text, nullable=True)
    last_commit_author = Column(String(200), nullable=True)
    last_commit_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="repositories")
    pipelines = relationship("Pipeline", back_populates="repository", cascade="all, delete-orphan")


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id = Column(String(36), ForeignKey("repositories.id"), nullable=False)
    trigger = Column(String(20), default="manual")
    branch = Column(String(100), default="main")
    commit_sha = Column(String(40), nullable=True)
    commit_message = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)
    triggered_by = Column(String(200), nullable=True)
    stages_result = Column(JSON, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)

    repository = relationship("Repository", back_populates="pipelines")
    scans = relationship("Scan", back_populates="pipeline", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pipeline_id = Column(String(36), ForeignKey("pipelines.id"), nullable=False)
    repository_id = Column(String(36), ForeignKey("repositories.id"), nullable=False)
    scanner_type = Column(String(50), nullable=False)
    status = Column(String(20), default="pending")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)
    total_findings = Column(Integer, default=0)
    critical = Column(Integer, default=0)
    high = Column(Integer, default=0)
    medium = Column(Integer, default=0)
    low = Column(Integer, default=0)
    info = Column(Integer, default=0)
    score = Column(Float, default=100.0)
    raw_output = Column(Text, nullable=True)

    pipeline = relationship("Pipeline", back_populates="scans")
    vulnerabilities = relationship("Vulnerability", back_populates="scan", cascade="all, delete-orphan")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String(36), ForeignKey("scans.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)
    scanner = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=True)
    line_number = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)
    cve_id = Column(String(50), nullable=True, index=True)
    cwe_id = Column(String(50), nullable=True)
    owasp_category = Column(String(20), nullable=True)
    cvss_score = Column(Float, nullable=True)
    fix_recommendation = Column(Text, nullable=True)
    references = Column(JSON, nullable=True)
    status = Column(String(30), default="open")
    false_positive_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scan = relationship("Scan", back_populates="vulnerabilities")
