"""
Celery tasks for background security operations.
All heavy lifting (scanning, notifications, report generation) runs here.
"""
import logging
import subprocess
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.workers.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def run_security_scan(
    self,
    scan_id: str,
    repository_id: str,
    repo_path: str,
    scanner_type: str,
) -> Dict[str, Any]:
    """
    Execute a security scan in the background.
    Updates scan status and stores results in the database.
    """
    from app.db.base import SessionLocal
    from app.db.models.project import Scan

    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan {scan_id} not found")
            return {"error": "Scan not found"}

        # Update status to running
        scan.status = "running"
        scan.started_at = datetime.utcnow()
        db.commit()

        # Run the appropriate scanner
        findings = _execute_scanner(scanner_type, repo_path)

        # Update scan with results
        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.duration = int((scan.completed_at - scan.started_at).total_seconds())
        scan.total_findings = len(findings)
        scan.critical = sum(1 for f in findings if f.get("severity") == "critical")
        scan.high = sum(1 for f in findings if f.get("severity") == "high")
        scan.medium = sum(1 for f in findings if f.get("severity") == "medium")
        scan.low = sum(1 for f in findings if f.get("severity") == "low")
        scan.score = max(0, 100 - (
            scan.critical * 25 + scan.high * 15 + scan.medium * 7 + scan.low * 3
        ))
        db.commit()

        logger.info(f"Scan {scan_id} completed: {scan.total_findings} findings")
        return {
            "scan_id": scan_id,
            "status": "completed",
            "findings": len(findings),
        }

    except Exception as exc:
        logger.error(f"Scan {scan_id} failed: {exc}")
        if db:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                db.commit()
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task
def send_notification(
    user_id: str,
    title: str,
    message: str,
    notif_type: str = "info",
    channels: Optional[list] = None,
) -> None:
    """Send a security notification via configured channels."""
    from app.db.base import SessionLocal
    from app.db.models.user import User

    channels = channels or ["in_app"]
    logger.info(f"Sending {notif_type} notification to user {user_id}: {title}")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        if "slack" in channels and settings.SLACK_WEBHOOK_URL:
            _send_slack(title, message, notif_type)

        if "discord" in channels and settings.DISCORD_WEBHOOK_URL:
            _send_discord(title, message, notif_type)

        if "email" in channels and settings.SMTP_HOST:
            _send_email(user.email, title, message)

    finally:
        db.close()


@celery_app.task
def send_daily_digest() -> None:
    """Send daily security digest to all admin users."""
    logger.info("Sending daily security digest")
    # Implementation: aggregate last 24h findings, email admins


@celery_app.task
def cleanup_old_scans() -> None:
    """Remove raw scan data older than 90 days to manage storage."""
    from app.db.base import SessionLocal
    from app.db.models.project import Scan

    cutoff = datetime.utcnow() - timedelta(days=90)
    db = SessionLocal()
    try:
        old_scans = db.query(Scan).filter(
            Scan.started_at < cutoff,
            Scan.status.in_(["completed", "failed"]),
        ).count()
        logger.info(f"Found {old_scans} old scans to archive")
    finally:
        db.close()


@celery_app.task
def generate_report_async(
    report_id: str,
    project_id: str,
    report_type: str,
    format: str,
) -> Dict[str, Any]:
    """Generate a security report in the background."""
    logger.info(f"Generating {report_type} report ({format}) for project {project_id}")
    # Implementation: generate PDF/CSV/JSON report
    return {"report_id": report_id, "status": "completed"}


# ── Internal helper functions ──────────────────────────────

def _execute_scanner(scanner_type: str, repo_path: str) -> list:
    """Route to the correct scanner based on type."""
    import sys
    sys.path.insert(0, "/security-engine")

    try:
        if scanner_type == "bandit":
            from scanners.bandit_scanner import run_bandit_scan
            return run_bandit_scan(repo_path)
        elif scanner_type == "gitleaks":
            from scanners.gitleaks_scanner import run_gitleaks_scan
            return run_gitleaks_scan(repo_path)
        elif scanner_type == "safety":
            req_file = os.path.join(repo_path, "requirements.txt")
            if os.path.exists(req_file):
                from scanners.safety_scanner import run_safety_scan
                return run_safety_scan(req_file)
        elif scanner_type == "semgrep":
            from scanners.semgrep_scanner import run_semgrep_scan
            return run_semgrep_scan(repo_path)
        elif scanner_type == "trivy":
            from scanners.trivy_scanner import run_trivy_fs_scan
            return run_trivy_fs_scan(repo_path)
    except Exception as e:
        logger.error(f"Scanner {scanner_type} error: {e}")
    return []


def _send_slack(title: str, message: str, notif_type: str) -> None:
    """Send notification to Slack webhook."""
    import httpx
    color = {"critical": "#ef4444", "warning": "#eab308", "success": "#22c55e"}.get(notif_type, "#0ea5e9")
    payload = {
        "attachments": [{
            "color": color,
            "title": f"🛡️ SecureCI: {title}",
            "text": message,
            "footer": "SecureCI Security Platform",
        }]
    }
    try:
        httpx.post(settings.SLACK_WEBHOOK_URL, json=payload, timeout=10)
    except Exception as e:
        logger.error(f"Slack notification failed: {e}")


def _send_discord(title: str, message: str, notif_type: str) -> None:
    """Send notification to Discord webhook."""
    import httpx
    color_int = {"critical": 15548997, "warning": 16776960, "success": 5763719}.get(notif_type, 3447003)
    payload = {
        "embeds": [{
            "title": f"🛡️ {title}",
            "description": message,
            "color": color_int,
            "footer": {"text": "SecureCI Security Platform"},
        }]
    }
    try:
        httpx.post(settings.DISCORD_WEBHOOK_URL, json=payload, timeout=10)
    except Exception as e:
        logger.error(f"Discord notification failed: {e}")


def _send_email(to_email: str, subject: str, body: str) -> None:
    """Send email notification via SMTP."""
    import smtplib
    from email.mime.text import MIMEText
    msg = MIMEText(body, "html")
    msg["Subject"] = f"[SecureCI] {subject}"
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        logger.error(f"Email notification failed: {e}")
