import pytest

from app.ai.retrieval.fusion import (
    RankedRetrievalItem,
    ReciprocalRankFusion,
)


def make_item(
    *,
    item_id: str,
    rank: int,
    score: float,
) -> RankedRetrievalItem:
    return RankedRetrievalItem(
        item_id=item_id,
        rank=rank,
        score=score,
        payload={
            "content": f"content-{item_id}",
        },
    )


def test_rrf_prioritizes_item_present_in_both_lists() -> None:
    dense_results = [
        make_item(
            item_id="chunk-a",
            rank=1,
            score=0.92,
        ),
        make_item(
            item_id="chunk-b",
            rank=2,
            score=0.81,
        ),
    ]

    sparse_results = [
        make_item(
            item_id="chunk-b",
            rank=1,
            score=5.2,
        ),
        make_item(
            item_id="chunk-c",
            rank=2,
            score=4.1,
        ),
    ]

    fusion = ReciprocalRankFusion()

    results = fusion.fuse(
        dense_results=dense_results,
        sparse_results=sparse_results,
        limit=3,
    )

    assert len(results) == 3
    assert results[0].item_id == "chunk-b"
    assert results[0].dense_rank == 2
    assert results[0].sparse_rank == 1


def test_rrf_handles_dense_only_results() -> None:
    fusion = ReciprocalRankFusion()

    results = fusion.fuse(
        dense_results=[
            make_item(
                item_id="chunk-a",
                rank=1,
                score=0.9,
            )
        ],
        sparse_results=[],
        limit=5,
    )

    assert len(results) == 1
    assert results[0].dense_rank == 1
    assert results[0].sparse_rank is None


def test_rrf_handles_sparse_only_results() -> None:
    fusion = ReciprocalRankFusion()

    results = fusion.fuse(
        dense_results=[],
        sparse_results=[
            make_item(
                item_id="chunk-a",
                rank=1,
                score=4.8,
            )
        ],
        limit=5,
    )

    assert len(results) == 1
    assert results[0].dense_rank is None
    assert results[0].sparse_rank == 1


def test_rrf_respects_limit() -> None:
    fusion = ReciprocalRankFusion()

    dense_results = [
        make_item(
            item_id=f"chunk-{index}",
            rank=index + 1,
            score=1.0 - index * 0.1,
        )
        for index in range(5)
    ]

    results = fusion.fuse(
        dense_results=dense_results,
        sparse_results=[],
        limit=2,
    )

    assert len(results) == 2


def test_rrf_rejects_invalid_limit() -> None:
    fusion = ReciprocalRankFusion()

    with pytest.raises(
        ValueError,
        match="greater than zero",
    ):
        fusion.fuse(
            dense_results=[],
            sparse_results=[],
            limit=0,
        )


def test_rrf_rejects_invalid_rank() -> None:
    fusion = ReciprocalRankFusion()

    with pytest.raises(
        ValueError,
        match="rank must be greater",
    ):
        fusion.fuse(
            dense_results=[
                make_item(
                    item_id="chunk-a",
                    rank=0,
                    score=0.9,
                )
            ],
            sparse_results=[],
            limit=5,
        )