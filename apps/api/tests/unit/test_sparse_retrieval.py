from uuid import uuid4

import pytest

from app.ai.retrieval.sparse import (
    BM25SparseRetriever,
    SparseSearchDocument,
)


def build_document(
    *,
    content: str,
    chunk_index: int,
) -> SparseSearchDocument:
    return SparseSearchDocument(
        chunk_id=uuid4(),
        document_id=uuid4(),
        knowledge_base_id=uuid4(),
        chunk_index=chunk_index,
        content=content,
        filename="test-document.pdf",
        page_number=chunk_index + 1,
    )


def test_sparse_retrieval_returns_relevant_result() -> None:
    documents = [
        build_document(
            content=(
                "The platform uses Qdrant for semantic "
                "vector retrieval."
            ),
            chunk_index=0,
        ),
        build_document(
            content=(
                "LangGraph orchestrates agent workflows "
                "and tool execution."
            ),
            chunk_index=1,
        ),
        build_document(
            content=(
                "PostgreSQL stores users, documents, "
                "metadata and document chunks."
            ),
            chunk_index=2,
        ),
    ]

    retriever = BM25SparseRetriever(
        documents
    )

    results = retriever.search(
        "Which database stores semantic vectors?",
        limit=3,
    )

    assert results
    assert results[0].chunk_index == 0
    assert "Qdrant" in results[0].content
    assert results[0].score > 0


def test_sparse_retrieval_returns_empty_for_no_match() -> None:
    documents = [
        build_document(
            content="FastAPI powers the backend API.",
            chunk_index=0,
        )
    ]

    retriever = BM25SparseRetriever(
        documents
    )

    results = retriever.search(
        "agriculture crop disease satellite",
        limit=5,
    )

    assert results == []


def test_sparse_retrieval_empty_corpus() -> None:
    retriever = BM25SparseRetriever([])

    results = retriever.search(
        "What is NexusAI?",
        limit=5,
    )

    assert results == []


def test_sparse_retrieval_rejects_empty_query() -> None:
    retriever = BM25SparseRetriever([])

    with pytest.raises(
        ValueError,
        match="cannot be empty",
    ):
        retriever.search(
            "   ",
            limit=5,
        )


def test_sparse_retrieval_rejects_invalid_limit() -> None:
    retriever = BM25SparseRetriever([])

    with pytest.raises(
        ValueError,
        match="greater than zero",
    ):
        retriever.search(
            "NexusAI",
            limit=0,
        )


def test_tokenizer_preserves_technical_terms() -> None:
    tokens = BM25SparseRetriever.tokenize(
        "FastAPI, GPT-4, Qdrant and RAG."
    )

    assert "fastapi" in tokens
    assert "gpt-4" in tokens
    assert "qdrant" in tokens
    assert "rag" in tokens