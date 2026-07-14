from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.embeddings.bge import (
    get_embedding_service,
)
from app.ai.retrieval.dense import (
    QdrantVectorStore,
)
from app.ai.retrieval.hybrid import (
    HybridRetriever,
    HybridSearchResult,
)
from app.ai.retrieval.reranker import (
    get_reranker,
)
from app.ai.retrieval.sparse import (
    SparseSearchDocument,
)
from app.modules.documents.repository import (
    DocumentRepository,
)
from app.modules.knowledge_bases.exceptions import (
    KnowledgeBaseNotFoundError,
)
from app.modules.knowledge_bases.repository import (
    KnowledgeBaseRepository,
)
from app.modules.retrieval.schemas import (
    HybridSearchRequest,
)


class RetrievalService:
    """
    Coordinate dense retrieval, sparse retrieval, fusion and reranking.
    """

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session

        self.document_repository = (
            DocumentRepository(
                database_session
            )
        )

        self.knowledge_base_repository = (
            KnowledgeBaseRepository(
                database_session
            )
        )

        self.hybrid_retriever = (
            HybridRetriever(
                embedding_service=(
                    get_embedding_service()
                ),
                vector_store=(
                    QdrantVectorStore()
                ),
            )
        )

    def search(
        self,
        *,
        knowledge_base_id: UUID,
        request_data: HybridSearchRequest,
    ) -> list[HybridSearchResult]:
        """
        Execute hybrid retrieval and optional cross-encoder reranking.
        """

        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        chunks = (
            self.document_repository
            .list_chunks_by_knowledge_base(
                knowledge_base_id
            )
        )

        if not chunks:
            return []

        sparse_documents = [
            SparseSearchDocument(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                knowledge_base_id=(
                    chunk.knowledge_base_id
                ),
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                filename=str(
                    chunk.chunk_metadata.get(
                        "filename",
                        "unknown-document",
                    )
                ),
                page_number=chunk.page_number,
            )
            for chunk in chunks
        ]

        candidate_limit = (
            request_data.rerank_top_k
            if request_data.enable_reranking
            else request_data.final_top_k
        )

        hybrid_results = (
            self.hybrid_retriever.search(
                knowledge_base_id=(
                    knowledge_base_id
                ),
                query=request_data.query,
                sparse_documents=(
                    sparse_documents
                ),
                dense_top_k=(
                    request_data.dense_top_k
                ),
                sparse_top_k=(
                    request_data.sparse_top_k
                ),
                final_top_k=(
                    candidate_limit
                ),
                dense_score_threshold=(
                    request_data
                    .dense_score_threshold
                ),
                sparse_minimum_score=(
                    request_data
                    .sparse_minimum_score
                ),
            )
        )

        if (
            not request_data.enable_reranking
            or not hybrid_results
        ):
            return hybrid_results[
                :request_data.final_top_k
            ]

        reranker = get_reranker()

        return reranker.rerank(
            query=request_data.query,
            candidates=hybrid_results,
            limit=request_data.final_top_k,
            batch_size=(
                request_data
                .reranker_batch_size
            ),
        )