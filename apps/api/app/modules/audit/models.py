from uuid import UUID

from sqlalchemy import (
    Enum as SQLAlchemyEnum,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import (
    UUID as PostgreSQLUUID,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)
from app.modules.audit.constants import (
    AuditAction,
    AuditEventStatus,
    AuditResourceType,
)


class AuditLog(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "audit_logs"

    organization_id: Mapped[
        UUID | None
    ] = mapped_column(
        PostgreSQLUUID(
            as_uuid=True,
        ),
        ForeignKey(
            "organizations.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    actor_user_id: Mapped[
        UUID | None
    ] = mapped_column(
        PostgreSQLUUID(
            as_uuid=True,
        ),
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    action: Mapped[
        AuditAction
    ] = mapped_column(
        SQLAlchemyEnum(
            AuditAction,
            name="audit_action",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        index=True,
    )

    resource_type: Mapped[
        AuditResourceType
    ] = mapped_column(
        SQLAlchemyEnum(
            AuditResourceType,
            name="audit_resource_type",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        index=True,
    )

    resource_id: Mapped[
        UUID | None
    ] = mapped_column(
        PostgreSQLUUID(
            as_uuid=True,
        ),
        nullable=True,
        index=True,
    )

    status: Mapped[
        AuditEventStatus
    ] = mapped_column(
        SQLAlchemyEnum(
            AuditEventStatus,
            name="audit_event_status",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        default=(
            AuditEventStatus.SUCCESS
        ),
        index=True,
    )

    description: Mapped[
        str
    ] = mapped_column(
        Text,
        nullable=False,
    )

    ip_address: Mapped[
        str | None
    ] = mapped_column(
        String(64),
        nullable=True,
    )

    user_agent: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    request_method: Mapped[
        str | None
    ] = mapped_column(
        String(16),
        nullable=True,
    )

    request_path: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    event_metadata: Mapped[
        dict[str, object]
    ] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    actor = relationship(
        "User",
    )

    organization = relationship(
        "Organization",
    )