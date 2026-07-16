import math
import re
from collections import defaultdict
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.chat.models import (
    ChatMessage,
)
from app.modules.evaluations.schemas import (
    EvaluationDashboardResponse,
    EvaluationHistoryItem,
    EvaluationMetricResponse,
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationSummaryResponse,
    EvaluationTrendPoint,
)


PASS_THRESHOLD = 0.65

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "were",
    "will",
    "with",
}


def safe_float(
    value: Any,
) -> float:
    if value is None:
        return 0.0

    try:
        return float(value)
    except (
        TypeError,
        ValueError,
    ):
        return 0.0


def safe_int(
    value: Any,
) -> int:
    if value is None:
        return 0

    try:
        return int(value)
    except (
        TypeError,
        ValueError,
    ):
        return 0


def clamp_score(
    value: float,
) -> float:
    return max(
        0.0,
        min(
            1.0,
            value,
        ),
    )


def normalize_role(
    value: Any,
) -> str:
    raw_value = getattr(
        value,
        "value",
        value,
    )

    return str(
        raw_value or "",
    ).lower()


def make_utc_aware(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc,
        )

    return value.astimezone(
        timezone.utc,
    )


def tokenize(
    value: str,
) -> set[str]:
    words = re.findall(
        r"[a-zA-Z0-9]+",
        value.lower(),
    )

    return {
        word
        for word in words
        if (
            len(word) > 2
            and word not in STOP_WORDS
        )
    }


def calculate_overlap(
    first_text: str,
    second_text: str,
) -> float:
    first_tokens = tokenize(
        first_text,
    )

    second_tokens = tokenize(
        second_text,
    )

    if not first_tokens:
        return 0.0

    overlap = (
        first_tokens
        & second_tokens
    )

    return clamp_score(
        len(overlap)
        / len(first_tokens),
    )


def extract_citations(
    message: ChatMessage,
) -> list[dict[str, Any]]:
    citations = getattr(
        message,
        "citations",
        None,
    )

    if isinstance(
        citations,
        list,
    ):
        return [
            citation
            for citation in citations
            if isinstance(
                citation,
                dict,
            )
        ]

    return []


def extract_contexts(
    citations: list[
        dict[str, Any]
    ],
) -> list[str]:
    contexts: list[str] = []

    for citation in citations:
        content = (
            citation.get("content")
            or citation.get(
                "content_preview",
            )
            or citation.get(
                "excerpt",
            )
            or citation.get("text")
            or ""
        )

        if (
            isinstance(
                content,
                str,
            )
            and content.strip()
        ):
            contexts.append(
                content.strip(),
            )

    return contexts


def calculate_grade(
    score: float,
) -> str:
    if score >= 0.90:
        return "A+"

    if score >= 0.80:
        return "A"

    if score >= 0.70:
        return "B"

    if score >= 0.60:
        return "C"

    if score >= 0.50:
        return "D"

    return "F"


