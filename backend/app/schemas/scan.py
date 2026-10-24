"""Pydantic schemas for scans — Pydantic v2 compatible."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScanResponse(BaseModel):
    id: str
    pipeline_id: str
    repository_id: str
    scanner_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    total_findings: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0
    score: float = 0.0

    model_config = {"from_attributes": True}


class PipelineCreate(BaseModel):
    repository_id: str
    branch: str = "main"
    trigger: str = "manual"


class PipelineTriggerResponse(BaseModel):
    pipeline_id: str
    status: str
    message: str


class DashboardMetricsResponse(BaseModel):
    security_score: float
    grade: str
    total_scans: int
    active_pipelines: int
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    projects_count: int
    repositories_count: int
    last_scan: Optional[str] = None

    model_config = {"from_attributes": True}
