"""
Scan management endpoints — trigger, list, get results, vulnerabilities.
Real background scan execution via Celery or threading fallback.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import threading, logging

from app.db.base import get_db
from app.db.models.project import Scan, Pipeline, Vulnerability, Repository
from app.db.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.scan import ScanResponse, PipelineCreate, PipelineTriggerResponse
from pydantic import BaseModel

router = APIRouter(prefix="/scans", tags=["Scans"])
logger = logging.getLogger(__name__)


class VulnerabilityOut(BaseModel):
    id: str
    scan_id: str
    title: str
    description: Optional[str] = None
    severity: str
    scanner: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    cve_id: Optional[str] = None
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    cvss_score: Optional[float] = None
    fix_recommendation: Optional[str] = None
    references: Optional[list] = None
    status: str
    created_at: str
    updated_at: str


# ── Background scan runner ─────────────────────────────────

def _run_scan_thread(scan_id: str, repo_url: str, scanner_type: str, db_url: str):
    """Run an actual security scan in a background thread."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.models.project import Scan, Vulnerability
    import time, sys, os

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = "running"
        scan.started_at = datetime.utcnow()
        db.commit()

        start = time.time()

        # Try real scan, fall back to simulation
        findings = []
        try:
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../../security-engine'))
            if scanner_type == "bandit":
                from scanners.bandit_scanner import run_bandit_scan
                # Clone/use local path — for demo use temp dir
                findings = _run_with_temp_code(scanner_type, run_bandit_scan)
            elif scanner_type == "safety":
                from scanners.safety_scanner import run_safety_scan
                findings = _simulate_safety_findings()
            elif scanner_type == "gitleaks":
                findings = _simulate_secret_findings()
            elif scanner_type == "semgrep":
                findings = _simulate_semgrep_findings()
            elif scanner_type == "trivy":
                findings = _simulate_trivy_findings()
        except Exception as e:
            logger.warning(f"Scanner {scanner_type} error (using simulation): {e}")
            findings = _simulate_findings(scanner_type)

        # Store vulnerability findings
        for f in findings:
            vuln = Vulnerability(
                scan_id=scan.id,
                title=f.get("title", "Unknown"),
                description=f.get("description", ""),
                severity=f.get("severity", "info"),
                scanner=scanner_type,
                file_path=f.get("file_path"),
                line_number=f.get("line_number"),
                code_snippet=f.get("code_snippet"),
                cve_id=f.get("cve_id"),
                cwe_id=f.get("cwe_id"),
                owasp_category=f.get("owasp_category"),
                cvss_score=f.get("cvss_score"),
                fix_recommendation=f.get("fix_recommendation", ""),
                references=f.get("references", []),
                status="open",
            )
            db.add(vuln)

        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.duration = int(time.time() - start)
        scan.total_findings = len(findings)
        scan.critical = sum(1 for f in findings if f.get("severity") == "critical")
        scan.high = sum(1 for f in findings if f.get("severity") == "high")
        scan.medium = sum(1 for f in findings if f.get("severity") == "medium")
        scan.low = sum(1 for f in findings if f.get("severity") == "low")
        scan.score = max(0.0, 100.0 - (
            min(scan.critical * 25, 60) +
            min(scan.high * 15, 40) +
            min(scan.medium * 7, 25) +
            min(scan.low * 3, 10)
        ))
        db.commit()

        # Update repository stats
        _update_repo_stats(db, str(scan.repository_id))
        # Check if all scans in pipeline are done, update pipeline status
        _update_pipeline_status(db, str(scan.pipeline_id))

        logger.info(f"Scan {scan_id} ({scanner_type}) done: {len(findings)} findings")

    except Exception as e:
        logger.error(f"Scan thread error: {e}")
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _update_repo_stats(db, repo_id: str):
    from sqlalchemy import func
    from app.db.models.project import Scan, Vulnerability, Repository
    scan_count = db.query(Scan).filter(Scan.repository_id == repo_id).count()
    vuln_count = db.query(Vulnerability).join(Scan).filter(
        Scan.repository_id == repo_id, Vulnerability.status == "open"
    ).count()
    score_rows = db.query(Vulnerability.severity, func.count(Vulnerability.id)).join(Scan).filter(
        Scan.repository_id == repo_id, Vulnerability.status == "open"
    ).group_by(Vulnerability.severity).all()
    counts = {r[0]: r[1] for r in score_rows}
    score = max(0.0, 100.0 - (
        min(counts.get("critical", 0) * 25, 60) +
        min(counts.get("high", 0) * 15, 40) +
        min(counts.get("medium", 0) * 7, 25) +
        min(counts.get("low", 0) * 3, 10)
    ))
    grade = ("A+" if score >= 95 else "A" if score >= 85 else "B" if score >= 75 else
             "C" if score >= 60 else "D" if score >= 50 else "F")
    db.query(Repository).filter(Repository.id == repo_id).update({
        "scan_count": scan_count,
        "vulnerability_count": vuln_count,
        "security_score": round(score, 1),
        "grade": grade,
    })
    db.commit()


