"""
Project management endpoints — full CRUD for projects and members.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.db.base import get_db
from app.db.models.project import Project, Repository
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["Projects"])


# ── Schemas ────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    security_score: float
    grade: str
    repository_count: int
    created_at: str
    updated_at: Optional[str]

    class Config:
        from_attributes = True


# ── Endpoints ──────────────────────────────────────────────

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects the current user has access to."""
    projects = db.query(Project).offset(skip).limit(limit).all()
    result = []
    for p in projects:
        repo_count = db.query(Repository).filter(Repository.project_id == p.id).count()
        result.append(ProjectResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            owner_id=str(p.owner_id),
            security_score=p.security_score or 0.0,
            grade=p.grade or "C",
            repository_count=repo_count,
            created_at=str(p.created_at),
            updated_at=str(p.updated_at) if p.updated_at else None,
        ))
    return result


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project."""
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
        security_score=100.0,
        grade="A+",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        owner_id=str(project.owner_id), security_score=project.security_score,
        grade=project.grade, repository_count=0,
        created_at=str(project.created_at), updated_at=None,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    repo_count = db.query(Repository).filter(Repository.project_id == project.id).count()
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        owner_id=str(project.owner_id), security_score=project.security_score or 0.0,
        grade=project.grade or "C", repository_count=repo_count,
        created_at=str(project.created_at), updated_at=str(project.updated_at) if project.updated_at else None,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update project name or description."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project.owner_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this project")
    if payload.name:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    repo_count = db.query(Repository).filter(Repository.project_id == project.id).count()
    return ProjectResponse(
        id=str(project.id), name=project.name, description=project.description,
        owner_id=str(project.owner_id), security_score=project.security_score or 0.0,
        grade=project.grade or "C", repository_count=repo_count,
        created_at=str(project.created_at), updated_at=str(project.updated_at),
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project and all associated data."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role not in ["admin"] and str(project.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(project)
    db.commit()
