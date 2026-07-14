from dataclasses import dataclass
from typing import Any, Sequence


@dataclass(frozen=True)
class RankedRetrievalItem:
    """
    One normalized retrieval item from any retriever.

    `item_id` should uniquely identify a chunk across all retrieval systems.
    """

    item_id: str
    rank: int
    score: float
    payload: dict[str, Any]


@dataclass(frozen=True)
class FusedRetrievalResult:
    """
    Final result produced after reciprocal-rank fusion.
    """

    item_id: str
    fusion_score: float
    dense_rank: int | None
    sparse_rank: int | None
    dense_score: float | None
    sparse_score: float | None
    payload: dict[str, Any]


class ReciprocalRankFusion:
    """
    Merge ranked lists using Reciprocal Rank Fusion.

    Formula:

        RRF score = sum(weight / (rank_constant + rank))

    RRF is useful because dense and sparse scores are not directly
    comparable. It combines ranking positions instead of raw scores.
    """

    def __init__(
        self,
        *,
        rank_constant: int = 60,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> None:
        if rank_constant <= 0:
            raise ValueError(
                "Rank constant must be greater than zero."
            )

        if dense_weight < 0:
            raise ValueError(
                "Dense weight cannot be negative."
            )

        if sparse_weight < 0:
            raise ValueError(
                "Sparse weight cannot be negative."
            )

        if dense_weight == 0 and sparse_weight == 0:
            raise ValueError(
                "At least one retrieval weight must be greater than zero."
            )

        self.rank_constant = rank_constant
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight

    def fuse(
        self,
        *,
        dense_results: Sequence[RankedRetrievalItem],
        sparse_results: Sequence[RankedRetrievalItem],
        limit: int = 10,
    ) -> list[FusedRetrievalResult]:
        """
        Fuse dense and sparse ranked lists.

        Duplicate item IDs are merged into a single result.
        """

        if limit <= 0:
            raise ValueError(
                "Fusion result limit must be greater than zero."
            )

        accumulator: dict[
            str,
            dict[str, Any],
        ] = {}

        self._accumulate(
            accumulator=accumulator,
            results=dense_results,
            retrieval_type="dense",
            weight=self.dense_weight,
        )

        self._accumulate(
            accumulator=accumulator,
            results=sparse_results,
            retrieval_type="sparse",
            weight=self.sparse_weight,
        )

        fused_results = [
            FusedRetrievalResult(
                item_id=item_id,
                fusion_score=float(
                    values["fusion_score"]
                ),
                dense_rank=values.get(
                    "dense_rank"
                ),
                sparse_rank=values.get(
                    "sparse_rank"
                ),
                dense_score=values.get(
                    "dense_score"
                ),
                sparse_score=values.get(
                    "sparse_score"
                ),
                payload=dict(
                    values["payload"]
                ),
            )
            for item_id, values in accumulator.items()
        ]

        fused_results.sort(
            key=lambda result: (
                result.fusion_score,
                result.dense_score or 0.0,
                result.sparse_score or 0.0,
            ),
            reverse=True,
        )

        return fused_results[:limit]

    def _accumulate(
        self,
        *,
        accumulator: dict[str, dict[str, Any]],
        results: Sequence[RankedRetrievalItem],
        retrieval_type: str,
        weight: float,
    ) -> None:
        """
        Add one retrieval list to the shared fusion accumulator.
        """

        if weight == 0:
            return

        for result in results:
            if result.rank <= 0:
                raise ValueError(
                    "Retrieval rank must be greater than zero."
                )

            rrf_score = weight / (
                self.rank_constant
                + result.rank
            )

            entry = accumulator.setdefault(
                result.item_id,
                {
                    "fusion_score": 0.0,
                    "dense_rank": None,
                    "sparse_rank": None,
                    "dense_score": None,
                    "sparse_score": None,
                    "payload": dict(
                        result.payload
                    ),
                },
            )

            entry["fusion_score"] += rrf_score

            if retrieval_type == "dense":
                entry["dense_rank"] = (
                    result.rank
                )
                entry["dense_score"] = (
                    result.score
                )

            elif retrieval_type == "sparse":
                entry["sparse_rank"] = (
                    result.rank
                )
                entry["sparse_score"] = (
                    result.score
                )

            else:
                raise ValueError(
                    "Unsupported retrieval type."
                )