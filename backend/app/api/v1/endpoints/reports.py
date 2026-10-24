"""
Reports endpoints — generate and download security reports.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import io, json, csv

from app.db.base import get_db
from app.db.models.project import Vulnerability, Scan
from app.db.models.report import Report
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportCreate(BaseModel):
    title: str
    project_id: Optional[str] = None
    repository_id: Optional[str] = None
    type: str  # executive | developer | compliance | owasp
    format: str = "json"  # json | csv


class ReportResponse(BaseModel):
    id: str
    title: str
    type: str
    format: str
    created_by: str
    created_at: str
    project_id: Optional[str]


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all generated reports."""
    try:
        query = db.query(Report)
        if project_id:
            query = query.filter(Report.project_id == project_id)
        reports = query.order_by(Report.created_at.desc()).limit(50).all()
        return [ReportResponse(
            id=str(r.id), title=r.title, type=r.type,
            format=r.format, created_by=str(r.created_by),
            created_at=str(r.created_at),
            project_id=str(r.project_id) if r.project_id else None,
        ) for r in reports]
    except Exception:
        return []


@router.post("/generate")
def generate_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new security report."""
    # Collect vulnerabilities
    query = db.query(Vulnerability)
    if payload.repository_id:
        query = query.join(Scan).filter(Scan.repository_id == payload.repository_id)
    vulns = query.all()

    findings = [{
        "id": str(v.id),
        "title": v.title,
        "severity": v.severity,
        "scanner": v.scanner,
        "file_path": v.file_path,
        "line_number": v.line_number,
        "cve_id": v.cve_id,
        "cwe_id": v.cwe_id,
        "owasp_category": v.owasp_category,
        "cvss_score": v.cvss_score,
        "fix_recommendation": v.fix_recommendation,
        "status": v.status,
        "created_at": str(v.created_at),
    } for v in vulns]

    # Save report record
    try:
        report = Report(
            title=payload.title,
            project_id=payload.project_id,
            repository_id=payload.repository_id,
            type=payload.type,
            format=payload.format,
            created_by=current_user.id,
            scan_ids=[],
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        report_id = str(report.id)
    except Exception:
        report_id = "generated"

    return {
        "report_id": report_id,
        "title": payload.title,
        "type": payload.type,
        "format": payload.format,
        "total_findings": len(findings),
        "generated_at": datetime.utcnow().isoformat(),
        "download_url": f"/api/v1/reports/{report_id}/download",
    }


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    format: str = Query("json"),
    repository_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a report as JSON or CSV."""
    query = db.query(Vulnerability)
    if repository_id:
        query = query.join(Scan).filter(Scan.repository_id == repository_id)
    vulns = query.all()

    findings = [{
        "id": str(v.id), "title": v.title, "severity": v.severity,
        "scanner": v.scanner, "file_path": v.file_path or "",
        "line_number": v.line_number, "cve_id": v.cve_id or "",
        "cvss_score": v.cvss_score, "status": v.status,
        "fix_recommendation": v.fix_recommendation or "",
    } for v in vulns]

    if format == "csv":
        output = io.StringIO()
        if findings:
            writer = csv.DictWriter(output, fieldnames=findings[0].keys())
            writer.writeheader()
            writer.writerows(findings)
        content = output.getvalue()
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{report_id}.csv"}
        )
    else:
        report_data = {
            "report_id": report_id,
            "generated_at": datetime.utcnow().isoformat(),
            "total_findings": len(findings),
            "findings": findings,
        }
        content = json.dumps(report_data, indent=2)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=report_{report_id}.json"}
        )
