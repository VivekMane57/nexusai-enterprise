from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class HybridSearchRequest(BaseModel):
    query: str = Field(
        min_length=2,
        max_length=2000,
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

    final_top_k: int = Field(
        default=6,
        ge=1,
        le=50,
    )

    enable_reranking: bool = True

    rerank_top_k: int = Field(
        default=20,
        ge=1,
        le=50,
    )

    reranker_batch_size: int = Field(
        default=16,
        ge=1,
        le=64,
    )

    dense_score_threshold: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )

    sparse_minimum_score: float = Field(
        default=0.0,
        ge=0.0,
    )

    @field_validator("query")
    @classmethod
    def normalize_query(
        cls,
        value: str,
    ) -> str:
        normalized_value = " ".join(
            value.split()
        ).strip()

        if not normalized_value:
            raise ValueError(
                "Search query cannot be empty."
            )

        return normalized_value


class HybridSearchResultResponse(BaseModel):
    item_id: str
    document_id: UUID
    knowledge_base_id: UUID
    chunk_id: UUID | None
    chunk_index: int
    filename: str
    content: str
    page_number: int | None

    dense_score: float | None
    sparse_score: float | None
    fusion_score: float

    dense_rank: int | None
    sparse_rank: int | None

    rerank_score: float | None
    rerank_rank: int | None


class HybridSearchResponse(BaseModel):
    query: str
    retrieval_method: str
    reranking_enabled: bool
    total_results: int
    results: list[HybridSearchResultResponse]