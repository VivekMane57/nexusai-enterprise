from dataclasses import dataclass
from typing import Any, Sequence
from uuid import UUID

from app.ai.embeddings.bge import BGEEmbeddingService
from app.ai.retrieval.dense import (
    DenseSearchResult,
    QdrantVectorStore,
)
from app.ai.retrieval.fusion import (
    FusedRetrievalResult,
    RankedRetrievalItem,
    ReciprocalRankFusion,
)
from app.ai.retrieval.sparse import (
    BM25SparseRetriever,
    SparseSearchDocument,
    SparseSearchResult,
)


@dataclass(frozen=True)
class HybridSearchResult:
    """
    One final result returned by the hybrid retrieval pipeline.
    """

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

    metadata: dict[str, Any]

    # Added by the cross-encoder reranking stage.
    rerank_score: float | None = None
    rerank_rank: int | None = None


class HybridRetriever:
    """
    Combine dense vector search and sparse BM25 retrieval.

    Pipeline:
    1. Generate a query embedding
    2. Search the Qdrant knowledge-base collection
    3. Build a BM25 index from PostgreSQL chunks
    4. Search the BM25 index
    5. Normalize both result formats
    6. Merge results through Reciprocal Rank Fusion
    7. Return final ranked evidence chunks

    Cross-encoder reranking is performed by RetrievalService after
    this retriever returns the fused candidate results.
    """

    def __init__(
        self,
        *,
        embedding_service: BGEEmbeddingService,
        vector_store: QdrantVectorStore,
        fusion: ReciprocalRankFusion | None = None,
    ) -> None:
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.fusion = fusion or ReciprocalRankFusion()

    def search(
        self,
        *,
        knowledge_base_id: UUID,
        query: str,
        sparse_documents: Sequence[
            SparseSearchDocument
        ],
        dense_top_k: int = 20,
        sparse_top_k: int = 20,
        final_top_k: int = 6,
        dense_score_threshold: float | None = None,
        sparse_minimum_score: float = 0.0,
    ) -> list[HybridSearchResult]:
        """
        Run dense and sparse retrieval and return fused results.
        """

        normalized_query = " ".join(
            query.split()
        ).strip()

        if not normalized_query:
            raise ValueError(
                "Search query cannot be empty."
            )

        self._validate_limit(
            name="Dense top-k",
            value=dense_top_k,
        )

        self._validate_limit(
            name="Sparse top-k",
            value=sparse_top_k,
        )

        self._validate_limit(
            name="Final top-k",
            value=final_top_k,
        )

        if (
            dense_score_threshold is not None
            and not 0.0
            <= dense_score_threshold
            <= 1.0
        ):
            raise ValueError(
                "Dense score threshold must be "
                "between zero and one."
            )

        if sparse_minimum_score < 0:
            raise ValueError(
                "Sparse minimum score cannot be negative."
            )

        # =================================================
        # Dense retrieval
        # =================================================
        query_vector = (
            self.embedding_service.embed_query(
                normalized_query
            )
        )

        dense_results = self.vector_store.search(
            knowledge_base_id=knowledge_base_id,
            query_vector=query_vector,
            limit=dense_top_k,
            score_threshold=dense_score_threshold,
        )

        # =================================================
        # Sparse retrieval
        # =================================================
        sparse_retriever = BM25SparseRetriever(
            sparse_documents
        )

        sparse_results = sparse_retriever.search(
            normalized_query,
            limit=sparse_top_k,
            minimum_score=sparse_minimum_score,
        )

        # =================================================
        # Normalize both result formats for RRF
        # =================================================
        dense_ranked_items = (
            self._normalize_dense_results(
                dense_results
            )
        )

        sparse_ranked_items = (
            self._normalize_sparse_results(
                sparse_results
            )
        )

        # =================================================
        # Reciprocal Rank Fusion
        # =================================================
        fused_results = self.fusion.fuse(
            dense_results=dense_ranked_items,
            sparse_results=sparse_ranked_items,
            limit=final_top_k,
        )

        return [
            self._build_hybrid_result(
                result
            )
            for result in fused_results
        ]

    @classmethod
    def _normalize_dense_results(
        cls,
        results: Sequence[DenseSearchResult],
    ) -> list[RankedRetrievalItem]:
        """
        Convert Qdrant dense results to the common RRF format.
        """

        normalized_results: list[
            RankedRetrievalItem
        ] = []

        for rank, result in enumerate(
            results,
            start=1,
        ):
            payload = dict(
                result.payload
            )

            document_id = (
                result.document_id
                or cls._optional_string(
                    payload.get(
                        "document_id"
                    )
                )
            )

            chunk_index = (
                result.chunk_index
                if result.chunk_index
                is not None
                else cls._optional_int(
                    payload.get(
                        "chunk_index"
                    )
                )
            )

            item_id = cls._build_item_id(
                document_id=document_id,
                chunk_index=chunk_index,
                fallback=(
                    f"point:{result.point_id}"
                ),
            )

            content = (
                result.content
                or str(
                    payload.get(
                        "content",
                        "",
                    )
                )
            )

            normalized_results.append(
                RankedRetrievalItem(
                    item_id=item_id,
                    rank=rank,
                    score=result.score,
                    payload={
                        **payload,
                        "content": content,
                        "document_id": (
                            document_id
                        ),
                        "chunk_index": (
                            chunk_index
                        ),
                        "dense_point_id": (
                            result.point_id
                        ),
                    },
                )
            )

        return normalized_results

    @classmethod
    def _normalize_sparse_results(
        cls,
        results: Sequence[
            SparseSearchResult
        ],
    ) -> list[RankedRetrievalItem]:
        """
        Convert BM25 sparse results to the common RRF format.
        """

        normalized_results: list[
            RankedRetrievalItem
        ] = []

        for result in results:
            item_id = cls._build_item_id(
                document_id=str(
                    result.document_id
                ),
                chunk_index=(
                    result.chunk_index
                ),
                fallback=(
                    f"chunk:{result.chunk_id}"
                ),
            )

            normalized_results.append(
                RankedRetrievalItem(
                    item_id=item_id,
                    rank=result.rank,
                    score=result.score,
                    payload={
                        "chunk_id": str(
                            result.chunk_id
                        ),
                        "document_id": str(
                            result.document_id
                        ),
                        "knowledge_base_id": str(
                            result.knowledge_base_id
                        ),
                        "chunk_index": (
                            result.chunk_index
                        ),
                        "content": (
                            result.content
                        ),
                        "filename": (
                            result.filename
                        ),
                        "page_number": (
                            result.page_number
                        ),
                    },
                )
            )

        return normalized_results

    @classmethod
    def _build_hybrid_result(
        cls,
        result: FusedRetrievalResult,
    ) -> HybridSearchResult:
        """
        Convert one fused result to the application result model.
        """

        payload = dict(
            result.payload
        )

        document_id_value = (
            cls._required_string(
                payload,
                "document_id",
            )
        )

        knowledge_base_id_value = (
            cls._required_string(
                payload,
                "knowledge_base_id",
            )
        )

        chunk_index_value = (
            cls._required_int(
                payload,
                "chunk_index",
            )
        )

        content = str(
            payload.get(
                "content",
                "",
            )
        ).strip()

        if not content:
            raise ValueError(
                "Fused retrieval result "
                "is missing content."
            )

        filename = str(
            payload.get(
                "filename",
                "unknown-document",
            )
        ).strip()

        if not filename:
            filename = "unknown-document"

        chunk_id_value = (
            cls._optional_string(
                payload.get(
                    "chunk_id"
                )
            )
        )

        page_number = (
            cls._optional_int(
                payload.get(
                    "page_number"
                )
            )
        )

        return HybridSearchResult(
            item_id=result.item_id,
            document_id=UUID(
                document_id_value
            ),
            knowledge_base_id=UUID(
                knowledge_base_id_value
            ),
            chunk_id=(
                UUID(chunk_id_value)
                if chunk_id_value
                is not None
                else None
            ),
            chunk_index=(
                chunk_index_value
            ),
            filename=filename,
            content=content,
            page_number=page_number,
            dense_score=(
                result.dense_score
            ),
            sparse_score=(
                result.sparse_score
            ),
            fusion_score=(
                result.fusion_score
            ),
            dense_rank=(
                result.dense_rank
            ),
            sparse_rank=(
                result.sparse_rank
            ),
            metadata=payload,
            rerank_score=None,
            rerank_rank=None,
        )

    @staticmethod
    def _build_item_id(
        *,
        document_id: str | None,
        chunk_index: int | None,
        fallback: str,
    ) -> str:
        """
        Build the shared ID used to merge dense and sparse hits.

        Document ID and chunk index are stored in PostgreSQL and
        Qdrant, so together they form a stable identity.
        """

        if (
            document_id is not None
            and chunk_index is not None
        ):
            return (
                f"document:{document_id}:"
                f"chunk:{chunk_index}"
            )

        return fallback

    @staticmethod
    def _validate_limit(
        *,
        name: str,
        value: int,
    ) -> None:
        if value <= 0:
            raise ValueError(
                f"{name} must be "
                "greater than zero."
            )

        if value > 100:
            raise ValueError(
                f"{name} cannot exceed 100."
            )

    @staticmethod
    def _required_string(
        payload: dict[str, Any],
        field_name: str,
    ) -> str:
        value = payload.get(
            field_name
        )

        if value is None:
            raise ValueError(
                "Fused retrieval result "
                f"is missing '{field_name}'."
            )

        normalized_value = str(
            value
        ).strip()

        if not normalized_value:
            raise ValueError(
                "Fused retrieval result "
                "contains an empty "
                f"'{field_name}'."
            )

        return normalized_value

    @staticmethod
    def _required_int(
        payload: dict[str, Any],
        field_name: str,
    ) -> int:
        value = payload.get(
            field_name
        )

        if value is None:
            raise ValueError(
                "Fused retrieval result "
                f"is missing '{field_name}'."
            )

        try:
            return int(
                value
            )
        except (
            TypeError,
            ValueError,
        ) as exc:
            raise ValueError(
                "Fused retrieval result "
                "contains an invalid "
                f"'{field_name}'."
            ) from exc

    @staticmethod
    def _optional_string(
        value: Any,
    ) -> str | None:
        if value is None:
            return None

        normalized_value = str(
            value
        ).strip()

        return (
            normalized_value
            or None
        )

    @staticmethod
    def _optional_int(
        value: Any,
    ) -> int | None:
        if value is None:
            return None

        try:
            return int(
                value
            )
        except (
            TypeError,
            ValueError,
        ):
            return None