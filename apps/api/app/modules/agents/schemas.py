from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.modules.agents.constants import (
    AgentRunStatus,
    AgentStepStatus,
    AgentStepType,
    AgentType,
)


class AgentDefinitionResponse(BaseModel):
    type: AgentType
    name: str
    description: str
    capabilities: list[str]
    recommended_tasks: list[str]


class AgentRunRequest(BaseModel):
    knowledge_base_id: UUID

    agent_type: AgentType

    task: str = Field(
        min_length=3,
        max_length=5000,
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
        default=20,
        ge=1,
        le=50,
    )

    final_context_top_k: int = Field(
        default=8,
        ge=1,
        le=30,
    )

    enable_reranking: bool = True

    temperature: float = Field(
        default=0.2,
        ge=0,
        le=2,
    )

    max_tokens: int = Field(
        default=1800,
        ge=100,
        le=8000,
    )

    @field_validator("task")
    @classmethod
    def normalize_task(
        cls,
        value: str,
    ) -> str:
        normalized = " ".join(
            value.split()
        ).strip()

        if not normalized:
            raise ValueError(
                "Agent task cannot be empty."
            )

        return normalized


class AgentStepResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    agent_run_id: UUID

    step_index: int
    step_type: AgentStepType
    status: AgentStepStatus

    title: str
    description: str | None
    output: str | None

    tool_name: str | None
    tool_input: dict[str, object]
    tool_output: dict[str, object]

    latency_ms: int | None

    started_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class AgentRunResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    knowledge_base_id: UUID
    created_by: UUID

    agent_type: AgentType
    status: AgentRunStatus

    task: str
    result: str | None
    error_message: str | None

    model_name: str | None
    confidence_score: float | None

    citations: list[
        dict[str, object]
    ]

    execution_metadata: dict[
        str,
        object
    ]

    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None

    retrieval_latency_ms: int | None
    generation_latency_ms: int | None
    total_latency_ms: int | None

    started_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class AgentRunDetailResponse(
    AgentRunResponse
):
    steps: list[
        AgentStepResponse
    ] = Field(
        default_factory=list,
    )


class AgentRunListResponse(BaseModel):
    items: list[
        AgentRunResponse
    ]

    total: int


class AgentDashboardSummary(BaseModel):
    total_runs: int = 0
    completed_runs: int = 0
    failed_runs: int = 0
    running_runs: int = 0

    success_rate: float = 0
    average_latency_ms: float = 0
    average_confidence: float = 0

    total_tokens: int = 0


class AgentDashboardResponse(BaseModel):
    generated_at: datetime

    summary: AgentDashboardSummary

    available_agents: list[
        AgentDefinitionResponse
    ] = Field(
        default_factory=list,
    )

    recent_runs: list[
        AgentRunResponse
    ] = Field(
        default_factory=list,
    )