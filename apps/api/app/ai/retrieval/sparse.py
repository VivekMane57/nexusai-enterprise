import re
from dataclasses import dataclass
from typing import Sequence
from uuid import UUID

from rank_bm25 import BM25Plus


@dataclass(frozen=True)
class SparseSearchDocument:
    """
    One searchable PostgreSQL document chunk.
    """

    chunk_id: UUID
    document_id: UUID
    knowledge_base_id: UUID
    chunk_index: int
    content: str
    filename: str
    page_number: int | None = None


@dataclass(frozen=True)
class SparseSearchResult:
    """
    One ranked sparse-retrieval result.
    """

    chunk_id: UUID
    document_id: UUID
    knowledge_base_id: UUID
    chunk_index: int
    content: str
    filename: str
    page_number: int | None
    score: float
    rank: int


class BM25SparseRetriever:
    """
    In-memory BM25 lexical retriever.

    BM25Plus is used instead of BM25Okapi because it behaves more
    reliably for small knowledge bases and avoids zero-score matches
    caused by zero inverse-document-frequency values.

    For the MVP, the BM25 index is built per retrieval request.
    Redis caching or persistent sparse indexes can be introduced later.
    """

    TOKEN_PATTERN = re.compile(
        r"[a-zA-Z0-9]+(?:[-_./][a-zA-Z0-9]+)*"
    )

    def __init__(
        self,
        documents: Sequence[SparseSearchDocument],
    ) -> None:
        self.documents = list(documents)

        self._tokenized_corpus = [
            self.tokenize(document.content)
            for document in self.documents
        ]

        self._index: BM25Plus | None = None

        if self.documents:
            self._index = BM25Plus(
                self._tokenized_corpus
            )

    @classmethod
    def tokenize(
        cls,
        text: str,
    ) -> list[str]:
        """
        Normalize and tokenize text for lexical retrieval.

        Technical tokens such as FastAPI, GPT-4 and RAG are preserved.
        """

        normalized_text = text.lower().strip()

        if not normalized_text:
            return []

        return cls.TOKEN_PATTERN.findall(
            normalized_text
        )

    def search(
        self,
        query: str,
        *,
        limit: int = 20,
        minimum_score: float = 0.0,
    ) -> list[SparseSearchResult]:
        """
        Rank corpus chunks using BM25Plus.
        """

        normalized_query = " ".join(
            query.split()
        ).strip()

        if not normalized_query:
            raise ValueError(
                "Search query cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "Search limit must be greater than zero."
            )

        if minimum_score < 0:
            raise ValueError(
                "Minimum BM25 score cannot be negative."
            )

        if (
            self._index is None
            or not self.documents
        ):
            return []

        query_tokens = self.tokenize(
            normalized_query
        )

        if not query_tokens:
            return []

        raw_scores = self._index.get_scores(
            query_tokens
        )

        ranked_indexes = sorted(
            range(len(self.documents)),
            key=lambda index: float(
                raw_scores[index]
            ),
            reverse=True,
        )

        results: list[SparseSearchResult] = []

        for document_index in ranked_indexes:
            score = float(
                raw_scores[document_index]
            )

            if score <= minimum_score:
                continue

            document = self.documents[
                document_index
            ]

            results.append(
                SparseSearchResult(
                    chunk_id=document.chunk_id,
                    document_id=document.document_id,
                    knowledge_base_id=(
                        document.knowledge_base_id
                    ),
                    chunk_index=document.chunk_index,
                    content=document.content,
                    filename=document.filename,
                    page_number=document.page_number,
                    score=score,
                    rank=len(results) + 1,
                )
            )

            if len(results) >= limit:
                break

        return results