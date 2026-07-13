from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.knowledge_bases.constants import (
    ChunkingStrategy,
    KnowledgeBaseStatus,
)


class KnowledgeBaseCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=3000)

    chunking_strategy: ChunkingStrategy = ChunkingStrategy.RECURSIVE
    chunk_size: int = Field(default=800, ge=200, le=2000)
    chunk_overlap: int = Field(default=120, ge=0, le=500)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("chunk_overlap")
    @classmethod
    def validate_overlap(
        cls,
        value: int,
        info,
    ) -> int:
        chunk_size = info.data.get("chunk_size", 800)

        if value >= chunk_size:
            raise ValueError(
                "Chunk overlap must be smaller than chunk size."
            )

        return value


class KnowledgeBaseUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    description: str | None = Field(default=None, max_length=3000)
    status: KnowledgeBaseStatus | None = None


class KnowledgeBaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    slug: str
    description: str | None
    embedding_model: str
    chunking_strategy: ChunkingStrategy
    chunk_size: int
    chunk_overlap: int
    status: KnowledgeBaseStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class KnowledgeBaseListResponse(BaseModel):
    items: list[KnowledgeBaseResponse]
    total: int