from collections import (
    Counter,
    defaultdict,
)
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.audit.constants import (
    AuditAction,
    AuditEventStatus,
    AuditResourceType,
)
from app.modules.audit.exceptions import (
    AuditLogNotFoundError,
)
from app.modules.audit.models import (
    AuditLog,
)
from app.modules.audit.repository import (
    AuditRepository,
)
from app.modules.audit.schemas import (
    AuditActionCount,
    AuditDashboardResponse,
    AuditLogCreate,
    AuditLogListResponse,
    AuditSummaryResponse,
    AuditTrendPoint,
)


class AuditService:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

        self.repository = (
            AuditRepository(
                database_session
            )
        )

    def log_event(
        self,
        event_data:
            AuditLogCreate,
    ) -> AuditLog:
        audit_log = AuditLog(
            organization_id=(
                event_data
                .organization_id
            ),
            actor_user_id=(
                event_data
                .actor_user_id
            ),
            action=(
                event_data.action
            ),
            resource_type=(
                event_data
                .resource_type
            ),
            resource_id=(
                event_data
                .resource_id
            ),
            status=(
                event_data.status
            ),
            description=(
                event_data.description
            ),
            ip_address=(
                event_data.ip_address
            ),
            user_agent=(
                event_data.user_agent
            ),
            request_method=(
                event_data
                .request_method
            ),
            request_path=(
                event_data
                .request_path
            ),
            event_metadata=(
                event_data
                .event_metadata
            ),
        )

        self.repository.create(
            audit_log
        )

        self.repository.commit()

        stored_log = (
            self.repository
            .get_by_id(
                audit_log.id
            )
        )

        return (
            stored_log
            if stored_log
            else audit_log
        )

    def list_logs(
        self,
        *,
        organization_id:
            UUID | None = None,
        actor_user_id:
            UUID | None = None,
        action:
            AuditAction | None = None,
        resource_type:
            AuditResourceType
            | None = None,
        status:
            AuditEventStatus
            | None = None,
        search:
            str | None = None,
        started_at:
            datetime | None = None,
        ended_at:
            datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> AuditLogListResponse:
        logs, total = (
            self.repository
            .list_logs(
                organization_id=(
                    organization_id
                ),
                actor_user_id=(
                    actor_user_id
                ),
                action=action,
                resource_type=(
                    resource_type
                ),
                status=status,
                search=search,
                started_at=(
                    started_at
                ),
                ended_at=ended_at,
                limit=limit,
                offset=offset,
            )
        )

        return AuditLogListResponse(
            items=logs,
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_log(
        self,
        audit_log_id: UUID,
    ) -> AuditLog:
        audit_log = (
            self.repository
            .get_by_id(
                audit_log_id
            )
        )

        if audit_log is None:
            raise (
                AuditLogNotFoundError()
            )

        return audit_log

    def get_dashboard(
        self,
        *,
        organization_id:
            UUID | None = None,
        days: int = 7,
        recent_limit: int = 20,
    ) -> AuditDashboardResponse:
        now = datetime.now(
            timezone.utc
        )

        started_at = (
            now
            - timedelta(
                days=max(
                    days - 1,
                    0,
                )
            )
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        logs, total = (
            self.repository
            .list_logs(
                organization_id=(
                    organization_id
                ),
                started_at=(
                    started_at
                ),
                limit=1000,
                offset=0,
            )
        )

        successful = sum(
            1
            for item in logs
            if item.status
            == AuditEventStatus.SUCCESS
        )

        failed = sum(
            1
            for item in logs
            if item.status
            == AuditEventStatus.FAILURE
        )

        pending = sum(
            1
            for item in logs
            if item.status
            == AuditEventStatus.PENDING
        )

        unique_actors = len(
            {
                item.actor_user_id
                for item in logs
                if item.actor_user_id
                is not None
            }
        )

        today = now.date()

        events_today = sum(
            1
            for item in logs
            if item.created_at.date()
            == today
        )

        summary = (
            AuditSummaryResponse(
                total_events=total,
                successful_events=(
                    successful
                ),
                failed_events=failed,
                pending_events=pending,
                unique_actors=(
                    unique_actors
                ),
                events_today=(
                    events_today
                ),
                success_rate=round(
                    (
                        successful
                        / total
                        * 100
                    )
                    if total
                    else 0,
                    2,
                ),
            )
        )

        grouped: dict[
            str,
            list[AuditLog],
        ] = defaultdict(list)

        for item in logs:
            day_key = (
                item.created_at
                .date()
                .isoformat()
            )

            grouped[
                day_key
            ].append(item)

        trends: list[
            AuditTrendPoint
        ] = []

        for offset in range(days):
            point_date = (
                started_at
                + timedelta(
                    days=offset
                )
            )

            day_logs = grouped[
                point_date
                .date()
                .isoformat()
            ]

            trends.append(
                AuditTrendPoint(
                    date=(
                        point_date
                        .date()
                        .isoformat()
                    ),
                    total=len(
                        day_logs
                    ),
                    successful=sum(
                        1
                        for item
                        in day_logs
                        if item.status
                        == (
                            AuditEventStatus
                            .SUCCESS
                        )
                    ),
                    failed=sum(
                        1
                        for item
                        in day_logs
                        if item.status
                        == (
                            AuditEventStatus
                            .FAILURE
                        )
                    ),
                )
            )

        action_counter = Counter(
            item.action
            for item in logs
        )

        action_counts = [
            AuditActionCount(
                action=action,
                count=count,
            )
            for action, count
            in action_counter
            .most_common(10)
        ]

        return AuditDashboardResponse(
            generated_at=now,
            summary=summary,
            trends=trends,
            action_counts=(
                action_counts
            ),
            recent_events=(
                logs[:recent_limit]
            ),
        )