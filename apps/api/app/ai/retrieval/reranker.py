from dataclasses import replace
from functools import lru_cache
from typing import Sequence

from sentence_transformers import CrossEncoder

from app.ai.retrieval.hybrid import HybridSearchResult
from app.core.config import settings


class CrossEncoderReranker:
    """
    Re-rank retrieval candidates using a cross-encoder model.

    The cross-encoder receives query-document pairs and produces one
    relevance score for each candidate chunk.
    """

    def __init__(
        self,
        model_name: str | None = None,
    ) -> None:
        self.model_name = (
            model_name
            or settings.reranker_model
        )

        self.model = CrossEncoder(
            self.model_name
        )

    def rerank(
        self,
        *,
        query: str,
        candidates: Sequence[HybridSearchResult],
        limit: int,
        batch_size: int = 16,
    ) -> list[HybridSearchResult]:
        """
        Re-rank candidate chunks and return the highest scoring results.
        """

        normalized_query = " ".join(
            query.split()
        ).strip()

        if not normalized_query:
            raise ValueError(
                "Reranking query cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "Reranking limit must be greater than zero."
            )

        if batch_size <= 0:
            raise ValueError(
                "Reranking batch size must be greater than zero."
            )

        candidate_list = list(
            candidates
        )

        if not candidate_list:
            return []

        query_document_pairs = [
            (
                normalized_query,
                candidate.content,
            )
            for candidate in candidate_list
        ]

        raw_scores = self.model.predict(
            query_document_pairs,
            batch_size=batch_size,
            show_progress_bar=False,
        )

        scored_candidates = [
            (
                candidate,
                float(score),
            )
            for candidate, score in zip(
                candidate_list,
                raw_scores,
                strict=True,
            )
        ]

        scored_candidates.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        reranked_results: list[
            HybridSearchResult
        ] = []

        for rank, (
            candidate,
            score,
        ) in enumerate(
            scored_candidates[:limit],
            start=1,
        ):
            reranked_results.append(
                replace(
                    candidate,
                    rerank_score=score,
                    rerank_rank=rank,
                )
            )

        return reranked_results


@lru_cache(maxsize=1)
def get_reranker() -> CrossEncoderReranker:
    """
    Return one cached reranker instance per Python process.
    """

    return CrossEncoderReranker()