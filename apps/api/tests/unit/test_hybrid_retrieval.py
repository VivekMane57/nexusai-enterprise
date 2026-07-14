from uuid import UUID, uuid4

import pytest

from app.ai.retrieval.dense import DenseSearchResult
from app.ai.retrieval.hybrid import HybridRetriever
from app.ai.retrieval.sparse import (
    SparseSearchDocument,
)


class FakeEmbeddingService:
    dimension = 3

    def embed_query(
        self,
        query: str,
    ) -> list[float]:
        assert query

        return [
            0.1,
            0.2,
            0.3,
        ]


class FakeVectorStore:
    def __init__(
        self,
        results: list[DenseSearchResult],
    ) -> None:
        self.results = results

    def search(
        self,
        *,
        knowledge_base_id: UUID,
        query_vector: list[float],
        limit: int,
        score_threshold: float | None,
    ) -> list[DenseSearchResult]:
        assert knowledge_base_id
        assert query_vector
        assert limit > 0

        return self.results[:limit]


def test_hybrid_retrieval_fuses_dense_and_sparse() -> None:
    knowledge_base_id = uuid4()
    document_id = uuid4()
    chunk_id = uuid4()

    dense_results = [
        DenseSearchResult(
            point_id=str(uuid4()),
            score=0.91,
            content=(
                "Qdrant stores vector embeddings "
                "for semantic retrieval."
            ),
            document_id=str(document_id),
            knowledge_base_id=str(
                knowledge_base_id
            ),
            chunk_index=0,
            payload={
                "document_id": str(
                    document_id
                ),
                "knowledge_base_id": str(
                    knowledge_base_id
                ),
                "chunk_index": 0,
                "filename": "platform.pdf",
                "content": (
                    "Qdrant stores vector embeddings "
                    "for semantic retrieval."
                ),
            },
        )
    ]

    sparse_documents = [
        SparseSearchDocument(
            chunk_id=chunk_id,
            document_id=document_id,
            knowledge_base_id=(
                knowledge_base_id
            ),
            chunk_index=0,
            content=(
                "Qdrant stores vector embeddings "
                "for semantic retrieval."
            ),
            filename="platform.pdf",
            page_number=1,
        ),
        SparseSearchDocument(
            chunk_id=uuid4(),
            document_id=document_id,
            knowledge_base_id=(
                knowledge_base_id
            ),
            chunk_index=1,
            content=(
                "LangGraph orchestrates agent "
                "workflows and tools."
            ),
            filename="platform.pdf",
            page_number=2,
        ),
    ]

    retriever = HybridRetriever(
        embedding_service=FakeEmbeddingService(),
        vector_store=FakeVectorStore(
            dense_results
        ),
    )

    results = retriever.search(
        knowledge_base_id=knowledge_base_id,
        query="Which system stores vector embeddings?",
        sparse_documents=sparse_documents,
        dense_top_k=5,
        sparse_top_k=5,
        final_top_k=3,
    )

    assert results
    assert results[0].document_id == document_id
    assert results[0].chunk_index == 0
    assert results[0].dense_score == 0.91
    assert results[0].sparse_score is not None
    assert results[0].dense_rank == 1
    assert results[0].sparse_rank == 1


def test_hybrid_retrieval_supports_dense_only_result() -> None:
    knowledge_base_id = uuid4()
    document_id = uuid4()

    dense_results = [
        DenseSearchResult(
            point_id=str(uuid4()),
            score=0.88,
            content="Dense-only retrieval result.",
            document_id=str(document_id),
            knowledge_base_id=str(
                knowledge_base_id
            ),
            chunk_index=4,
            payload={
                "document_id": str(
                    document_id
                ),
                "knowledge_base_id": str(
                    knowledge_base_id
                ),
                "chunk_index": 4,
                "filename": "dense.pdf",
                "content": (
                    "Dense-only retrieval result."
                ),
            },
        )
    ]

    retriever = HybridRetriever(
        embedding_service=FakeEmbeddingService(),
        vector_store=FakeVectorStore(
            dense_results
        ),
    )

    results = retriever.search(
        knowledge_base_id=knowledge_base_id,
        query="semantic meaning",
        sparse_documents=[],
        final_top_k=3,
    )

    assert len(results) == 1
    assert results[0].dense_score == 0.88
    assert results[0].sparse_score is None


def test_hybrid_retrieval_rejects_empty_query() -> None:
    retriever = HybridRetriever(
        embedding_service=FakeEmbeddingService(),
        vector_store=FakeVectorStore([]),
    )

    with pytest.raises(
        ValueError,
        match="cannot be empty",
    ):
        retriever.search(
            knowledge_base_id=uuid4(),
            query="   ",
            sparse_documents=[],
        )


def test_hybrid_retrieval_rejects_invalid_limit() -> None:
    retriever = HybridRetriever(
        embedding_service=FakeEmbeddingService(),
        vector_store=FakeVectorStore([]),
    )

    with pytest.raises(
        ValueError,
        match="greater than zero",
    ):
        retriever.search(
            knowledge_base_id=uuid4(),
            query="NexusAI",
            sparse_documents=[],
            final_top_k=0,
        )