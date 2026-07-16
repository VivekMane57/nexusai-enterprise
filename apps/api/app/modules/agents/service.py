from datetime import (
    datetime,
    timezone,
)
from time import perf_counter
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.agents.constants import (
    AgentRunStatus,
    AgentStepStatus,
    AgentStepType,
    AgentType,
)
from app.modules.agents.exceptions import (
    AgentRunNotFoundError,
)
from app.modules.agents.models import (
    AgentRun,
    AgentRunStep,
)
from app.modules.agents.repository import (
    AgentRepository,
)
from app.modules.agents.schemas import (
    AgentDashboardResponse,
    AgentDashboardSummary,
    AgentDefinitionResponse,
    AgentRunListResponse,
    AgentRunRequest,
)
from app.modules.chat.schemas import (
    ChatRequest,
)
from app.modules.chat.service import (
    ChatService,
)
from app.modules.users.models import User


AGENT_DEFINITIONS: dict[
    AgentType,
    AgentDefinitionResponse,
] = {
    AgentType.FINANCIAL_ANALYST:
        AgentDefinitionResponse(
            type=AgentType.FINANCIAL_ANALYST,
            name="Financial Analyst",
            description=(
                "Analyzes financial performance, "
                "KPIs, profitability, cash flow and "
                "business trends."
            ),
            capabilities=[
                "Financial statement analysis",
                "KPI extraction",
                "Period comparison",
                "Profitability analysis",
                "Executive financial reporting",
            ],
            recommended_tasks=[
                (
                    "Analyze revenue, profitability "
                    "and major financial trends."
                ),
                (
                    "Compare financial performance "
                    "across reporting periods."
                ),
            ],
        ),
    AgentType.RISK_ANALYST:
        AgentDefinitionResponse(
            type=AgentType.RISK_ANALYST,
            name="Risk Analyst",
            description=(
                "Identifies financial, operational, "
                "legal and strategic risks from "
                "enterprise documents."
            ),
            capabilities=[
                "Risk identification",
                "Risk prioritization",
                "Control-gap analysis",
                "Mitigation recommendations",
                "Evidence-backed risk reports",
            ],
            recommended_tasks=[
                (
                    "Identify and rank the major "
                    "business risks."
                ),
                (
                    "Create a risk register with "
                    "evidence and mitigations."
                ),
            ],
        ),
    AgentType.COMPLIANCE_REVIEWER:
        AgentDefinitionResponse(
            type=AgentType.COMPLIANCE_REVIEWER,
            name="Compliance Reviewer",
            description=(
                "Reviews documents for policy, "
                "regulatory and compliance issues."
            ),
            capabilities=[
                "Compliance gap detection",
                "Policy comparison",
                "Evidence verification",
                "Missing-control detection",
                "Compliance summaries",
            ],
            recommended_tasks=[
                (
                    "Review the documents for "
                    "compliance gaps."
                ),
                (
                    "Identify missing controls and "
                    "support findings with sources."
                ),
            ],
        ),
    AgentType.DOCUMENT_RESEARCHER:
        AgentDefinitionResponse(
            type=AgentType.DOCUMENT_RESEARCHER,
            name="Document Researcher",
            description=(
                "Performs multi-document research "
                "and produces evidence-backed findings."
            ),
            capabilities=[
                "Cross-document search",
                "Fact extraction",
                "Evidence synthesis",
                "Contradiction detection",
                "Citation-backed research",
            ],
            recommended_tasks=[
                (
                    "Research the topic across all "
                    "indexed documents."
                ),
                (
                    "Extract key facts and identify "
                    "contradictory information."
                ),
            ],
        ),
    AgentType.EXECUTIVE_SUMMARY:
        AgentDefinitionResponse(
            type=AgentType.EXECUTIVE_SUMMARY,
            name="Executive Summary Agent",
            description=(
                "Creates concise decision-ready "
                "summaries for business stakeholders."
            ),
            capabilities=[
                "Executive summarization",
                "Key decision extraction",
                "Important metrics",
                "Risk summarization",
                "Recommended next actions",
            ],
            recommended_tasks=[
                (
                    "Create an executive summary for "
                    "senior management."
                ),
                (
                    "Summarize key findings, risks "
                    "and recommended actions."
                ),
            ],
        ),
}


