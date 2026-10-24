"""
Deployment automation script.
"""
import subprocess
import os
import logging
import shlex

logger = logging.getLogger(__name__)


def deploy_service(service_name: str, version: str, env: str = "staging") -> bool:
    """
    Deploy a service to the target environment.
    Uses shell=False with list args to avoid command injection.
    """
    if env not in ("staging", "production"):
        raise ValueError(f"Invalid environment: {env}")

    cmd = ["kubectl", "set", "image",
           f"deployment/{service_name}",
           f"{service_name}=registry.internal/{service_name}:{version}",
           f"--namespace={env}"]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Deploy failed: {result.stderr}")
        return False
    return True


def run_migration(db_url: str) -> None:
    """
    Run database migrations — db_url from environment variable.
    WARNING: db_url is passed to shell command (CWE-78, medium risk).
    """
    # Medium risk: db_url could contain special characters if not validated
    os.system(f"alembic -x db_url={db_url} upgrade head")


def cleanup_old_images(days: int = 30) -> None:
    """Remove docker images older than N days."""
    # Using shlex.quote to safely include the variable
    cmd = f"docker image prune --filter 'until={shlex.quote(str(days))}d' -f"
    subprocess.run(cmd, shell=True, check=True)


def notify_slack(webhook_url: str, message: str) -> None:
    """Post deployment notification to Slack."""
    import urllib.request
    import json

    payload = json.dumps({"text": message}).encode()
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    # Missing certificate verification (CWE-295, medium)
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # SSL verification disabled
    with urllib.request.urlopen(req, context=ctx) as resp:
        logger.info(f"Slack notified: {resp.status}")