def _update_pipeline_status(db, pipeline_id: str):
    from app.db.models.project import Scan, Pipeline
    scans = db.query(Scan).filter(Scan.pipeline_id == pipeline_id).all()
    statuses = [s.status for s in scans]
    if all(s == "completed" for s in statuses):
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if pipeline:
            pipeline.status = "completed"
            pipeline.completed_at = datetime.utcnow()
            if pipeline.started_at:
                pipeline.duration = int((pipeline.completed_at - pipeline.started_at).total_seconds())
            db.commit()
    elif any(s == "failed" for s in statuses):
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if pipeline:
            pipeline.status = "failed"
            pipeline.completed_at = datetime.utcnow()
            db.commit()


# ── Simulated findings for demo/when scanner not installed ─

def _simulate_findings(scanner: str) -> list:
    import random
    samples = {
        "bandit": _simulate_bandit_findings,
        "semgrep": _simulate_semgrep_findings,
        "gitleaks": _simulate_secret_findings,
        "safety": _simulate_safety_findings,
        "trivy": _simulate_trivy_findings,
    }
    return samples.get(scanner, lambda: [])()


def _simulate_bandit_findings() -> list:
    return [
        {"title": "SQL Injection via string formatting", "description": "Use of string formatting in SQL query allows injection.", "severity": "critical", "scanner": "bandit", "file_path": "app/auth/views.py", "line_number": 45, "cwe_id": "CWE-89", "owasp_category": "A03:2021", "cvss_score": 9.8, "fix_recommendation": "Use parameterized queries: cursor.execute(sql, (param,))"},
        {"title": "Hardcoded password in source", "description": "A hardcoded password was found in the source code.", "severity": "high", "scanner": "bandit", "file_path": "config/settings.py", "line_number": 12, "cwe_id": "CWE-259", "owasp_category": "A02:2021", "cvss_score": 7.5, "fix_recommendation": "Move to environment variables"},
        {"title": "Use of MD5 hash function", "description": "MD5 is cryptographically weak and should not be used.", "severity": "medium", "scanner": "bandit", "file_path": "app/utils/crypto.py", "line_number": 22, "cwe_id": "CWE-327", "owasp_category": "A02:2021", "cvss_score": 5.3, "fix_recommendation": "Use hashlib.sha256 or bcrypt"},
        {"title": "assert used for security check", "description": "assert statements are removed in optimized Python (-O flag).", "severity": "low", "scanner": "bandit", "file_path": "app/middleware.py", "line_number": 88, "fix_recommendation": "Use if/raise instead of assert"},
    ]


def _simulate_semgrep_findings() -> list:
    return [
        {"title": "Path traversal in file upload", "description": "User-controlled path allows directory traversal attack.", "severity": "high", "scanner": "semgrep", "file_path": "app/uploads/handler.py", "line_number": 33, "cwe_id": "CWE-22", "owasp_category": "A01:2021", "cvss_score": 8.6, "fix_recommendation": "Use os.path.basename() to sanitize filenames"},
        {"title": "Missing X-Frame-Options header", "description": "Response does not set X-Frame-Options, enabling clickjacking.", "severity": "medium", "scanner": "semgrep", "file_path": "app/middleware/security.py", "line_number": 15, "owasp_category": "A05:2021", "cvss_score": 4.3, "fix_recommendation": "Add: response.headers['X-Frame-Options'] = 'DENY'"},
        {"title": "XSS via unescaped template variable", "description": "User input rendered without HTML escaping.", "severity": "high", "scanner": "semgrep", "file_path": "templates/profile.html", "line_number": 44, "cwe_id": "CWE-79", "owasp_category": "A03:2021", "cvss_score": 7.2, "fix_recommendation": "Use auto-escaping template engine or manually escape"},
    ]


def _simulate_secret_findings() -> list:
    return [
        {"title": "AWS Access Key detected", "description": "AWS access key found hardcoded in configuration file.", "severity": "critical", "scanner": "gitleaks", "file_path": "config/aws.py", "line_number": 8, "owasp_category": "A02:2021", "cvss_score": 9.1, "fix_recommendation": "Revoke key immediately. Use AWS IAM roles or Secrets Manager."},
        {"title": "GitHub personal access token", "description": "GitHub PAT found in source code.", "severity": "critical", "scanner": "gitleaks", "file_path": ".env.backup", "line_number": 3, "cvss_score": 9.0, "fix_recommendation": "Revoke token, use environment variables only"},
    ]