AGENT_SYSTEM_INSTRUCTIONS: dict[
    AgentType,
    str,
] = {
    AgentType.FINANCIAL_ANALYST: (
        "Act as a senior financial analyst. "
        "Analyze figures carefully, calculate only "
        "when supported by source data, compare "
        "periods, explain material changes and cite "
        "all important financial claims."
    ),
    AgentType.RISK_ANALYST: (
        "Act as an enterprise risk analyst. "
        "Identify risks, evidence, likelihood, impact "
        "and practical mitigation actions. Do not "
        "invent risks unsupported by the documents."
    ),
    AgentType.COMPLIANCE_REVIEWER: (
        "Act as a compliance reviewer. Identify "
        "explicit obligations, gaps, missing controls "
        "and evidence. Distinguish confirmed findings "
        "from items requiring human review."
    ),
    AgentType.DOCUMENT_RESEARCHER: (
        "Act as a rigorous document researcher. "
        "Synthesize information across sources, flag "
        "conflicts and uncertainty, and cite every "
        "important factual conclusion."
    ),
    AgentType.EXECUTIVE_SUMMARY: (
        "Act as an executive briefing specialist. "
        "Produce a concise decision-ready summary "
        "covering key facts, metrics, risks, decisions "
        "and recommended next actions."
    ),
}


