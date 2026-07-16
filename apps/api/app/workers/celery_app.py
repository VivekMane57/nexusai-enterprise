from celery import Celery

from app.core.config import settings
from app.db import models as _models  # noqa: F401


celery_app = Celery(
    "nexusai_enterprise",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.document_tasks",
        "app.workers.evaluation_tasks",
        "app.workers.fine_tuning_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
    result_expires=3600,
    task_time_limit=1800,
    task_soft_time_limit=1500,
)