from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    status,
)

from app.modules.audit.constants import (
    AuditAction,
    AuditEventStatus,
    AuditResourceType,
)
from app.modules.audit.dependencies import (
    AuditServiceDependency,
)
from app.modules.audit.exceptions import (
    AuditLogNotFoundError,
)
from app.modules.audit.schemas import (
    AuditDashboardResponse,
    AuditLogListResponse,
    AuditLogResponse,
)
from app.modules.auth.dependencies import (
    CurrentUser,
)


router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)


@router.get(
    "/dashboard",
    response_model=(
        AuditDashboardResponse
    ),
    summary="Get Audit Dashboard",
)
def get_audit_dashboard(
    current_user: CurrentUser,
    audit_service:
        AuditServiceDependency,
    organization_id:
        UUID | None = None,
    days: Annotated[
        int,
        Query(
            ge=1,
            le=30,
        ),
    ] = 7,
    recent_limit: Annotated[
        int,
        Query(
            ge=1,
            le=100,
        ),
    ] = 20,
) -> AuditDashboardResponse:
    _ = current_user

    return (
        audit_service
        .get_dashboard(
            organization_id=(
                organization_id
            ),
            days=days,
            recent_limit=(
                recent_limit
            ),
        )
    )


@router.get(
    "",
    response_model=(
        AuditLogListResponse
    ),
    summary="List Audit Logs",
)
def list_audit_logs(
    current_user: CurrentUser,
    audit_service:
        AuditServiceDependency,
    organization_id:
        UUID | None = None,
    actor_user_id:
        UUID | None = None,
    action:
        AuditAction | None = None,
    resource_type:
        AuditResourceType
        | None = None,
    event_status:
        AuditEventStatus
        | None = None,
    search:
        str | None = None,
    started_at:
        datetime | None = None,
    ended_at:
        datetime | None = None,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=200,
        ),
    ] = 50,
    offset: Annotated[
        int,
        Query(
            ge=0,
        ),
    ] = 0,
) -> AuditLogListResponse:
    _ = current_user

    return audit_service.list_logs(
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
        status=event_status,
        search=search,
        started_at=started_at,
        ended_at=ended_at,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{audit_log_id}",
    response_model=(
        AuditLogResponse
    ),
    summary="Get Audit Log",
)
def get_audit_log(
    audit_log_id: UUID,
    current_user: CurrentUser,
    audit_service:
        AuditServiceDependency,
) -> AuditLogResponse:
    _ = current_user

    try:
        return (
            audit_service
            .get_log(
                audit_log_id
            )
        )
    except (
        AuditLogNotFoundError
    ) as error:
        raise HTTPException(
            status_code=(
                status
                .HTTP_404_NOT_FOUND
            ),
            detail=(
                "Audit log not found."
            ),
        ) from error