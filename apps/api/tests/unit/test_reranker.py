from uuid import uuid4

import pytest

from app.ai.retrieval.hybrid import (
    HybridSearchResult,
)
from app.ai.retrieval.reranker import (
    CrossEncoderReranker,
)


class FakeCrossEncoder:
    def predict(
        self,
        pairs,
        *,
        batch_size: int,
        show_progress_bar: bool,
    ):
        assert batch_size > 0
        assert show_progress_bar is False

        return [
            0.2,
            0.9,
            0.5,
        ][:len(pairs)]


def build_result(
    content: str,
    chunk_index: int,
) -> HybridSearchResult:
    knowledge_base_id = uuid4()
    document_id = uuid4()

    return HybridSearchResult(
        item_id=(
            f"document:{document_id}:"
            f"chunk:{chunk_index}"
        ),
        document_id=document_id,
        knowledge_base_id=(
            knowledge_base_id
        ),
        chunk_id=uuid4(),
        chunk_index=chunk_index,
        filename="test.pdf",
        content=content,
        page_number=1,
        dense_score=0.8,
        sparse_score=2.0,
        fusion_score=0.03,
        dense_rank=chunk_index + 1,
        sparse_rank=chunk_index + 1,
        metadata={},
    )


def test_reranker_orders_by_cross_encoder_score() -> None:
    reranker = CrossEncoderReranker.__new__(
        CrossEncoderReranker
    )

    reranker.model_name = "fake-model"
    reranker.model = FakeCrossEncoder()

    candidates = [
        build_result(
            "First candidate",
            0,
        ),
        build_result(
            "Most relevant candidate",
            1,
        ),
        build_result(
            "Third candidate",
            2,
        ),
    ]

    results = reranker.rerank(
        query="relevant query",
        candidates=candidates,
        limit=3,
    )

    assert results[0].chunk_index == 1
    assert results[0].rerank_score == 0.9
    assert results[0].rerank_rank == 1


def test_reranker_returns_empty_candidates() -> None:
    reranker = CrossEncoderReranker.__new__(
        CrossEncoderReranker
    )

    reranker.model_name = "fake-model"
    reranker.model = FakeCrossEncoder()

    assert (
        reranker.rerank(
            query="query",
            candidates=[],
            limit=5,
        )
        == []
    )


def test_reranker_rejects_empty_query() -> None:
    reranker = CrossEncoderReranker.__new__(
        CrossEncoderReranker
    )

    reranker.model_name = "fake-model"
    reranker.model = FakeCrossEncoder()

    with pytest.raises(
        ValueError,
        match="cannot be empty",
    ):
        reranker.rerank(
            query=" ",
            candidates=[],
            limit=5,
        )