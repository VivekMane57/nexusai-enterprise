from datetime import datetime

from pydantic import BaseModel, Field


class MonitoringMetricResponse(BaseModel):
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0

    average_latency_ms: float = 0
    average_retrieval_latency_ms: float = 0
    average_generation_latency_ms: float = 0

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    total_documents: int = 0
    indexed_documents: int = 0
    processing_documents: int = 0
    failed_documents: int = 0
    indexed_chunks: int = 0


class ServiceHealthResponse(BaseModel):
    name: str
    status: str
    latency_ms: float | None = None
    message: str | None = None


class MonitoringTrendPoint(BaseModel):
    timestamp: datetime

    requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0

    average_latency_ms: float = 0
    total_tokens: int = 0


class RecentMonitoringActivity(BaseModel):
    id: str
    activity_type: str
    title: str
    description: str | None = None
    status: str
    created_at: datetime


class MonitoringDashboardResponse(BaseModel):
    generated_at: datetime

    metrics: MonitoringMetricResponse

    services: list[ServiceHealthResponse] = Field(
        default_factory=list,
    )

    trends: list[MonitoringTrendPoint] = Field(
        default_factory=list,
    )

    recent_activity: list[
        RecentMonitoringActivity
    ] = Field(
        default_factory=list,
    )