"""
Database backup utility.
"""
import os
import subprocess
import logging
import gzip
import shutil
from datetime import datetime

logger = logging.getLogger(__name__)

# Backup storage config — using env vars (good)
BACKUP_BUCKET = os.environ.get("BACKUP_BUCKET", "s3://my-backups")
BACKUP_ENCRYPTION_KEY = os.environ.get("BACKUP_KEY", "")


def backup_postgres(db_name: str, output_dir: str) -> str:
    """Dump PostgreSQL database to a compressed file."""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{db_name}_{timestamp}.sql.gz"
    filepath = os.path.join(output_dir, filename)

    # pg_dump — safe argument construction
    dump_cmd = ["pg_dump", "--no-password", db_name]
    with gzip.open(filepath, "wb") as f:
        result = subprocess.run(dump_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            raise RuntimeError(f"pg_dump failed: {result.stderr.decode()}")
        f.write(result.stdout)

    logger.info(f"Backup created: {filepath}")
    return filepath


def upload_to_s3(filepath: str, bucket: str) -> None:
    """Upload backup file to S3."""
    cmd = ["aws", "s3", "cp", filepath, f"{bucket}/"]
    subprocess.run(cmd, check=True)


def cleanup_local_backups(output_dir: str, keep_days: int = 7) -> None:
    """Remove local backup files older than keep_days."""
    now = datetime.utcnow().timestamp()
    for fname in os.listdir(output_dir):
        fpath = os.path.join(output_dir, fname)
        if os.path.isfile(fpath):
            age_days = (now - os.path.getmtime(fpath)) / 86400
            if age_days > keep_days:
                os.remove(fpath)
                logger.info(f"Removed old backup: {fname}")


def verify_backup(filepath: str) -> bool:
    """Verify backup integrity using gzip test."""
    result = subprocess.run(["gzip", "-t", filepath], capture_output=True)
    return result.returncode == 0
