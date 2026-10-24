"""
Repository management endpoints — connect, list, scan, webhook.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.base import get_db
from app.db.models.project import Repository, Project, Pipeline, Scan, Vulnerability
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/repositories", tags=["Repositories"])


# ── Schemas ────────────────────────────────────────────────
class RepositoryCreate(BaseModel):
    project_id: str
    name: str
    url: str
    provider: str = "github"
    default_branch: str = "main"
    is_private: bool = True


class RepositoryResponse(BaseModel):
    id: str
    project_id: str
    name: str
    url: str
    provider: str
    default_branch: str
    is_private: bool
    scan_count: int
    vulnerability_count: int
    security_score: float
    grade: str
    created_at: str
    last_commit_sha: Optional[str] = None
    last_commit_msg: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────

@router.get("/", response_model=List[RepositoryResponse])
def list_repositories(
    project_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all repositories, optionally filtered by project."""
    query = db.query(Repository)
    if project_id:
        query = query.filter(Repository.project_id == project_id)
    repos = query.offset(skip).limit(limit).all()
    return [_to_response(r) for r in repos]


@router.post("/", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(
    payload: RepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Connect a new repository to a project."""
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Check for duplicate URL within project
    existing = db.query(Repository).filter(
        Repository.project_id == payload.project_id,
        Repository.url == payload.url,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Repository already connected")
    repo = Repository(
        project_id=payload.project_id,
        name=payload.name,
        url=payload.url,
        provider=payload.provider,
        default_branch=payload.default_branch,
        is_private=payload.is_private,
        security_score=100.0,
        grade="A+",
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)
    return _to_response(repo)


@router.get("/{repo_id}", response_model=RepositoryResponse)
def get_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get repository details by ID."""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return _to_response(repo)


@router.delete("/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a repository connection."""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if current_user.role not in ["admin", "security_engineer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(repo)
    db.commit()


@router.get("/{repo_id}/stats")
def get_repository_stats(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vulnerability stats for a repository."""
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    pipeline_count = db.query(Pipeline).filter(Pipeline.repository_id == repo_id).count()
    scan_count = db.query(Scan).filter(Scan.repository_id == repo_id).count()
    vuln_count = db.query(Vulnerability).join(Scan).filter(
        Scan.repository_id == repo_id,
        Vulnerability.status == "open",
    ).count()
    return {
        "repository_id": repo_id,
        "pipeline_count": pipeline_count,
        "scan_count": scan_count,
        "open_vulnerabilities": vuln_count,
        "security_score": repo.security_score or 0.0,
        "grade": repo.grade or "C",
    }


def _to_response(repo: Repository) -> RepositoryResponse:
    return RepositoryResponse(
        id=str(repo.id),
        project_id=str(repo.project_id),
        name=repo.name,
        url=repo.url,
        provider=repo.provider,
        default_branch=repo.default_branch,
        is_private=repo.is_private,
        scan_count=repo.scan_count or 0,
        vulnerability_count=repo.vulnerability_count or 0,
        security_score=repo.security_score or 0.0,
        grade=repo.grade or "C",
        created_at=str(repo.created_at),
        last_commit_sha=repo.last_commit_sha,
        last_commit_msg=repo.last_commit_msg,
    )
