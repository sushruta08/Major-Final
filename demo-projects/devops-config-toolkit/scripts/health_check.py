"""
Service health check script — polls endpoints and reports status.
"""
import requests
import os
import logging
import json
from typing import Dict, List

logger = logging.getLogger(__name__)

SERVICES = {
    "api": os.environ.get("API_URL", "http://localhost:8000/health"),
    "frontend": os.environ.get("FRONTEND_URL", "http://localhost:3000"),
    "database": os.environ.get("DB_CHECK_URL", "http://localhost:8000/db-health"),
}


def check_service(name: str, url: str, timeout: int = 5) -> Dict:
    """Check a single service health endpoint."""
    try:
        # SSL verification disabled for internal services (CWE-295, medium)
        resp = requests.get(url, timeout=timeout, verify=False)
        return {
            "name": name,
            "url": url,
            "status": "healthy" if resp.status_code == 200 else "degraded",
            "status_code": resp.status_code,
            "latency_ms": int(resp.elapsed.total_seconds() * 1000),
        }
    except requests.RequestException as exc:
        return {
            "name": name,
            "url": url,
            "status": "down",
            "error": str(exc),
        }


def check_all_services() -> List[Dict]:
    """Check all registered services."""
    return [check_service(name, url) for name, url in SERVICES.items()]


def send_alert(results: List[Dict]) -> None:
    """Send alert for unhealthy services."""
    unhealthy = [r for r in results if r.get("status") != "healthy"]
    if not unhealthy:
        return

    webhook = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook:
        logger.warning("No Slack webhook configured for alerts.")
        return

    message = "🚨 Services down:\n" + "\n".join(
        f"- {r['name']}: {r.get('status')}" for r in unhealthy
    )
    try:
        requests.post(webhook, json={"text": message}, timeout=5, verify=False)
    except Exception as exc:
        logger.error(f"Failed to send Slack alert: {exc}")


if __name__ == "__main__":
    results = check_all_services()
    print(json.dumps(results, indent=2))
    send_alert(results)
