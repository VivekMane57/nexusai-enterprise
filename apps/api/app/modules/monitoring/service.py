import time
from collections import defaultdict
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any

import httpx
import redis
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.chat.models import ChatMessage
from app.modules.documents.models import (
    Document,
    DocumentChunk,
)
from app.modules.monitoring.schemas import (
    MonitoringDashboardResponse,
    MonitoringMetricResponse,
    MonitoringTrendPoint,
    RecentMonitoringActivity,
    ServiceHealthResponse,
)


PROCESSING_DOCUMENT_STATUSES = {
    "uploaded",
    "queued",
    "processing",
    "extracting",
    "chunking",
    "embedding",
    "indexing",
}

READY_DOCUMENT_STATUSES = {
    "indexed",
    "completed",
    "ready",
}


def safe_float(
    value: Any,
) -> float:
    if value is None:
        return 0.0

    try:
        return float(value)
    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def safe_int(
    value: Any,
) -> int:
    if value is None:
        return 0

    try:
        return int(value)
    except (
        TypeError,
        ValueError,
    ):
        return 0


def get_model_column(
    model: type,
    column_name: str,
) -> Any | None:
    return getattr(
        model,
        column_name,
        None,
    )


def get_enum_value(
    value: Any,
) -> str:
    raw_value = getattr(
        value,
        "value",
        value,
    )

    return str(
        raw_value or ""
    ).lower()


def make_utc_aware(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc,
        )

    return value.astimezone(
        timezone.utc,
    )


