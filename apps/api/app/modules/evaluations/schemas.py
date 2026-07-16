from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class EvaluationMetricResponse(BaseModel):
    name: str
    score: float = Field(
        ge=0,
        le=1,
    )
    percentage: float = Field(
        ge=0,
        le=100,
    )
    passed: bool
    explanation: str


class EvaluationRunRequest(BaseModel):
    question: str = Field(
        min_length=3,
        max_length=5000,
    )

    answer: str = Field(
        min_length=1,
        max_length=30000,
    )

    expected_answer: str | None = Field(
        default=None,
        max_length=30000,
    )

    contexts: list[str] = Field(
        default_factory=list,
    )

    citations: list[dict[str, Any]] = Field(
        default_factory=list,
    )

    retrieval_latency_ms: float | None = None
    generation_latency_ms: float | None = None
    total_latency_ms: float | None = None

    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class EvaluationRunResponse(BaseModel):
    id: str

    question: str
    answer_preview: str

    overall_score: float
    overall_percentage: float

    passed: bool
    grade: str

    metrics: list[
        EvaluationMetricResponse
    ] = Field(
        default_factory=list,
    )

    hallucination_risk: float
    citation_count: int
    context_count: int

    retrieval_latency_ms: float | None = None
    generation_latency_ms: float | None = None
    total_latency_ms: float | None = None

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    created_at: datetime


class EvaluationSummaryResponse(BaseModel):
    total_evaluations: int = 0
    passed_evaluations: int = 0
    failed_evaluations: int = 0

    pass_rate: float = 0

    average_score: float = 0
    average_groundedness: float = 0
    average_relevancy: float = 0
    average_citation_coverage: float = 0
    average_context_utilization: float = 0

    average_hallucination_risk: float = 0
    average_latency_ms: float = 0

    total_tokens: int = 0


class EvaluationTrendPoint(BaseModel):
    timestamp: datetime

    evaluations: int = 0
    passed: int = 0
    failed: int = 0

    average_score: float = 0
    average_groundedness: float = 0
    average_relevancy: float = 0


class EvaluationHistoryItem(BaseModel):
    id: UUID | str

    conversation_id: UUID | str | None = None
    message_id: UUID | str | None = None

    question: str
    answer_preview: str

    overall_score: float
    passed: bool
    grade: str

    groundedness: float
    answer_relevancy: float
    citation_coverage: float
    context_utilization: float
    hallucination_risk: float

    citation_count: int = 0
    total_latency_ms: float | None = None
    total_tokens: int = 0

    created_at: datetime


class EvaluationDashboardResponse(BaseModel):
    generated_at: datetime

    summary: EvaluationSummaryResponse

    trends: list[
        EvaluationTrendPoint
    ] = Field(
        default_factory=list,
    )

    recent_evaluations: list[
        EvaluationHistoryItem
    ] = Field(
        default_factory=list,
    )