"""
Vulnerability management endpoints — list, update status, get detail.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.base import get_db
from app.db.models.project import Vulnerability, Scan, Repository
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])


class VulnerabilityResponse(BaseModel):
    id: str
    scan_id: str
    title: str
    description: Optional[str]
    severity: str
    scanner: str
    file_path: Optional[str]
    line_number: Optional[int]
    code_snippet: Optional[str]
    cve_id: Optional[str]
    cwe_id: Optional[str]
    owasp_category: Optional[str]
    cvss_score: Optional[float]
    fix_recommendation: Optional[str]
    references: Optional[list]
    status: str
    created_at: str
    updated_at: str


class VulnerabilityStatusUpdate(BaseModel):
    status: str  # open | fixed | accepted | false_positive
    reason: Optional[str] = None


@router.get("/", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(
    repository_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scanner: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all vulnerabilities with rich filtering."""
    query = db.query(Vulnerability)

    if repository_id:
        query = query.join(Scan).filter(Scan.repository_id == repository_id)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if status:
        query = query.filter(Vulnerability.status == status)
    if scanner:
        query = query.filter(Vulnerability.scanner == scanner)
    if search:
        query = query.filter(
            Vulnerability.title.ilike(f"%{search}%") |
            Vulnerability.description.ilike(f"%{search}%") |
            Vulnerability.cve_id.ilike(f"%{search}%")
        )

    vulns = query.order_by(
        Vulnerability.created_at.desc()
    ).offset(skip).limit(limit).all()
    return [_to_response(v) for v in vulns]


@router.get("/{vuln_id}", response_model=VulnerabilityResponse)
def get_vulnerability(
    vuln_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vulnerability detail by ID."""
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return _to_response(vuln)


@router.patch("/{vuln_id}/status")
def update_vulnerability_status(
    vuln_id: str,
    payload: VulnerabilityStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update vulnerability status (fix, accept, mark false positive)."""
    valid_statuses = ["open", "fixed", "accepted", "false_positive"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")

    vuln.status = payload.status
    vuln.updated_at = datetime.utcnow()
    if payload.reason:
        vuln.false_positive_reason = payload.reason
    db.commit()

    return {"message": f"Vulnerability status updated to '{payload.status}'", "id": vuln_id}


@router.get("/stats/summary")
def get_vulnerability_stats(
    repository_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vulnerability count summary grouped by severity."""
    from sqlalchemy import func
    query = db.query(Vulnerability.severity, func.count(Vulnerability.id).label("count"))

    if repository_id:
        query = query.join(Scan).filter(Scan.repository_id == repository_id)

    query = query.filter(Vulnerability.status == "open")
    rows = query.group_by(Vulnerability.severity).all()

    stats = {row.severity: row.count for row in rows}
    total = sum(stats.values())
    score = max(0.0, 100.0 - (
        min(stats.get("critical", 0) * 25, 60) +
        min(stats.get("high", 0) * 15, 40) +
        min(stats.get("medium", 0) * 7, 25) +
        min(stats.get("low", 0) * 3, 10)
    ))

    return {
        "total": total,
        "critical": stats.get("critical", 0),
        "high": stats.get("high", 0),
        "medium": stats.get("medium", 0),
        "low": stats.get("low", 0),
        "info": stats.get("info", 0),
        "security_score": round(score, 1),
    }


def _to_response(v: Vulnerability) -> VulnerabilityResponse:
    return VulnerabilityResponse(
        id=str(v.id), scan_id=str(v.scan_id),
        title=v.title, description=v.description,
        severity=v.severity, scanner=v.scanner,
        file_path=v.file_path, line_number=v.line_number,
        code_snippet=v.code_snippet, cve_id=v.cve_id,
        cwe_id=v.cwe_id, owasp_category=v.owasp_category,
        cvss_score=v.cvss_score, fix_recommendation=v.fix_recommendation,
        references=v.references or [],
        status=v.status,
        created_at=str(v.created_at),
        updated_at=str(v.updated_at) if v.updated_at else str(v.created_at),
    )
