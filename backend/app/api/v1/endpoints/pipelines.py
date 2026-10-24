"""
Pipeline endpoints — list, get detail, cancel, get stage results.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.base import get_db
from app.db.models.project import Pipeline, Scan, Repository
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/pipelines", tags=["Pipelines"])


class PipelineStageResult(BaseModel):
    stage: str
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration: Optional[int] = None
    findings: int = 0


class PipelineResponse(BaseModel):
    id: str
    repository_id: str
    repository_name: str
    trigger: str
    branch: str
    commit_sha: Optional[str]
    commit_message: Optional[str]
    status: str
    started_at: str
    completed_at: Optional[str]
    duration: Optional[int]
    triggered_by: Optional[str]
    stages: List[PipelineStageResult]
    total_findings: int


@router.get("/", response_model=List[PipelineResponse])
def list_pipelines(
    repository_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List pipelines with optional filters."""
    query = db.query(Pipeline).order_by(Pipeline.started_at.desc())
    if repository_id:
        query = query.filter(Pipeline.repository_id == repository_id)
    if status:
        query = query.filter(Pipeline.status == status)
    pipelines = query.offset(skip).limit(limit).all()
    return [_build_response(p, db) for p in pipelines]


@router.get("/{pipeline_id}", response_model=PipelineResponse)
def get_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full pipeline details including all stage results."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return _build_response(pipeline, db)


@router.post("/{pipeline_id}/cancel")
def cancel_pipeline(
    pipeline_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a running pipeline."""
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    if pipeline.status not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel pipeline in '{pipeline.status}' state")
    pipeline.status = "cancelled"
    from datetime import datetime
    pipeline.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "Pipeline cancelled", "pipeline_id": pipeline_id}


def _build_response(pipeline: Pipeline, db: Session) -> PipelineResponse:
    """Build full pipeline response with stages from associated scans."""
    repo = db.query(Repository).filter(Repository.id == pipeline.repository_id).first()
    repo_name = repo.name if repo else "Unknown"

    # Build stages from scans
    scans = db.query(Scan).filter(Scan.pipeline_id == pipeline.id).all()
    scanner_to_stage = {
        "bandit": "static_scan", "semgrep": "static_scan",
        "gitleaks": "secrets_scan", "safety": "dependency_scan",
        "pip_audit": "dependency_scan", "trivy": "container_scan",
    }

    # Build from stored stages_result if available
    stages = []
    if pipeline.stages_result:
        stages = [PipelineStageResult(**s) for s in pipeline.stages_result]
    else:
        # Derive stages from scans
        stage_map: dict = {}
        for scan in scans:
            stage_name = scanner_to_stage.get(scan.scanner_type, scan.scanner_type)
            if stage_name not in stage_map:
                stage_map[stage_name] = PipelineStageResult(
                    stage=stage_name,
                    status=scan.status,
                    started_at=str(scan.started_at) if scan.started_at else None,
                    completed_at=str(scan.completed_at) if scan.completed_at else None,
                    duration=scan.duration,
                    findings=scan.total_findings or 0,
                )
            else:
                # Merge findings for same stage
                stage_map[stage_name].findings += scan.total_findings or 0

        stage_order = ["static_scan", "secrets_scan", "dependency_scan", "container_scan"]
        stages = [stage_map[s] for s in stage_order if s in stage_map]

    total_findings = sum(s.findings for s in stages)

    return PipelineResponse(
        id=str(pipeline.id),
        repository_id=str(pipeline.repository_id),
        repository_name=repo_name,
        trigger=pipeline.trigger,
        branch=pipeline.branch,
        commit_sha=pipeline.commit_sha,
        commit_message=pipeline.commit_message,
        status=pipeline.status,
        started_at=str(pipeline.started_at),
        completed_at=str(pipeline.completed_at) if pipeline.completed_at else None,
        duration=pipeline.duration,
        triggered_by=pipeline.triggered_by,
        stages=stages,
        total_findings=total_findings,
    )