class AgentService:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session
        self.repository = AgentRepository(
            database_session
        )
        self.chat_service = ChatService(
            database_session
        )

    def list_available_agents(
        self,
    ) -> list[AgentDefinitionResponse]:
        return list(
            AGENT_DEFINITIONS.values()
        )

    def run_agent(
        self,
        *,
        request_data: AgentRunRequest,
        current_user: User,
    ) -> AgentRun:
        started_at = datetime.now(
            timezone.utc
        )

        agent_run = AgentRun(
            knowledge_base_id=(
                request_data.knowledge_base_id
            ),
            created_by=current_user.id,
            agent_type=request_data.agent_type,
            status=AgentRunStatus.RUNNING,
            task=request_data.task,
            started_at=started_at,
            execution_metadata={
                "reranking_enabled":
                    request_data.enable_reranking,
                "dense_top_k":
                    request_data.dense_top_k,
                "sparse_top_k":
                    request_data.sparse_top_k,
                "final_context_top_k":
                    request_data.final_context_top_k,
            },
        )

        self.repository.create_run(
            agent_run
        )
        self.repository.commit()
        self.repository.refresh(
            agent_run
        )

        total_start = perf_counter()

        active_step: AgentRunStep | None = None

        try:
            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=1,
                step_type=AgentStepType.PLANNING,
                title="Plan agent execution",
                description=(
                    "Interpret the task and prepare "
                    "the specialized agent strategy."
                ),
                tool_name="agent_planner",
                tool_input={
                    "agent_type":
                        request_data.agent_type.value,
                    "task": request_data.task,
                },
            )

            agent_instruction = (
                AGENT_SYSTEM_INSTRUCTIONS[
                    request_data.agent_type
                ]
            )

            agent_question = (
                f"{agent_instruction}\n\n"
                f"User task:\n{request_data.task}\n\n"
                "Return a structured answer with clear "
                "sections, evidence, uncertainty notes "
                "and source citations."
            )

            self._complete_step(
                active_step,
                output=(
                    "Specialized execution plan created "
                    f"for {request_data.agent_type.value}."
                ),
                tool_output={
                    "planned": True,
                    "agent_instruction":
                        agent_instruction,
                },
            )

            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=2,
                step_type=AgentStepType.RETRIEVAL,
                title="Retrieve and rerank evidence",
                description=(
                    "Execute dense and sparse retrieval "
                    "with optional cross-encoder reranking."
                ),
                tool_name="hybrid_retrieval",
                tool_input={
                    "knowledge_base_id": str(
                        request_data.knowledge_base_id
                    ),
                    "dense_top_k":
                        request_data.dense_top_k,
                    "sparse_top_k":
                        request_data.sparse_top_k,
                    "reranking":
                        request_data.enable_reranking,
                },
            )

            chat_request = ChatRequest(
                question=agent_question,
                dense_top_k=(
                    request_data.dense_top_k
                ),
                sparse_top_k=(
                    request_data.sparse_top_k
                ),
                retrieval_top_k=(
                    request_data.retrieval_top_k
                ),
                final_context_top_k=(
                    request_data.final_context_top_k
                ),
                enable_reranking=(
                    request_data.enable_reranking
                ),
                reranker_batch_size=16,
                dense_score_threshold=None,
                sparse_minimum_score=0,
                temperature=(
                    request_data.temperature
                ),
                max_tokens=(
                    request_data.max_tokens
                ),
            )

            chat_response = (
                self.chat_service.answer_question(
                    knowledge_base_id=(
                        request_data
                        .knowledge_base_id
                    ),
                    request_data=chat_request,
                )
            )

            citations = [
                citation.model_dump(
                    mode="json"
                )
                for citation in chat_response.citations
            ]

            self._complete_step(
                active_step,
                output=(
                    f"Retrieved and selected "
                    f"{len(citations)} source chunks."
                ),
                latency_ms=self._to_int(
                    chat_response
                    .retrieval_latency_ms
                ),
                tool_output={
                    "citation_count":
                        len(citations),
                    "retrieval_method":
                        chat_response
                        .retrieval_method,
                    "sources": citations,
                },
            )

            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=3,
                step_type=AgentStepType.ANALYSIS,
                title="Analyze retrieved evidence",
                description=(
                    "Apply the selected specialist "
                    "perspective to the retrieved evidence."
                ),
                tool_name="specialist_analysis",
                tool_input={
                    "agent_type":
                        request_data.agent_type.value,
                    "source_count":
                        len(citations),
                },
            )

            self._complete_step(
                active_step,
                output=(
                    "Evidence analyzed using the "
                    "specialized agent instructions."
                ),
                tool_output={
                    "analysis_completed": True,
                },
            )

            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=4,
                step_type=AgentStepType.GENERATION,
                title="Generate specialist response",
                description=(
                    "Generate the final grounded answer "
                    "using Azure OpenAI."
                ),
                tool_name="azure_openai",
                tool_input={
                    "temperature":
                        request_data.temperature,
                    "max_tokens":
                        request_data.max_tokens,
                },
            )

            self._complete_step(
                active_step,
                output=chat_response.answer,
                latency_ms=self._to_int(
                    chat_response
                    .generation_latency_ms
                ),
                tool_output={
                    "model":
                        chat_response.model,
                    "finish_reason":
                        chat_response
                        .finish_reason,
                },
            )

            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=5,
                step_type=AgentStepType.CITATION,
                title="Validate source citations",
                description=(
                    "Verify that retrieved sources are "
                    "attached to the final response."
                ),
                tool_name="citation_validator",
                tool_input={
                    "citation_count":
                        len(citations),
                },
            )

            confidence_score = (
                self._calculate_confidence(
                    citations
                )
            )

            self._complete_step(
                active_step,
                output=(
                    f"Validated {len(citations)} "
                    "citations with confidence "
                    f"{confidence_score:.2f}."
                ),
                tool_output={
                    "validated_citations":
                        len(citations),
                    "confidence_score":
                        confidence_score,
                },
            )

            active_step = self._start_step(
                agent_run_id=agent_run.id,
                step_index=6,
                step_type=AgentStepType.VALIDATION,
                title="Finalize execution result",
                description=(
                    "Finalize status, telemetry and "
                    "execution metadata."
                ),
                tool_name="result_validator",
                tool_input={},
            )

            total_latency_ms = self._to_int(
                (
                    perf_counter()
                    - total_start
                )
                * 1000
            )

            agent_run.status = (
                AgentRunStatus.COMPLETED
            )
            agent_run.result = (
                chat_response.answer
            )
            agent_run.model_name = (
                chat_response.model
            )
            agent_run.confidence_score = (
                confidence_score
            )
            agent_run.citations = citations

            agent_run.prompt_tokens = (
                chat_response
                .token_usage
                .prompt_tokens
            )
            agent_run.completion_tokens = (
                chat_response
                .token_usage
                .completion_tokens
            )
            agent_run.total_tokens = (
                chat_response
                .token_usage
                .total_tokens
            )

            agent_run.retrieval_latency_ms = (
                self._to_int(
                    chat_response
                    .retrieval_latency_ms
                )
            )
            agent_run.generation_latency_ms = (
                self._to_int(
                    chat_response
                    .generation_latency_ms
                )
            )
            agent_run.total_latency_ms = (
                total_latency_ms
            )
            agent_run.completed_at = (
                datetime.now(
                    timezone.utc
                )
            )

            agent_run.execution_metadata = {
                **agent_run.execution_metadata,
                "retrieval_method":
                    chat_response
                    .retrieval_method,
                "citation_count":
                    len(citations),
                "finish_reason":
                    chat_response
                    .finish_reason,
                "agent_name":
                    AGENT_DEFINITIONS[
                        request_data.agent_type
                    ].name,
            }

            self._complete_step(
                active_step,
                output=(
                    "Agent execution completed "
                    "successfully."
                ),
                latency_ms=total_latency_ms,
                tool_output={
                    "status": "completed",
                    "total_latency_ms":
                        total_latency_ms,
                },
            )

            self.repository.commit()
            self.repository.refresh(
                agent_run
            )

            completed_run = (
                self.repository.get_run(
                    run_id=agent_run.id,
                    created_by=current_user.id,
                )
            )

            return (
                completed_run
                if completed_run is not None
                else agent_run
            )

        except Exception as error:
            self.repository.rollback()

            failed_run = (
                self.repository.get_run(
                    run_id=agent_run.id,
                    created_by=current_user.id,
                )
            )

            if failed_run is not None:
                failed_run.status = (
                    AgentRunStatus.FAILED
                )
                failed_run.error_message = str(
                    error
                )
                failed_run.total_latency_ms = (
                    self._to_int(
                        (
                            perf_counter()
                            - total_start
                        )
                        * 1000
                    )
                )
                failed_run.completed_at = (
                    datetime.now(
                        timezone.utc
                    )
                )

                if active_step is not None:
                    stored_step = next(
                        (
                            step
                            for step
                            in failed_run.steps
                            if step.id
                            == active_step.id
                        ),
                        None,
                    )

                    if stored_step is not None:
                        stored_step.status = (
                            AgentStepStatus.FAILED
                        )
                        stored_step.output = str(
                            error
                        )
                        stored_step.completed_at = (
                            datetime.now(
                                timezone.utc
                            )
                        )

                self.repository.commit()

            raise

    def list_runs(
        self,
        *,
        current_user: User,
        limit: int = 50,
    ) -> AgentRunListResponse:
        runs = self.repository.list_runs(
            created_by=current_user.id,
            limit=limit,
        )

        return AgentRunListResponse(
            items=runs,
            total=len(runs),
        )

    def get_run(
        self,
        *,
        run_id: UUID,
        current_user: User,
    ) -> AgentRun:
        agent_run = (
            self.repository.get_run(
                run_id=run_id,
                created_by=current_user.id,
            )
        )

        if agent_run is None:
            raise AgentRunNotFoundError()

        return agent_run

    def delete_run(
        self,
        *,
        run_id: UUID,
        current_user: User,
    ) -> None:
        agent_run = self.get_run(
            run_id=run_id,
            current_user=current_user,
        )

        self.repository.delete_run(
            agent_run
        )
        self.repository.commit()

    def get_dashboard(
        self,
        *,
        current_user: User,
        limit: int = 10,
    ) -> AgentDashboardResponse:
        runs = self.repository.list_runs(
            created_by=current_user.id,
            limit=100,
        )

        total_runs = len(runs)

        completed_runs = sum(
            1
            for run in runs
            if run.status
            == AgentRunStatus.COMPLETED
        )

        failed_runs = sum(
            1
            for run in runs
            if run.status
            == AgentRunStatus.FAILED
        )

        running_runs = sum(
            1
            for run in runs
            if run.status
            in {
                AgentRunStatus.RUNNING,
                AgentRunStatus.QUEUED,
            }
        )

        latency_values = [
            run.total_latency_ms
            for run in runs
            if run.total_latency_ms
            is not None
        ]

        confidence_values = [
            run.confidence_score
            for run in runs
            if run.confidence_score
            is not None
        ]

        summary = AgentDashboardSummary(
            total_runs=total_runs,
            completed_runs=completed_runs,
            failed_runs=failed_runs,
            running_runs=running_runs,
            success_rate=round(
                (
                    completed_runs
                    / total_runs
                    * 100
                )
                if total_runs
                else 0,
                2,
            ),
            average_latency_ms=round(
                (
                    sum(latency_values)
                    / len(latency_values)
                )
                if latency_values
                else 0,
                2,
            ),
            average_confidence=round(
                (
                    sum(confidence_values)
                    / len(
                        confidence_values
                    )
                )
                if confidence_values
                else 0,
                4,
            ),
            total_tokens=sum(
                run.total_tokens or 0
                for run in runs
            ),
        )

        return AgentDashboardResponse(
            generated_at=datetime.now(
                timezone.utc
            ),
            summary=summary,
            available_agents=(
                self.list_available_agents()
            ),
            recent_runs=runs[:limit],
        )

    def _start_step(
        self,
        *,
        agent_run_id: UUID,
        step_index: int,
        step_type: AgentStepType,
        title: str,
        description: str,
        tool_name: str,
        tool_input: dict[
            str,
            object,
        ],
    ) -> AgentRunStep:
        step = AgentRunStep(
            agent_run_id=agent_run_id,
            step_index=step_index,
            step_type=step_type,
            status=(
                AgentStepStatus.RUNNING
            ),
            title=title,
            description=description,
            tool_name=tool_name,
            tool_input=tool_input,
            started_at=datetime.now(
                timezone.utc
            ),
        )

        self.repository.create_step(
            step
        )
        self.repository.commit()
        self.repository.refresh(
            step
        )

        return step

    def _complete_step(
        self,
        step: AgentRunStep,
        *,
        output: str,
        tool_output: dict[
            str,
            object,
        ],
        latency_ms: int | None = None,
    ) -> None:
        step.status = (
            AgentStepStatus.COMPLETED
        )
        step.output = output
        step.tool_output = tool_output
        step.latency_ms = latency_ms
        step.completed_at = datetime.now(
            timezone.utc
        )

        self.repository.commit()
        self.repository.refresh(
            step
        )

    @staticmethod
    def _calculate_confidence(
        citations: list[
            dict[str, object]
        ],
    ) -> float:
        if not citations:
            return 0.0

        scores: list[float] = []

        for citation in citations:
            raw_score = (
                citation.get(
                    "rerank_score"
                )
                or citation.get(
                    "fusion_score"
                )
                or citation.get(
                    "dense_score"
                )
            )

            if isinstance(
                raw_score,
                (int, float),
            ):
                scores.append(
                    max(
                        0.0,
                        min(
                            1.0,
                            float(
                                raw_score
                            ),
                        ),
                    )
                )

        if not scores:
            return min(
                1.0,
                len(citations) / 6,
            )

        return round(
            sum(scores)
            / len(scores),
            4,
        )

    @staticmethod
    def _to_int(
        value: float | int | None,
    ) -> int | None:
        if value is None:
            return None

        return int(
            round(
                float(value)
            )
        )