from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.knowledge_bases.constants import (
    ChunkingStrategy,
    KnowledgeBaseStatus,
)


class KnowledgeBase(
    UUIDPrimaryKeyMixin,
    TimestampMixin,
    Base,
):
    __tablename__ = "knowledge_bases"

    project_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
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

    embedding_model: Mapped[str] = mapped_column(
        String(255),
        default="BAAI/bge-small-en-v1.5",
        nullable=False,
    )

    chunking_strategy: Mapped[ChunkingStrategy] = mapped_column(
        Enum(
            ChunkingStrategy,
            name="chunking_strategy",
            native_enum=False,
            create_constraint=True,
        ),
        default=ChunkingStrategy.RECURSIVE,
        nullable=False,
    )

    chunk_size: Mapped[int] = mapped_column(
        Integer,
        default=800,
        nullable=False,
    )

    chunk_overlap: Mapped[int] = mapped_column(
        Integer,
        default=120,
        nullable=False,
    )

    status: Mapped[KnowledgeBaseStatus] = mapped_column(
        Enum(
            KnowledgeBaseStatus,
            name="knowledge_base_status",
            native_enum=False,
            create_constraint=True,
        ),
        default=KnowledgeBaseStatus.ACTIVE,
        nullable=False,
    )

    created_by: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    documents = relationship(
        "Document",
        back_populates="knowledge_base",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "slug",
            name="uq_knowledge_base_project_slug",
        ),
    )