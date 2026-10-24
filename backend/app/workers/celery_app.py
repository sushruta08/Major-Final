"""
Celery application configuration for background task processing.
Handles async scan execution, notifications, and report generation.
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "secureci",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,  # One task at a time per worker

    # Timeouts
    task_soft_time_limit=600,   # 10 min soft limit
    task_time_limit=900,        # 15 min hard limit

    # Retry policy
    task_max_retries=3,
    task_default_retry_delay=30,

    # Result expiry
    result_expires=86400,  # 24 hours

    # Beat schedule for periodic tasks
    beat_schedule={
        "daily-security-digest": {
            "task": "app.workers.tasks.send_daily_digest",
            "schedule": 86400.0,  # every 24h
        },
        "cleanup-old-scans": {
            "task": "app.workers.tasks.cleanup_old_scans",
            "schedule": 3600.0,  # every hour
        },
    },
)