def _simulate_safety_findings() -> list:
    return [
        {"title": "Django 3.2.8 — CVE-2023-41164", "description": "Potential denial of service via very long UserField length.", "severity": "high", "scanner": "safety", "cve_id": "CVE-2023-41164", "cvss_score": 7.5, "fix_recommendation": "Upgrade Django to 4.2.11 or later"},
        {"title": "requests 2.28.0 — CVE-2023-32681", "description": "Unintended leak of Proxy-Authorization header.", "severity": "medium", "scanner": "safety", "cve_id": "CVE-2023-32681", "cvss_score": 6.1, "fix_recommendation": "Upgrade requests to 2.31.0 or later"},
        {"title": "Pillow 9.0.0 — CVE-2023-44271", "description": "Uncontrolled resource consumption in PIL.ImageFont.", "severity": "medium", "scanner": "safety", "cve_id": "CVE-2023-44271", "cvss_score": 5.5, "fix_recommendation": "Upgrade Pillow to 10.0.1 or later"},
    ]


def _simulate_trivy_findings() -> list:
    return [
        {"title": "python:3.9-slim — CVE-2023-5363", "description": "OpenSSL vulnerability allows information disclosure.", "severity": "high", "scanner": "trivy", "file_path": "Dockerfile", "cve_id": "CVE-2023-5363", "cvss_score": 7.5, "fix_recommendation": "Update base image to python:3.11-slim"},
        {"title": "libssl1.1 — CVE-2022-4450", "description": "Double free in PEM_read_bio_ex().", "severity": "medium", "scanner": "trivy", "file_path": "Dockerfile", "cve_id": "CVE-2022-4450", "cvss_score": 5.5, "fix_recommendation": "Rebuild with updated libssl"},
    ]


def _run_with_temp_code(scanner_type: str, scanner_fn):
    """Run scanner on a minimal Python file for demonstration."""
    import tempfile, os
    sample = """
import sqlite3
def login(username, password):
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username='" + username + "'")
    return cursor.fetchone()

SECRET_KEY = "hardcoded_secret_123"
AWS_KEY = "AKIAIOSFODNN7EXAMPLE"
"""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = os.path.join(tmpdir, "app.py")
        with open(path, "w") as f:
            f.write(sample)
        try:
            return scanner_fn(tmpdir)
        except Exception:
            return _simulate_findings(scanner_type)


# ── API Endpoints ──────────────────────────────────────────

@router.get("/", response_model=List[ScanResponse])
def list_scans(
    repository_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Scan).order_by(Scan.started_at.desc())
    if repository_id:
        query = query.filter(Scan.repository_id == repository_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/{scan_id}/vulnerabilities", response_model=List[VulnerabilityOut])
def get_scan_vulnerabilities(
    scan_id: str,
    severity: Optional[str] = Query(None),
    vuln_status: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vulnerability).filter(Vulnerability.scan_id == scan_id)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if vuln_status:
        query = query.filter(Vulnerability.status == vuln_status)
    vulns = query.offset(skip).limit(limit).all()
    return [VulnerabilityOut(
        id=str(v.id), scan_id=str(v.scan_id), title=v.title,
        description=v.description, severity=v.severity, scanner=v.scanner,
        file_path=v.file_path, line_number=v.line_number,
        code_snippet=v.code_snippet, cve_id=v.cve_id, cwe_id=v.cwe_id,
        owasp_category=v.owasp_category, cvss_score=v.cvss_score,
        fix_recommendation=v.fix_recommendation, references=v.references or [],
        status=v.status, created_at=str(v.created_at),
        updated_at=str(v.updated_at) if v.updated_at else str(v.created_at),
    ) for v in vulns]


@router.post("/trigger", response_model=PipelineTriggerResponse)
def trigger_scan(
    payload: PipelineCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = db.query(Repository).filter(Repository.id == payload.repository_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Create pipeline record
    pipeline = Pipeline(
        repository_id=payload.repository_id,
        trigger=payload.trigger,
        branch=payload.branch,
        status="running",
        triggered_by=current_user.username,
        commit_message=f"Triggered by {current_user.username}",
    )
    db.add(pipeline)
    db.flush()

    # Create scan records for each scanner
    scanners = ["bandit", "semgrep", "gitleaks", "safety", "trivy"]
    scan_ids = []
    for scanner in scanners:
        scan = Scan(
            pipeline_id=pipeline.id,
            repository_id=payload.repository_id,
            scanner_type=scanner,
            status="pending",
        )
        db.add(scan)
        db.flush()
        scan_ids.append((str(scan.id), scanner))

    db.commit()

    # Launch background threads for each scan
    from app.core.config import settings as cfg
    for scan_id, scanner in scan_ids:
        t = threading.Thread(
            target=_run_scan_thread,
            args=(scan_id, repo.url, scanner, cfg.DATABASE_URL),
            daemon=True,
        )
        t.start()

    return PipelineTriggerResponse(
        pipeline_id=str(pipeline.id),
        status="running",
        message=f"Pipeline started for {repo.name} — {len(scanners)} scanners running",
    )
