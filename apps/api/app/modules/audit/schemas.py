from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.audit.constants import (
    AuditAction,
    AuditEventStatus,
    AuditResourceType,
)


class AuditActorResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    email: str
    full_name: str


class AuditLogCreate(BaseModel):
    action: AuditAction

    resource_type: AuditResourceType

    description: str = Field(
        min_length=3,
        max_length=5000,
    )

    organization_id: UUID | None = None

    actor_user_id: UUID | None = None

    resource_id: UUID | None = None

    status: AuditEventStatus = AuditEventStatus.SUCCESS

    ip_address: str | None = None

    user_agent: str | None = None

    request_method: str | None = None

    request_path: str | None = None

    event_metadata: dict[str, object] = Field(
        default_factory=dict,
    )


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID

    organization_id: UUID | None

    actor_user_id: UUID | None

    action: AuditAction

    resource_type: AuditResourceType

    resource_id: UUID | None

    status: AuditEventStatus

    description: str

    ip_address: str | None

    user_agent: str | None

    request_method: str | None

    request_path: str | None

    event_metadata: dict[str, object]

    actor: AuditActorResponse | None

    created_at: datetime

    updated_at: datetime


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]

    total: int

    limit: int

    offset: int


class AuditSummaryResponse(BaseModel):
    total_events: int = 0

    successful_events: int = 0

    failed_events: int = 0

    pending_events: int = 0

    unique_actors: int = 0

    events_today: int = 0

    success_rate: float = 0


class AuditTrendPoint(BaseModel):
    date: str

    total: int = 0

    successful: int = 0

    failed: int = 0


class AuditActionCount(BaseModel):
    action: AuditAction

    count: int


class AuditDashboardResponse(BaseModel):
    generated_at: datetime

    summary: AuditSummaryResponse

    trends: list[AuditTrendPoint] = Field(
        default_factory=list,
    )

    action_counts: list[AuditActionCount] = Field(
        default_factory=list,
    )

    recent_events: list[AuditLogResponse] = Field(
        default_factory=list,
    )