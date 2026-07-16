from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.modules.audit.constants import (
    AuditAction,
    AuditEventStatus,
    AuditResourceType,
)
from app.modules.audit.models import (
    AuditLog,
)


class AuditRepository:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

    def create(
        self,
        audit_log: AuditLog,
    ) -> AuditLog:
        self.database_session.add(
            audit_log
        )
        self.database_session.flush()

        return audit_log

    def get_by_id(
        self,
        audit_log_id: UUID,
    ) -> AuditLog | None:
        statement = (
            select(AuditLog)
            .options(
                selectinload(
                    AuditLog.actor
                )
            )
            .where(
                AuditLog.id
                == audit_log_id
            )
        )

        return (
            self.database_session
            .execute(statement)
            .scalars()
            .first()
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
    ) -> tuple[
        list[AuditLog],
        int,
    ]:
        conditions = []

        if organization_id:
            conditions.append(
                AuditLog.organization_id
                == organization_id
            )

        if actor_user_id:
            conditions.append(
                AuditLog.actor_user_id
                == actor_user_id
            )

        if action:
            conditions.append(
                AuditLog.action
                == action
            )

        if resource_type:
            conditions.append(
                AuditLog.resource_type
                == resource_type
            )

        if status:
            conditions.append(
                AuditLog.status
                == status
            )

        if search:
            normalized_search = (
                f"%{search.strip()}%"
            )

            conditions.append(
                AuditLog.description
                .ilike(
                    normalized_search
                )
            )

        if started_at:
            conditions.append(
                AuditLog.created_at
                >= started_at
            )

        if ended_at:
            conditions.append(
                AuditLog.created_at
                <= ended_at
            )

        statement = (
            select(AuditLog)
            .options(
                selectinload(
                    AuditLog.actor
                )
            )
            .where(*conditions)
            .order_by(
                AuditLog.created_at
                .desc()
            )
            .offset(offset)
            .limit(limit)
        )

        count_statement = (
            select(
                func.count(
                    AuditLog.id
                )
            )
            .where(*conditions)
        )

        logs = list(
            self.database_session
            .execute(statement)
            .scalars()
            .all()
        )

        total = int(
            self.database_session
            .execute(
                count_statement
            )
            .scalar_one()
        )

        return logs, total

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(
        self,
        instance: object,
    ) -> None:
        self.database_session.refresh(
            instance
        )