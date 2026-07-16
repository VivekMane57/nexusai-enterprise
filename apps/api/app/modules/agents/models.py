from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Enum as SQLAlchemyEnum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
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
from app.modules.agents.constants import (
    AgentRunStatus,
    AgentStepStatus,
    AgentStepType,
    AgentType,
)


class AgentRun(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "agent_runs"

    knowledge_base_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "knowledge_bases.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
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

    agent_type: Mapped[AgentType] = mapped_column(
        SQLAlchemyEnum(
            AgentType,
            name="agent_type",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[AgentRunStatus] = mapped_column(
        SQLAlchemyEnum(
            AgentRunStatus,
            name="agent_run_status",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        default=AgentRunStatus.QUEUED,
        index=True,
    )

    task: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    result: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    model_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    confidence_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    citations: Mapped[list[dict[str, object]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    execution_metadata: Mapped[dict[str, object]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    prompt_tokens: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    completion_tokens: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    total_tokens: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    retrieval_latency_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    generation_latency_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    total_latency_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    knowledge_base = relationship(
        "KnowledgeBase",
    )

    creator = relationship(
        "User",
    )

    steps = relationship(
        "AgentRunStep",
        back_populates="agent_run",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="AgentRunStep.step_index",
    )


class AgentRunStep(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "agent_run_steps"

    agent_run_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey(
            "agent_runs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    step_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    step_type: Mapped[AgentStepType] = mapped_column(
        SQLAlchemyEnum(
            AgentStepType,
            name="agent_step_type",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
    )

    status: Mapped[AgentStepStatus] = mapped_column(
        SQLAlchemyEnum(
            AgentStepStatus,
            name="agent_step_status",
            native_enum=False,
            create_constraint=True,
        ),
        nullable=False,
        default=AgentStepStatus.PENDING,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    tool_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    tool_input: Mapped[dict[str, object]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    tool_output: Mapped[dict[str, object]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    latency_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )

    agent_run = relationship(
        "AgentRun",
        back_populates="steps",
    )