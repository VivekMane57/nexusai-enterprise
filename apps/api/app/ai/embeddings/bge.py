from functools import lru_cache
from typing import Sequence

from sentence_transformers import SentenceTransformer

from app.core.config import settings


class BGEEmbeddingService:
    """
    Generate normalized dense embeddings for documents and queries.

    The underlying SentenceTransformer model is loaded once per
    Python process through `get_embedding_service()`.
    """

    QUERY_PREFIX = (
        "Represent this sentence for searching relevant passages: "
    )

    def __init__(
        self,
        model_name: str | None = None,
    ) -> None:
        self.model_name = (
            model_name
            or settings.embedding_model
        )

        self.model = SentenceTransformer(
            self.model_name,
        )

        embedding_dimension = (
            self.model.get_embedding_dimension()
        )

        if embedding_dimension is None:
            raise RuntimeError(
                "Could not determine embedding dimension "
                f"for model '{self.model_name}'."
            )

        self._dimension = int(
            embedding_dimension
        )

    @property
    def dimension(self) -> int:
        """
        Return the output vector dimension of the model.
        """

        return self._dimension

    def embed_documents(
        self,
        texts: Sequence[str],
        *,
        batch_size: int = 16,
    ) -> list[list[float]]:
        """
        Generate normalized embeddings for document chunks.

        Document passages are embedded without the query instruction
        prefix because BGE expects the instruction primarily on queries.
        """

        if batch_size <= 0:
            raise ValueError(
                "Batch size must be greater than zero."
            )

        cleaned_texts = [
            self._normalize_text(text)
            for text in texts
        ]

        if not cleaned_texts:
            return []

        if any(
            not text
            for text in cleaned_texts
        ):
            raise ValueError(
                "Document texts cannot contain empty values."
            )

        embeddings = self.model.encode(
            cleaned_texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embeddings.tolist()

    def embed_query(
        self,
        query: str,
    ) -> list[float]:
        """
        Generate one normalized query embedding.

        BGE retrieval models benefit from an instruction prefix on
        user queries. This improves passage retrieval quality.
        """

        normalized_query = self._normalize_text(
            query
        )

        if not normalized_query:
            raise ValueError(
                "Query cannot be empty."
            )

        instructed_query = (
            f"{self.QUERY_PREFIX}"
            f"{normalized_query}"
        )

        embedding = self.model.encode(
            instructed_query,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embedding.tolist()

    def embed_queries(
        self,
        queries: Sequence[str],
        *,
        batch_size: int = 16,
    ) -> list[list[float]]:
        """
        Generate normalized embeddings for multiple search queries.
        """

        if batch_size <= 0:
            raise ValueError(
                "Batch size must be greater than zero."
            )

        normalized_queries = [
            self._normalize_text(query)
            for query in queries
        ]

        if not normalized_queries:
            return []

        if any(
            not query
            for query in normalized_queries
        ):
            raise ValueError(
                "Queries cannot contain empty values."
            )

        instructed_queries = [
            (
                f"{self.QUERY_PREFIX}"
                f"{query}"
            )
            for query in normalized_queries
        ]

        embeddings = self.model.encode(
            instructed_queries,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embeddings.tolist()

    @staticmethod
    def _normalize_text(
        text: str,
    ) -> str:
        """
        Normalize whitespace without changing semantic content.
        """

        return " ".join(
            text.split()
        ).strip()


@lru_cache(maxsize=1)
def get_embedding_service() -> BGEEmbeddingService:
    """
    Return one cached embedding service per application process.
    """

    return BGEEmbeddingService()