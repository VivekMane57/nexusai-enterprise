from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.chat.models import (
    ChatMessageRole,
)


class ConversationCreateRequest(BaseModel):
    title: str = Field(
        default="New conversation",
        min_length=1,
        max_length=255,
    )


class ConversationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    knowledge_base_id: UUID
    created_by: UUID
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    total: int


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    conversation_id: UUID
    role: ChatMessageRole
    content: str

    citations: list[dict[str, object]]

    retrieval_method: str | None
    model_name: str | None

    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None

    retrieval_latency_ms: int | None
    generation_latency_ms: int | None
    total_latency_ms: int | None

    message_metadata: dict[str, object]

    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(
    ConversationResponse
):
    messages: list[ChatMessageResponse]


class ConversationMessageRequest(BaseModel):
    question: str = Field(
        min_length=2,
        max_length=4000,
    )

    dense_top_k: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    sparse_top_k: int = Field(
        default=20,
        ge=1,
        le=100,
    )

    retrieval_top_k: int = Field(
        default=15,
        ge=1,
        le=50,
    )

    final_context_top_k: int = Field(
        default=6,
        ge=1,
        le=20,
    )

    enable_reranking: bool = True

    reranker_batch_size: int = Field(
        default=16,
        ge=1,
        le=64,
    )

    dense_score_threshold: float | None = Field(
        default=0.1,
        ge=0.0,
        le=1.0,
    )

    sparse_minimum_score: float = Field(
        default=0.0,
        ge=0.0,
    )

    temperature: float = Field(
        default=0.1,
        ge=0.0,
        le=2.0,
    )

    max_tokens: int = Field(
        default=800,
        ge=50,
        le=4000,
    )


class ConversationMessageResponse(BaseModel):
    conversation: ConversationResponse
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse