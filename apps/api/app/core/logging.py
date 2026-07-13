import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


STANDARD_LOG_RECORD_FIELDS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
    "taskName",
}


class JsonFormatter(logging.Formatter):
    """
    Convert Python LogRecord objects into structured JSON logs.
    """

    def format(self, record: logging.LogRecord) -> str:
        log_payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "application": settings.app_name,
            "environment": settings.app_env,
        }

        for key, value in record.__dict__.items():
            if key not in STANDARD_LOG_RECORD_FIELDS and not key.startswith("_"):
                log_payload[key] = value

        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload, default=str, ensure_ascii=False)


def configure_logging() -> None:
    """
    Configure application-wide structured logging.
    """

    log_level = getattr(
        logging,
        settings.log_level.upper(),
        logging.INFO,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # Avoid duplicate access logs from Uvicorn.
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)