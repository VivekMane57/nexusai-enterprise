from dataclasses import dataclass
from typing import Any, Sequence
from uuid import UUID

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointIdsList,
    PointStruct,
    VectorParams,
)

from app.core.config import settings


@dataclass(frozen=True)
class DenseSearchResult:
    """
    Application-level representation of one Qdrant result.
    """

    point_id: str
    score: float
    content: str
    document_id: str | None
    knowledge_base_id: str | None
    chunk_index: int | None
    payload: dict[str, Any]


class QdrantVectorStore:
    """
    Qdrant wrapper for NexusAI dense retrieval.

    One Qdrant collection is created per knowledge base.
    """

    COLLECTION_PREFIX = "kb"

    def __init__(
        self,
        client: QdrantClient | None = None,
    ) -> None:
        self.client = client or self._create_client()

    @staticmethod
    def _create_client() -> QdrantClient:
        api_key: str | None = None

        if settings.qdrant_api_key is not None:
            configured_key = (
                settings.qdrant_api_key.get_secret_value().strip()
            )
            api_key = configured_key or None

        return QdrantClient(
            url=settings.qdrant_url,
            api_key=api_key,
            timeout=settings.qdrant_timeout_seconds,
        )

    @classmethod
    def collection_name(
        cls,
        knowledge_base_id: UUID,
    ) -> str:
        """
        Build a deterministic Qdrant collection name.
        """

        normalized_id = str(
            knowledge_base_id
        ).replace("-", "_")

        return (
            f"{cls.COLLECTION_PREFIX}_"
            f"{normalized_id}"
        )

    def health_check(self) -> bool:
        """
        Verify that the Qdrant server is reachable.
        """

        try:
            self.client.get_collections()
            return True
        except Exception:
            return False

    def ensure_collection(
        self,
        *,
        knowledge_base_id: UUID,
        vector_size: int,
    ) -> str:
        """
        Create the knowledge-base collection when it does not exist.
        """

        if vector_size <= 0:
            raise ValueError(
                "Vector size must be greater than zero."
            )

        name = self.collection_name(
            knowledge_base_id
        )

        if not self.client.collection_exists(name):
            self.client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )

        return name

    def upsert_chunks(
        self,
        *,
        knowledge_base_id: UUID,
        point_ids: Sequence[UUID],
        vectors: Sequence[Sequence[float]],
        payloads: Sequence[dict[str, Any]],
    ) -> int:
        """
        Insert or replace chunk vectors and payloads.

        All input collections must have the same length.
        """

        point_count = len(point_ids)

        if not (
            point_count
            == len(vectors)
            == len(payloads)
        ):
            raise ValueError(
                "Point IDs, vectors and payloads must "
                "have equal lengths."
            )

        if point_count == 0:
            return 0

        points = [
            PointStruct(
                id=str(point_id),
                vector=list(vector),
                payload=dict(payload),
            )
            for point_id, vector, payload in zip(
                point_ids,
                vectors,
                payloads,
                strict=True,
            )
        ]

        self.client.upsert(
            collection_name=self.collection_name(
                knowledge_base_id
            ),
            points=points,
            wait=True,
        )

        return point_count

    def search(
        self,
        *,
        knowledge_base_id: UUID,
        query_vector: Sequence[float],
        limit: int = 10,
        document_id: UUID | None = None,
        score_threshold: float | None = None,
    ) -> list[DenseSearchResult]:
        """
        Search one knowledge base using cosine similarity.

        An optional document filter can restrict retrieval to one file.
        """

        if not query_vector:
            raise ValueError(
                "Query vector cannot be empty."
            )

        if limit <= 0:
            raise ValueError(
                "Search limit must be greater than zero."
            )

        query_filter: Filter | None = None

        if document_id is not None:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(
                            value=str(document_id)
                        ),
                    )
                ]
            )

        response = self.client.query_points(
            collection_name=self.collection_name(
                knowledge_base_id
            ),
            query=list(query_vector),
            query_filter=query_filter,
            limit=limit,
            score_threshold=score_threshold,
            with_payload=True,
            with_vectors=False,
        )

        results: list[DenseSearchResult] = []

        for scored_point in response.points:
            payload = dict(
                scored_point.payload or {}
            )

            chunk_index_value = payload.get(
                "chunk_index"
            )

            results.append(
                DenseSearchResult(
                    point_id=str(scored_point.id),
                    score=float(scored_point.score),
                    content=str(
                        payload.get("content", "")
                    ),
                    document_id=self._optional_string(
                        payload.get("document_id")
                    ),
                    knowledge_base_id=(
                        self._optional_string(
                            payload.get(
                                "knowledge_base_id"
                            )
                        )
                    ),
                    chunk_index=(
                        int(chunk_index_value)
                        if chunk_index_value is not None
                        else None
                    ),
                    payload=payload,
                )
            )

        return results

    def delete_points(
        self,
        *,
        knowledge_base_id: UUID,
        point_ids: Sequence[UUID],
    ) -> None:
        """
        Delete specific chunk points from a collection.
        """

        if not point_ids:
            return

        collection_name = self.collection_name(
            knowledge_base_id
        )

        if not self.client.collection_exists(
            collection_name
        ):
            return

        self.client.delete(
            collection_name=collection_name,
            points_selector=PointIdsList(
                points=[
                    str(point_id)
                    for point_id in point_ids
                ]
            ),
            wait=True,
        )

    def delete_collection(
        self,
        *,
        knowledge_base_id: UUID,
    ) -> None:
        """
        Delete the entire vector collection for a knowledge base.
        """

        collection_name = self.collection_name(
            knowledge_base_id
        )

        if self.client.collection_exists(
            collection_name
        ):
            self.client.delete_collection(
                collection_name=collection_name
            )

    @staticmethod
    def _optional_string(
        value: Any,
    ) -> str | None:
        if value is None:
            return None

        return str(value)