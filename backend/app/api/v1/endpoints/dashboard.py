"""
Dashboard endpoints — real-time aggregated security metrics from database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer
from datetime import datetime, timedelta

from app.db.base import get_db
from app.db.models.project import Project, Repository, Scan, Pipeline, Vulnerability
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real-time aggregated security metrics."""
    # Vulnerability counts (open only)
    vuln_rows = db.query(
        Vulnerability.severity, func.count(Vulnerability.id).label("count")
    ).filter(Vulnerability.status == "open").group_by(Vulnerability.severity).all()

    counts = {row.severity: row.count for row in vuln_rows}
    critical = counts.get("critical", 0)
    high = counts.get("high", 0)
    medium = counts.get("medium", 0)
    low = counts.get("low", 0)
    total = critical + high + medium + low

    # Score & grade
    score = max(0.0, 100.0 - (
        min(critical * 25, 60) + min(high * 15, 40) +
        min(medium * 7, 25) + min(low * 3, 10)
    ))
    grade = (
        "A+" if score >= 95 else "A" if score >= 85 else
        "B" if score >= 75 else "C" if score >= 60 else
        "D" if score >= 50 else "F"
    )
    scan_trend = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        ds = datetime.combine(day, datetime.min.time())
        de = datetime.combine(day, datetime.max.time())
        cnt = db.query(Scan).filter(Scan.started_at >= ds, Scan.started_at <= de).count()
        scan_trend.append({"date": day.strftime("%b %d"), "value": cnt})

    # Vulnerability trend (last 7 days)
    vuln_trend = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        ds = datetime.combine(day, datetime.min.time())
        de = datetime.combine(day, datetime.max.time())
        cnt = db.query(Vulnerability).filter(
            Vulnerability.created_at >= ds,
            Vulnerability.created_at <= de,
            Vulnerability.status == "open"
        ).count()
        vuln_trend.append({"date": day.strftime("%b %d"), "value": cnt})

    # Top vulnerabilities (critical + high, newest first)
    top_vulns = db.query(Vulnerability).filter(
        Vulnerability.severity.in_(["critical", "high"]),
        Vulnerability.status == "open"
    ).order_by(Vulnerability.created_at.desc()).limit(10).all()

    top_vulns_out = [{
        "id": str(v.id), "title": v.title, "severity": v.severity,
        "scanner": v.scanner, "file_path": v.file_path,
        "line_number": v.line_number, "cve_id": v.cve_id,
        "owasp_category": v.owasp_category, "cvss_score": v.cvss_score,
        "status": v.status, "description": v.description or "",
        "fix_recommendation": v.fix_recommendation or "",
        "created_at": str(v.created_at), "updated_at": str(v.updated_at) if v.updated_at else str(v.created_at),
        "scan_id": str(v.scan_id), "cwe_id": v.cwe_id, "references": v.references or [],
        "code_snippet": v.code_snippet,
    } for v in top_vulns]

    # Recent pipelines
    recent_pipelines = db.query(Pipeline).order_by(Pipeline.started_at.desc()).limit(5).all()
    pipelines_out = []
    for p in recent_pipelines:
        repo = db.query(Repository).filter(Repository.id == p.repository_id).first()
        scans = db.query(Scan).filter(Scan.pipeline_id == p.id).all()
        stages = [{"stage": s.scanner_type, "status": s.status,
                   "findings": s.total_findings or 0, "duration": s.duration} for s in scans]
        pipelines_out.append({
            "id": str(p.id), "repository_id": str(p.repository_id),
            "repository_name": repo.name if repo else "Unknown",
            "project_name": "", "trigger": p.trigger, "branch": p.branch,
            "commit_sha": p.commit_sha or "—", "commit_message": p.commit_message or "",
            "status": p.status, "started_at": str(p.started_at),
            "completed_at": str(p.completed_at) if p.completed_at else None,
            "duration": p.duration, "triggered_by": p.triggered_by or "",
            "stages": stages,
        })

    # Scanner stats
    scanner_rows = db.query(
        Vulnerability.scanner,
        func.count(Vulnerability.id).label("findings")
    ).group_by(Vulnerability.scanner).all()

    scanner_stats = []
    for row in scanner_rows:
        crit = db.query(Vulnerability).filter(
            Vulnerability.scanner == row.scanner,
            Vulnerability.severity == "critical"
        ).count()
        scanner_stats.append({"scanner": row.scanner, "scans": 0, "findings": row.findings, "critical": crit})

    # Risk distribution
    risk_dist = [
        {"name": "Critical", "value": critical, "color": "#ef4444"},
        {"name": "High", "value": high, "color": "#f97316"},
        {"name": "Medium", "value": medium, "color": "#eab308"},
        {"name": "Low", "value": low, "color": "#3b82f6"},
    ]

    # Last scan
    last_scan = db.query(Scan).order_by(Scan.started_at.desc()).first()

    return {
        "security_score": round(score, 1),
        "grade": grade,
        "total_scans": db.query(Scan).count(),
        "active_pipelines": db.query(Pipeline).filter(Pipeline.status == "running").count(),
        "total_vulnerabilities": total,
        "critical_count": critical,
        "high_count": high,
        "medium_count": medium,
        "low_count": low,
        "projects_count": db.query(Project).count(),
        "repositories_count": db.query(Repository).count(),
        "last_scan": str(last_scan.started_at) if last_scan else None,
        "scan_trend": scan_trend,
        "vulnerability_trend": vuln_trend,
        "top_vulnerabilities": top_vulns_out,
        "recent_pipelines": pipelines_out,
        "scanner_stats": scanner_stats,
        "risk_distribution": [r for r in risk_dist if r["value"] > 0],
    }
