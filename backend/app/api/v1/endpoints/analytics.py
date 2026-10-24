"""
Analytics endpoints — historical trends, scanner stats, top vulnerable repos.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.base import get_db
from app.db.models.project import Scan, Vulnerability, Pipeline, Repository
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends")
def get_vulnerability_trends(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Monthly vulnerability counts for the past N months."""
    results = []
    for i in range(months - 1, -1, -1):
        month_start = (datetime.utcnow().replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)

        scans_in_month = db.query(Scan).filter(
            Scan.started_at >= month_start,
            Scan.started_at < month_end,
        ).count()

        vuln_query = db.query(Vulnerability.severity, func.count(Vulnerability.id)).join(Scan).filter(
            Scan.started_at >= month_start,
            Scan.started_at < month_end,
        ).group_by(Vulnerability.severity).all()

        counts = {row[0]: row[1] for row in vuln_query}
        results.append({
            "month": month_start.strftime("%b"),
            "year": month_start.year,
            "scans": scans_in_month,
            "critical": counts.get("critical", 0),
            "high": counts.get("high", 0),
            "medium": counts.get("medium", 0),
            "low": counts.get("low", 0),
        })
    return results


@router.get("/scanner-breakdown")
def get_scanner_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vulnerability counts per scanner."""
    rows = db.query(
        Vulnerability.scanner,
        Vulnerability.severity,
        func.count(Vulnerability.id).label("count")
    ).group_by(Vulnerability.scanner, Vulnerability.severity).all()

    breakdown: dict = {}
    for row in rows:
        s = row.scanner
        if s not in breakdown:
            breakdown[s] = {"scanner": s, "critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0}
        breakdown[s][row.severity] = breakdown[s].get(row.severity, 0) + row.count
        breakdown[s]["total"] += row.count

    return list(breakdown.values())


@router.get("/top-vulnerable-repos")
def get_top_vulnerable_repos(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Repositories with most open vulnerabilities."""
    repos = db.query(Repository).order_by(Repository.vulnerability_count.desc()).limit(limit).all()
    return [{
        "repository_id": str(r.id),
        "repository": r.name,
        "url": r.url,
        "score": r.security_score or 0.0,
        "grade": r.grade or "F",
        "total": r.vulnerability_count or 0,
    } for r in repos]


@router.get("/pipeline-stats")
def get_pipeline_stats(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pipeline success/failure stats for the past N days."""
    since = datetime.utcnow() - timedelta(days=days)
    total = db.query(Pipeline).filter(Pipeline.started_at >= since).count()
    completed = db.query(Pipeline).filter(Pipeline.started_at >= since, Pipeline.status == "completed").count()
    failed = db.query(Pipeline).filter(Pipeline.started_at >= since, Pipeline.status == "failed").count()
    running = db.query(Pipeline).filter(Pipeline.status == "running").count()

    return {
        "total": total,
        "completed": completed,
        "failed": failed,
        "running": running,
        "success_rate": round((completed / total * 100) if total > 0 else 100.0, 1),
    }


@router.get("/scan-activity")
def get_scan_activity(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily scan counts for the past N days."""
    results = []
    for i in range(days - 1, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(Scan).filter(
            Scan.started_at >= day_start,
            Scan.started_at <= day_end,
        ).count()
        results.append({"date": day.strftime("%b %d"), "value": count})
    return results