class MonitoringService:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

    def get_dashboard(
        self,
    ) -> MonitoringDashboardResponse:
        return MonitoringDashboardResponse(
            generated_at=datetime.now(
                timezone.utc,
            ),
            metrics=self._get_metrics(),
            services=[
                self._check_postgres(),
                self._check_redis(),
                self._check_qdrant(),
            ],
            trends=self._get_trends(
                days=7,
            ),
            recent_activity=(
                self._get_recent_activity(
                    limit=12,
                )
            ),
        )

    def _get_metrics(
        self,
    ) -> MonitoringMetricResponse:
        documents = (
            self.database_session.execute(
                select(Document)
            )
            .scalars()
            .all()
        )

        assistant_messages = (
            self.database_session.execute(
                select(ChatMessage).where(
                    ChatMessage.role
                    == "assistant"
                )
            )
            .scalars()
            .all()
        )

        total_requests = len(
            assistant_messages
        )

        successful_requests = 0
        failed_requests = 0

        total_latency = 0.0
        total_retrieval_latency = 0.0
        total_generation_latency = 0.0

        latency_samples = 0
        retrieval_samples = 0
        generation_samples = 0

        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0

        for message in assistant_messages:
            content = (
                getattr(
                    message,
                    "content",
                    "",
                )
                or ""
            )

            if content.strip():
                successful_requests += 1
            else:
                failed_requests += 1

            total_latency_value = getattr(
                message,
                "total_latency_ms",
                None,
            )

            if total_latency_value is not None:
                total_latency += safe_float(
                    total_latency_value
                )
                latency_samples += 1

            retrieval_latency_value = getattr(
                message,
                "retrieval_latency_ms",
                None,
            )

            if (
                retrieval_latency_value
                is not None
            ):
                total_retrieval_latency += (
                    safe_float(
                        retrieval_latency_value
                    )
                )
                retrieval_samples += 1

            generation_latency_value = getattr(
                message,
                "generation_latency_ms",
                None,
            )

            if (
                generation_latency_value
                is not None
            ):
                total_generation_latency += (
                    safe_float(
                        generation_latency_value
                    )
                )
                generation_samples += 1

            token_usage = getattr(
                message,
                "token_usage",
                None,
            )

            if isinstance(
                token_usage,
                dict,
            ):
                prompt_tokens += safe_int(
                    token_usage.get(
                        "prompt_tokens"
                    )
                )

                completion_tokens += safe_int(
                    token_usage.get(
                        "completion_tokens"
                    )
                )

                total_tokens += safe_int(
                    token_usage.get(
                        "total_tokens"
                    )
                )

        indexed_documents = 0
        processing_documents = 0
        failed_documents = 0

        for document in documents:
            normalized_status = (
                get_enum_value(
                    getattr(
                        document,
                        "status",
                        "",
                    )
                )
            )

            if (
                normalized_status
                in READY_DOCUMENT_STATUSES
            ):
                indexed_documents += 1

            elif (
                normalized_status
                in PROCESSING_DOCUMENT_STATUSES
            ):
                processing_documents += 1

            elif (
                normalized_status
                == "failed"
            ):
                failed_documents += 1

        indexed_chunks = (
            self.database_session.scalar(
                select(
                    func.count(
                        DocumentChunk.id
                    )
                )
            )
            or 0
        )

        average_latency_ms = (
            total_latency
            / latency_samples
            if latency_samples > 0
            else 0.0
        )

        average_retrieval_latency_ms = (
            total_retrieval_latency
            / retrieval_samples
            if retrieval_samples > 0
            else 0.0
        )

        average_generation_latency_ms = (
            total_generation_latency
            / generation_samples
            if generation_samples > 0
            else 0.0
        )

        return MonitoringMetricResponse(
            total_requests=(
                total_requests
            ),
            successful_requests=(
                successful_requests
            ),
            failed_requests=(
                failed_requests
            ),
            average_latency_ms=round(
                average_latency_ms,
                2,
            ),
            average_retrieval_latency_ms=round(
                average_retrieval_latency_ms,
                2,
            ),
            average_generation_latency_ms=round(
                average_generation_latency_ms,
                2,
            ),
            prompt_tokens=(
                prompt_tokens
            ),
            completion_tokens=(
                completion_tokens
            ),
            total_tokens=(
                total_tokens
            ),
            total_documents=len(
                documents
            ),
            indexed_documents=(
                indexed_documents
            ),
            processing_documents=(
                processing_documents
            ),
            failed_documents=(
                failed_documents
            ),
            indexed_chunks=int(
                indexed_chunks
            ),
        )

    def _get_trends(
        self,
        days: int,
    ) -> list[
        MonitoringTrendPoint
    ]:
        created_at_column = (
            get_model_column(
                ChatMessage,
                "created_at",
            )
        )

        if created_at_column is None:
            return []

        start_date = (
            datetime.now(
                timezone.utc,
            )
            - timedelta(
                days=days - 1,
            )
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        messages = (
            self.database_session.execute(
                select(ChatMessage).where(
                    created_at_column
                    >= start_date
                )
            )
            .scalars()
            .all()
        )

        grouped: dict[
            str,
            dict[str, float | int],
        ] = defaultdict(
            lambda: {
                "requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "latency_total": 0.0,
                "latency_samples": 0,
                "total_tokens": 0,
            }
        )

        for message in messages:
            role = get_enum_value(
                getattr(
                    message,
                    "role",
                    "",
                )
            )

            if role != "assistant":
                continue

            created_at = getattr(
                message,
                "created_at",
                None,
            )

            if not isinstance(
                created_at,
                datetime,
            ):
                continue

            created_at = make_utc_aware(
                created_at
            )

            day_key = (
                created_at.date()
                .isoformat()
            )

            day_data = grouped[
                day_key
            ]

            day_data[
                "requests"
            ] = (
                int(
                    day_data[
                        "requests"
                    ]
                )
                + 1
            )

            content = (
                getattr(
                    message,
                    "content",
                    "",
                )
                or ""
            )

            if content.strip():
                day_data[
                    "successful_requests"
                ] = (
                    int(
                        day_data[
                            "successful_requests"
                        ]
                    )
                    + 1
                )
            else:
                day_data[
                    "failed_requests"
                ] = (
                    int(
                        day_data[
                            "failed_requests"
                        ]
                    )
                    + 1
                )

            latency = getattr(
                message,
                "total_latency_ms",
                None,
            )

            if latency is not None:
                day_data[
                    "latency_total"
                ] = (
                    float(
                        day_data[
                            "latency_total"
                        ]
                    )
                    + safe_float(
                        latency
                    )
                )

                day_data[
                    "latency_samples"
                ] = (
                    int(
                        day_data[
                            "latency_samples"
                        ]
                    )
                    + 1
                )

            token_usage = getattr(
                message,
                "token_usage",
                None,
            )

            if isinstance(
                token_usage,
                dict,
            ):
                day_data[
                    "total_tokens"
                ] = (
                    int(
                        day_data[
                            "total_tokens"
                        ]
                    )
                    + safe_int(
                        token_usage.get(
                            "total_tokens"
                        )
                    )
                )

        trend_points: list[
            MonitoringTrendPoint
        ] = []

        for day_offset in range(
            days
        ):
            point_date = (
                start_date
                + timedelta(
                    days=day_offset,
                )
            )

            day_key = (
                point_date.date()
                .isoformat()
            )

            day_data = grouped[
                day_key
            ]

            latency_samples = int(
                day_data[
                    "latency_samples"
                ]
            )

            average_latency_ms = (
                float(
                    day_data[
                        "latency_total"
                    ]
                )
                / latency_samples
                if latency_samples > 0
                else 0.0
            )

            trend_points.append(
                MonitoringTrendPoint(
                    timestamp=(
                        point_date
                    ),
                    requests=int(
                        day_data[
                            "requests"
                        ]
                    ),
                    successful_requests=int(
                        day_data[
                            "successful_requests"
                        ]
                    ),
                    failed_requests=int(
                        day_data[
                            "failed_requests"
                        ]
                    ),
                    average_latency_ms=round(
                        average_latency_ms,
                        2,
                    ),
                    total_tokens=int(
                        day_data[
                            "total_tokens"
                        ]
                    ),
                )
            )

        return trend_points

    def _get_recent_activity(
        self,
        limit: int,
    ) -> list[
        RecentMonitoringActivity
    ]:
        activities: list[
            RecentMonitoringActivity
        ] = []

        document_created_at_column = (
            get_model_column(
                Document,
                "created_at",
            )
        )

        if (
            document_created_at_column
            is not None
        ):
            documents = (
                self.database_session.execute(
                    select(Document)
                    .order_by(
                        document_created_at_column.desc()
                    )
                    .limit(limit)
                )
                .scalars()
                .all()
            )

            for document in documents:
                created_at = getattr(
                    document,
                    "created_at",
                    datetime.now(
                        timezone.utc,
                    ),
                )

                if isinstance(
                    created_at,
                    datetime,
                ):
                    created_at = (
                        make_utc_aware(
                            created_at
                        )
                    )
                else:
                    created_at = (
                        datetime.now(
                            timezone.utc,
                        )
                    )

                status = (
                    get_enum_value(
                        getattr(
                            document,
                            "status",
                            "unknown",
                        )
                    )
                    or "unknown"
                )

                original_filename = (
                    getattr(
                        document,
                        "original_filename",
                        "Document",
                    )
                )

                activities.append(
                    RecentMonitoringActivity(
                        id=str(
                            document.id
                        ),
                        activity_type=(
                            "document"
                        ),
                        title=str(
                            original_filename
                        ),
                        description=(
                            "Document processing "
                            f"status: {status}"
                        ),
                        status=status,
                        created_at=(
                            created_at
                        ),
                    )
                )

        message_created_at_column = (
            get_model_column(
                ChatMessage,
                "created_at",
            )
        )

        if (
            message_created_at_column
            is not None
        ):
            messages = (
                self.database_session.execute(
                    select(ChatMessage)
                    .where(
                        ChatMessage.role
                        == "assistant"
                    )
                    .order_by(
                        message_created_at_column.desc()
                    )
                    .limit(limit)
                )
                .scalars()
                .all()
            )

            for message in messages:
                created_at = getattr(
                    message,
                    "created_at",
                    datetime.now(
                        timezone.utc,
                    ),
                )

                if isinstance(
                    created_at,
                    datetime,
                ):
                    created_at = (
                        make_utc_aware(
                            created_at
                        )
                    )
                else:
                    created_at = (
                        datetime.now(
                            timezone.utc,
                        )
                    )

                content = (
                    getattr(
                        message,
                        "content",
                        "",
                    )
                    or ""
                )

                activities.append(
                    RecentMonitoringActivity(
                        id=str(
                            message.id
                        ),
                        activity_type=(
                            "chat"
                        ),
                        title=(
                            "AI response generated"
                        ),
                        description=(
                            content[:140]
                            if content
                            else (
                                "No response "
                                "content stored."
                            )
                        ),
                        status=(
                            "success"
                            if content.strip()
                            else "failed"
                        ),
                        created_at=(
                            created_at
                        ),
                    )
                )

        return sorted(
            activities,
            key=lambda item: (
                item.created_at
            ),
            reverse=True,
        )[:limit]

    def _check_postgres(
        self,
    ) -> ServiceHealthResponse:
        started_at = (
            time.perf_counter()
        )

        try:
            self.database_session.execute(
                text("SELECT 1")
            )

            latency_ms = (
                time.perf_counter()
                - started_at
            ) * 1000

            return ServiceHealthResponse(
                name="PostgreSQL",
                status="healthy",
                latency_ms=round(
                    latency_ms,
                    2,
                ),
                message=None,
            )

        except Exception as error:
            return ServiceHealthResponse(
                name="PostgreSQL",
                status="unhealthy",
                latency_ms=None,
                message=str(error),
            )

    def _check_redis(
        self,
    ) -> ServiceHealthResponse:
        started_at = (
            time.perf_counter()
        )

        try:
            redis_client = (
                redis.Redis.from_url(
                    settings.redis_url,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
            )

            redis_client.ping()

            latency_ms = (
                time.perf_counter()
                - started_at
            ) * 1000

            return ServiceHealthResponse(
                name="Redis",
                status="healthy",
                latency_ms=round(
                    latency_ms,
                    2,
                ),
                message=None,
            )

        except Exception as error:
            return ServiceHealthResponse(
                name="Redis",
                status="unhealthy",
                latency_ms=None,
                message=str(error),
            )

    def _check_qdrant(
        self,
    ) -> ServiceHealthResponse:
        started_at = (
            time.perf_counter()
        )

        qdrant_url = getattr(
            settings,
            "qdrant_url",
            "http://127.0.0.1:6333",
        )

        normalized_qdrant_url = str(
            qdrant_url
        ).rstrip("/")

        try:
            response = httpx.get(
                normalized_qdrant_url,
                timeout=3.0,
            )

            response.raise_for_status()

            latency_ms = (
                time.perf_counter()
                - started_at
            ) * 1000

            return ServiceHealthResponse(
                name="Qdrant",
                status="healthy",
                latency_ms=round(
                    latency_ms,
                    2,
                ),
                message=None,
            )

        except Exception as error:
            return ServiceHealthResponse(
                name="Qdrant",
                status="unhealthy",
                latency_ms=None,
                message=str(error),
            )