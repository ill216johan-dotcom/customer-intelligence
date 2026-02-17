"""
Celery application configuration for backend and workers.
"""

import os
from celery import Celery

# Get Redis URL from environment
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app (same configuration as worker)
celery_app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.transcribe"],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    worker_prefetch_multiplier=1,  # Process one task at a time (heavy tasks)
    task_acks_late=True,  # Acknowledge after task completion
)

# Task routing
celery_app.conf.task_routes = {
    "tasks.transcribe.*": {"queue": "celery"},
}
