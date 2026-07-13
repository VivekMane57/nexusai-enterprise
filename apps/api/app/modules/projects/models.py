from uuid import UUID

from sqlalchemy import (
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)
from app.modules.projects.constants import (
    ProjectEnvironment,
    ProjectStatus,
)


class Project(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "projects"

    organization_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    environment: Mapped[ProjectEnvironment] = mapped_column(
        Enum(
            ProjectEnvironment,
            name="project_environment",
            native_enum=False,
            create_constraint=True,
        ),
        default=ProjectEnvironment.DEVELOPMENT,
        nullable=False,
    )

    status: Mapped[ProjectStatus] = mapped_column(
        Enum(
            ProjectStatus,
            name="project_status",
            native_enum=False,
            create_constraint=True,
        ),
        default=ProjectStatus.ACTIVE,
        nullable=False,
    )

    created_by: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    organization = relationship(
        "Organization",
        back_populates="projects",
    )

    creator = relationship(
        "User",
    )

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_project_organization_slug",
        ),
    )