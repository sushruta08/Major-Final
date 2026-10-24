"""
Notification Service — dispatches alerts via multiple channels.
Supports Email, Slack, Discord, Telegram, and in-app notifications.
"""
import logging
from typing import Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class NotificationService:
    """Manages security notifications across all configured channels."""

    def __init__(self, db_session=None):
        self.db = db_session

    async def notify_critical_vulnerability(
        self,
        vuln_title: str,
        vuln_description: str,
        repository_name: str,
        cve_id: Optional[str] = None,
        cvss_score: Optional[float] = None,
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Send critical vulnerability alert to configured channels."""
        title = f"🚨 Critical Vulnerability: {vuln_title}"
        message = (
            f"**Repository:** {repository_name}\n"
            f"**Description:** {vuln_description}\n"
            + (f"**CVE:** {cve_id}\n" if cve_id else "")
            + (f"**CVSS Score:** {cvss_score}\n" if cvss_score else "")
            + f"\n⚠️ Immediate action required."
        )
        logger.critical(f"CRITICAL VULN ALERT: {vuln_title} in {repository_name}")
        await self._dispatch(title, message, "critical", user_ids)

    async def notify_pipeline_failed(
        self,
        pipeline_id: str,
        repository_name: str,
        failed_stage: str,
        reason: str,
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Notify when a CI/CD pipeline fails security checks."""
        title = f"🔴 Pipeline Failed: {repository_name}"
        message = (
            f"**Pipeline:** {pipeline_id}\n"
            f"**Stage:** {failed_stage}\n"
            f"**Reason:** {reason}\n"
            f"**Time:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
        )
        logger.warning(f"Pipeline {pipeline_id} failed at {failed_stage}")
        await self._dispatch(title, message, "warning", user_ids)

    async def notify_deploy_blocked(
        self,
        repository_name: str,
        critical_count: int,
        high_count: int,
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Notify when deployment is blocked due to security findings."""
        title = f"🚫 Deployment Blocked: {repository_name}"
        message = (
            f"Deployment to production has been blocked.\n"
            f"**Critical Issues:** {critical_count}\n"
            f"**High Issues:** {high_count}\n"
            f"Resolve all critical and high severity issues before deploying."
        )
        await self._dispatch(title, message, "critical", user_ids)

    async def notify_scan_completed(
        self,
        repository_name: str,
        score: float,
        grade: str,
        total_findings: int,
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Notify when a security scan completes successfully."""
        emoji = "✅" if score >= 80 else "⚠️" if score >= 60 else "🔴"
        title = f"{emoji} Scan Complete: {repository_name}"
        message = (
            f"Security scan finished.\n"
            f"**Score:** {score}/100 (Grade: {grade})\n"
            f"**Total Findings:** {total_findings}"
        )
        await self._dispatch(title, message, "success" if score >= 80 else "warning", user_ids)

    async def _dispatch(
        self,
        title: str,
        message: str,
        notif_type: str,
        user_ids: Optional[List[str]] = None,
    ) -> None:
        """Internal: dispatch notification via Celery task."""
        from app.workers.tasks import send_notification
        if user_ids:
            for uid in user_ids:
                send_notification.delay(uid, title, message, notif_type)
        else:
            logger.info(f"[{notif_type.upper()}] {title}: {message}")