class EvaluationService:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

    def run_evaluation(
        self,
        request_data: EvaluationRunRequest,
    ) -> EvaluationRunResponse:
        result = self._evaluate_values(
            question=request_data.question,
            answer=request_data.answer,
            expected_answer=(
                request_data.expected_answer
            ),
            contexts=request_data.contexts,
            citations=request_data.citations,
            retrieval_latency_ms=(
                request_data
                .retrieval_latency_ms
            ),
            generation_latency_ms=(
                request_data
                .generation_latency_ms
            ),
            total_latency_ms=(
                request_data
                .total_latency_ms
            ),
            prompt_tokens=(
                request_data.prompt_tokens
            ),
            completion_tokens=(
                request_data
                .completion_tokens
            ),
            total_tokens=(
                request_data.total_tokens
            ),
        )

        return EvaluationRunResponse(
            id=str(uuid4()),
            **result,
        )

    def get_dashboard(
        self,
        days: int = 7,
        limit: int = 20,
    ) -> EvaluationDashboardResponse:
        evaluation_items = (
            self._build_history(
                limit=limit,
            )
        )

        summary = (
            self._build_summary(
                evaluation_items,
            )
        )

        trends = self._build_trends(
            evaluation_items,
            days=days,
        )

        return EvaluationDashboardResponse(
            generated_at=datetime.now(
                timezone.utc,
            ),
            summary=summary,
            trends=trends,
            recent_evaluations=(
                evaluation_items
            ),
        )

    def get_history(
        self,
        limit: int = 50,
    ) -> list[
        EvaluationHistoryItem
    ]:
        return self._build_history(
            limit=limit,
        )

    def _build_history(
        self,
        limit: int,
    ) -> list[
        EvaluationHistoryItem
    ]:
        created_at_column = getattr(
            ChatMessage,
            "created_at",
            None,
        )

        if created_at_column is None:
            return []

        messages = (
            self.database_session.execute(
                select(ChatMessage)
                .order_by(
                    created_at_column.desc(),
                )
                .limit(
                    max(
                        limit * 4,
                        50,
                    )
                )
            )
            .scalars()
            .all()
        )

        messages_by_conversation: dict[
            str,
            list[ChatMessage],
        ] = defaultdict(list)

        for message in messages:
            conversation_id = getattr(
                message,
                "conversation_id",
                None,
            )

            if conversation_id is None:
                continue

            messages_by_conversation[
                str(conversation_id)
            ].append(message)

        results: list[
            EvaluationHistoryItem
        ] = []

        for conversation_messages in (
            messages_by_conversation.values()
        ):
            ordered_messages = sorted(
                conversation_messages,
                key=lambda item: getattr(
                    item,
                    "created_at",
                    datetime.min,
                ),
            )

            for index, message in enumerate(
                ordered_messages,
            ):
                if (
                    normalize_role(
                        getattr(
                            message,
                            "role",
                            "",
                        )
                    )
                    != "assistant"
                ):
                    continue

                user_question = ""

                for previous_index in range(
                    index - 1,
                    -1,
                    -1,
                ):
                    previous_message = (
                        ordered_messages[
                            previous_index
                        ]
                    )

                    if (
                        normalize_role(
                            getattr(
                                previous_message,
                                "role",
                                "",
                            )
                        )
                        == "user"
                    ):
                        user_question = str(
                            getattr(
                                previous_message,
                                "content",
                                "",
                            )
                            or ""
                        )

                        break

                answer = str(
                    getattr(
                        message,
                        "content",
                        "",
                    )
                    or ""
                )

                if not answer.strip():
                    continue

                citations = (
                    extract_citations(
                        message,
                    )
                )

                contexts = (
                    extract_contexts(
                        citations,
                    )
                )

                token_usage = getattr(
                    message,
                    "token_usage",
                    None,
                )

                if not isinstance(
                    token_usage,
                    dict,
                ):
                    token_usage = {}

                evaluated = (
                    self._evaluate_values(
                        question=(
                            user_question
                        ),
                        answer=answer,
                        expected_answer=None,
                        contexts=contexts,
                        citations=citations,
                        retrieval_latency_ms=getattr(
                            message,
                            "retrieval_latency_ms",
                            None,
                        ),
                        generation_latency_ms=getattr(
                            message,
                            "generation_latency_ms",
                            None,
                        ),
                        total_latency_ms=getattr(
                            message,
                            "total_latency_ms",
                            None,
                        ),
                        prompt_tokens=safe_int(
                            token_usage.get(
                                "prompt_tokens",
                            )
                        ),
                        completion_tokens=safe_int(
                            token_usage.get(
                                "completion_tokens",
                            )
                        ),
                        total_tokens=safe_int(
                            token_usage.get(
                                "total_tokens",
                            )
                        ),
                    )
                )

                created_at = getattr(
                    message,
                    "created_at",
                    datetime.now(
                        timezone.utc,
                    ),
                )

                if isinstance(
                    created_at,
                    datetime,
                ):
                    created_at = (
                        make_utc_aware(
                            created_at,
                        )
                    )
                else:
                    created_at = (
                        datetime.now(
                            timezone.utc,
                        )
                    )

                metric_scores = {
                    metric.name:
                        metric.score
                    for metric in evaluated[
                        "metrics"
                    ]
                }

                results.append(
                    EvaluationHistoryItem(
                        id=str(
                            getattr(
                                message,
                                "id",
                                uuid4(),
                            )
                        ),
                        conversation_id=str(
                            getattr(
                                message,
                                "conversation_id",
                                "",
                            )
                        )
                        or None,
                        message_id=str(
                            getattr(
                                message,
                                "id",
                                "",
                            )
                        )
                        or None,
                        question=(
                            user_question
                            or (
                                "Conversation "
                                "question"
                            )
                        ),
                        answer_preview=(
                            answer[:220]
                        ),
                        overall_score=(
                            evaluated[
                                "overall_score"
                            ]
                        ),
                        passed=evaluated[
                            "passed"
                        ],
                        grade=evaluated[
                            "grade"
                        ],
                        groundedness=(
                            metric_scores.get(
                                "Groundedness",
                                0,
                            )
                        ),
                        answer_relevancy=(
                            metric_scores.get(
                                "Answer relevancy",
                                0,
                            )
                        ),
                        citation_coverage=(
                            metric_scores.get(
                                "Citation coverage",
                                0,
                            )
                        ),
                        context_utilization=(
                            metric_scores.get(
                                "Context utilization",
                                0,
                            )
                        ),
                        hallucination_risk=(
                            evaluated[
                                "hallucination_risk"
                            ]
                        ),
                        citation_count=(
                            evaluated[
                                "citation_count"
                            ]
                        ),
                        total_latency_ms=(
                            evaluated[
                                "total_latency_ms"
                            ]
                        ),
                        total_tokens=(
                            evaluated[
                                "total_tokens"
                            ]
                        ),
                        created_at=(
                            created_at
                        ),
                    )
                )

        return sorted(
            results,
            key=lambda item:
                item.created_at,
            reverse=True,
        )[:limit]

    def _evaluate_values(
        self,
        question: str,
        answer: str,
        expected_answer: str | None,
        contexts: list[str],
        citations: list[
            dict[str, Any]
        ],
        retrieval_latency_ms: float | None,
        generation_latency_ms: float | None,
        total_latency_ms: float | None,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        total_tokens: int | None,
    ) -> dict[str, Any]:
        normalized_question = (
            question.strip()
        )

        normalized_answer = (
            answer.strip()
        )

        combined_context = " ".join(
            context
            for context in contexts
            if context.strip()
        )

        question_tokens = tokenize(
            normalized_question,
        )

        answer_tokens = tokenize(
            normalized_answer,
        )

        context_tokens = tokenize(
            combined_context,
        )

        answer_relevancy = (
            calculate_overlap(
                normalized_question,
                normalized_answer,
            )
        )

        if question_tokens:
            answer_relevancy = clamp_score(
                answer_relevancy
                * 1.4,
            )

        if expected_answer:
            expected_similarity = (
                calculate_overlap(
                    expected_answer,
                    normalized_answer,
                )
            )

            answer_relevancy = (
                answer_relevancy
                * 0.55
                + expected_similarity
                * 0.45
            )

        if context_tokens:
            supported_answer_tokens = (
                answer_tokens
                & context_tokens
            )

            groundedness = clamp_score(
                len(
                    supported_answer_tokens
                )
                / max(
                    len(answer_tokens),
                    1,
                )
            )

            groundedness = clamp_score(
                groundedness * 1.35,
            )

            used_context_tokens = (
                context_tokens
                & answer_tokens
            )

            context_utilization = (
                clamp_score(
                    len(
                        used_context_tokens
                    )
                    / max(
                        min(
                            len(
                                context_tokens
                            ),
                            120,
                        ),
                        1,
                    )
                    * 2.5
                )
            )
        else:
            groundedness = (
                0.35
                if citations
                else 0.15
            )

            context_utilization = (
                0.25
                if citations
                else 0.0
            )

        citation_count = len(
            citations
        )

        source_references = len(
            re.findall(
                r"\[source\s*\d+\]",
                normalized_answer,
                flags=re.IGNORECASE,
            )
        )

        if citation_count > 0:
            citation_coverage = (
                min(
                    source_references,
                    citation_count,
                )
                / citation_count
            )

            if citation_coverage == 0:
                citation_coverage = (
                    min(
                        citation_count,
                        4,
                    )
                    / 4
                    * 0.60
                )
        else:
            citation_coverage = 0.0

        answer_length = len(
            normalized_answer
        )

        completeness_score = clamp_score(
            math.log10(
                max(
                    answer_length,
                    1,
                )
            )
            / 3
        )

        metrics = [
            EvaluationMetricResponse(
                name="Groundedness",
                score=round(
                    groundedness,
                    4,
                ),
                percentage=round(
                    groundedness
                    * 100,
                    2,
                ),
                passed=(
                    groundedness
                    >= PASS_THRESHOLD
                ),
                explanation=(
                    "Measures how much of the "
                    "answer is supported by "
                    "retrieved context."
                ),
            ),
            EvaluationMetricResponse(
                name="Answer relevancy",
                score=round(
                    answer_relevancy,
                    4,
                ),
                percentage=round(
                    answer_relevancy
                    * 100,
                    2,
                ),
                passed=(
                    answer_relevancy
                    >= PASS_THRESHOLD
                ),
                explanation=(
                    "Measures alignment between "
                    "the user question and the "
                    "generated answer."
                ),
            ),
            EvaluationMetricResponse(
                name="Citation coverage",
                score=round(
                    citation_coverage,
                    4,
                ),
                percentage=round(
                    citation_coverage
                    * 100,
                    2,
                ),
                passed=(
                    citation_coverage
                    >= 0.50
                ),
                explanation=(
                    "Measures whether claims are "
                    "accompanied by source "
                    "citations."
                ),
            ),
            EvaluationMetricResponse(
                name=(
                    "Context utilization"
                ),
                score=round(
                    context_utilization,
                    4,
                ),
                percentage=round(
                    context_utilization
                    * 100,
                    2,
                ),
                passed=(
                    context_utilization
                    >= 0.45
                ),
                explanation=(
                    "Measures how effectively "
                    "retrieved information is used "
                    "in the answer."
                ),
            ),
            EvaluationMetricResponse(
                name="Completeness",
                score=round(
                    completeness_score,
                    4,
                ),
                percentage=round(
                    completeness_score
                    * 100,
                    2,
                ),
                passed=(
                    completeness_score
                    >= 0.50
                ),
                explanation=(
                    "Estimates whether the answer "
                    "contains sufficient detail."
                ),
            ),
        ]

        metric_scores = [
            metric.score
            for metric in metrics
        ]

        weights = [
            0.30,
            0.25,
            0.20,
            0.15,
            0.10,
        ]

        overall_score = sum(
            score * weight
            for score, weight in zip(
                metric_scores,
                weights,
            )
        )

        overall_score = clamp_score(
            overall_score,
        )

        hallucination_risk = (
            clamp_score(
                1
                - (
                    groundedness
                    * 0.65
                    + citation_coverage
                    * 0.35
                )
            )
        )

        passed = (
            overall_score
            >= PASS_THRESHOLD
            and hallucination_risk
            <= 0.55
        )

        calculated_total_tokens = (
            safe_int(
                total_tokens,
            )
        )

        if calculated_total_tokens <= 0:
            calculated_total_tokens = (
                safe_int(
                    prompt_tokens,
                )
                + safe_int(
                    completion_tokens,
                )
            )

        return {
            "question": (
                normalized_question
            ),
            "answer_preview": (
                normalized_answer[:250]
            ),
            "overall_score": round(
                overall_score,
                4,
            ),
            "overall_percentage": round(
                overall_score * 100,
                2,
            ),
            "passed": passed,
            "grade": calculate_grade(
                overall_score,
            ),
            "metrics": metrics,
            "hallucination_risk": round(
                hallucination_risk,
                4,
            ),
            "citation_count": (
                citation_count
            ),
            "context_count": len(
                contexts
            ),
            "retrieval_latency_ms": (
                safe_float(
                    retrieval_latency_ms,
                )
                if (
                    retrieval_latency_ms
                    is not None
                )
                else None
            ),
            "generation_latency_ms": (
                safe_float(
                    generation_latency_ms,
                )
                if (
                    generation_latency_ms
                    is not None
                )
                else None
            ),
            "total_latency_ms": (
                safe_float(
                    total_latency_ms,
                )
                if (
                    total_latency_ms
                    is not None
                )
                else None
            ),
            "prompt_tokens": safe_int(
                prompt_tokens,
            ),
            "completion_tokens": (
                safe_int(
                    completion_tokens,
                )
            ),
            "total_tokens": (
                calculated_total_tokens
            ),
            "created_at": datetime.now(
                timezone.utc,
            ),
        }

    def _build_summary(
        self,
        items: list[
            EvaluationHistoryItem
        ],
    ) -> EvaluationSummaryResponse:
        total = len(items)

        if total == 0:
            return (
                EvaluationSummaryResponse()
            )

        passed = sum(
            1
            for item in items
            if item.passed
        )

        failed = total - passed

        return EvaluationSummaryResponse(
            total_evaluations=total,
            passed_evaluations=passed,
            failed_evaluations=failed,
            pass_rate=round(
                passed / total * 100,
                2,
            ),
            average_score=round(
                sum(
                    item.overall_score
                    for item in items
                )
                / total,
                4,
            ),
            average_groundedness=round(
                sum(
                    item.groundedness
                    for item in items
                )
                / total,
                4,
            ),
            average_relevancy=round(
                sum(
                    item.answer_relevancy
                    for item in items
                )
                / total,
                4,
            ),
            average_citation_coverage=round(
                sum(
                    item.citation_coverage
                    for item in items
                )
                / total,
                4,
            ),
            average_context_utilization=round(
                sum(
                    item.context_utilization
                    for item in items
                )
                / total,
                4,
            ),
            average_hallucination_risk=round(
                sum(
                    item.hallucination_risk
                    for item in items
                )
                / total,
                4,
            ),
            average_latency_ms=round(
                sum(
                    item.total_latency_ms
                    or 0
                    for item in items
                )
                / total,
                2,
            ),
            total_tokens=sum(
                item.total_tokens
                for item in items
            ),
        )

    def _build_trends(
        self,
        items: list[
            EvaluationHistoryItem
        ],
        days: int,
    ) -> list[
        EvaluationTrendPoint
    ]:
        start_date = (
            datetime.now(
                timezone.utc,
            )
            - timedelta(
                days=days - 1,
            )
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        grouped: dict[
            str,
            list[
                EvaluationHistoryItem
            ],
        ] = defaultdict(list)

        for item in items:
            created_at = make_utc_aware(
                item.created_at,
            )

            grouped[
                created_at.date()
                .isoformat()
            ].append(item)

        trend_points: list[
            EvaluationTrendPoint
        ] = []

        for offset in range(days):
            point_date = (
                start_date
                + timedelta(
                    days=offset,
                )
            )

            day_items = grouped[
                point_date.date()
                .isoformat()
            ]

            total = len(day_items)

            passed = sum(
                1
                for item in day_items
                if item.passed
            )

            failed = (
                total - passed
            )

            trend_points.append(
                EvaluationTrendPoint(
                    timestamp=(
                        point_date
                    ),
                    evaluations=total,
                    passed=passed,
                    failed=failed,
                    average_score=round(
                        sum(
                            item.overall_score
                            for item
                            in day_items
                        )
                        / total,
                        4,
                    )
                    if total
                    else 0,
                    average_groundedness=round(
                        sum(
                            item.groundedness
                            for item
                            in day_items
                        )
                        / total,
                        4,
                    )
                    if total
                    else 0,
                    average_relevancy=round(
                        sum(
                            item.answer_relevancy
                            for item
                            in day_items
                        )
                        / total,
                        4,
                    )
                    if total
                    else 0,
                )
            )

        return trend_points