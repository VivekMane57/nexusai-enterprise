from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import (
    CurrentUser,
)
from app.modules.retrieval.schemas import (
    HybridSearchRequest,
    HybridSearchResponse,
    HybridSearchResultResponse,
)
from app.modules.retrieval.service import (
    RetrievalService,
)


router = APIRouter(
    prefix=(
        "/knowledge-bases/"
        "{knowledge_base_id}/search"
    ),
    tags=["Retrieval"],
)


@router.post(
    "",
    response_model=HybridSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Hybrid Search with Re-ranking",
)
def hybrid_search(
    knowledge_base_id: UUID,
    request_data: HybridSearchRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> HybridSearchResponse:
    """
    Search a knowledge base using dense retrieval, BM25,
    reciprocal-rank fusion and optional cross-encoder reranking.
    """

    service = RetrievalService(
        database_session
    )

    results = service.search(
        knowledge_base_id=knowledge_base_id,
        request_data=request_data,
    )

    retrieval_method = (
        "hybrid_rrf_cross_encoder"
        if request_data.enable_reranking
        else "hybrid_rrf"
    )

    return HybridSearchResponse(
        query=request_data.query,
        retrieval_method=retrieval_method,
        reranking_enabled=(
            request_data.enable_reranking
        ),
        total_results=len(results),
        results=[
            HybridSearchResultResponse(
                item_id=result.item_id,
                document_id=(
                    result.document_id
                ),
                knowledge_base_id=(
                    result.knowledge_base_id
                ),
                chunk_id=result.chunk_id,
                chunk_index=(
                    result.chunk_index
                ),
                filename=result.filename,
                content=result.content,
                page_number=(
                    result.page_number
                ),
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
                rerank_score=(
                    result.rerank_score
                ),
                rerank_rank=(
                    result.rerank_rank
                ),
            )
            for result in results
        ],
    )