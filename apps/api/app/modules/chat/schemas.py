from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """
    Request body for grounded RAG question answering.
    """

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

    @field_validator("question")
    @classmethod
    def normalize_question(
        cls,
        value: str,
    ) -> str:
        normalized_value = " ".join(
            value.split()
        ).strip()

        if not normalized_value:
            raise ValueError(
                "Question cannot be empty."
            )

        return normalized_value


class CitationResponse(BaseModel):
    citation_number: int

    document_id: UUID
    chunk_id: UUID | None

    filename: str
    chunk_index: int
    page_number: int | None

    content_preview: str

    dense_score: float | None
    sparse_score: float | None
    fusion_score: float
    rerank_score: float | None


class TokenUsageResponse(BaseModel):
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None


class ChatResponse(BaseModel):
    question: str
    answer: str

    knowledge_base_id: UUID

    retrieval_method: str
    model: str | None
    finish_reason: str | None

    citations: list[CitationResponse]
    total_citations: int

    token_usage: TokenUsageResponse

    retrieval_latency_ms: float
    generation_latency_ms: float
    total_latency_ms: float