from time import perf_counter
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.llm.azure_openai import (
    ChatMessage,
    get_azure_openai_chat_service,
)
from app.modules.chat.context_builder import (
    RAGContextBuilder,
)
from app.modules.chat.prompt_builder import (
    RAGPromptBuilder,
)
from app.modules.chat.schemas import (
    ChatRequest,
    ChatResponse,
    CitationResponse,
    TokenUsageResponse,
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
from app.modules.retrieval.service import (
    RetrievalService,
)


class ChatService:
    """
    Coordinate retrieval, context construction and LLM generation.
    """

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

        self.knowledge_base_repository = (
            KnowledgeBaseRepository(
                database_session
            )
        )

        self.retrieval_service = RetrievalService(
            database_session
        )

        self.context_builder = (
            RAGContextBuilder()
        )

        self.prompt_builder = (
            RAGPromptBuilder()
        )

    def answer_question(
        self,
        *,
        knowledge_base_id: UUID,
        request_data: ChatRequest,
    ) -> ChatResponse:
        """
        Answer one question with grounded citations.
        """

        total_start = perf_counter()

        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        # =================================================
        # Retrieval
        # =================================================
        retrieval_start = perf_counter()

        retrieval_request = (
            HybridSearchRequest(
                query=request_data.question,
                dense_top_k=(
                    request_data.dense_top_k
                ),
                sparse_top_k=(
                    request_data.sparse_top_k
                ),
                final_top_k=(
                    request_data.final_context_top_k
                ),
                enable_reranking=(
                    request_data.enable_reranking
                ),
                rerank_top_k=(
                    request_data.retrieval_top_k
                ),
                reranker_batch_size=(
                    request_data.reranker_batch_size
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

        retrieval_results = (
            self.retrieval_service.search(
                knowledge_base_id=(
                    knowledge_base_id
                ),
                request_data=(
                    retrieval_request
                ),
            )
        )

        retrieval_latency_ms = round(
            (
                perf_counter()
                - retrieval_start
            )
            * 1000,
            2,
        )

        # =================================================
        # Context and prompt
        # =================================================
        built_context = (
            self.context_builder.build(
                retrieval_results
            )
        )

        user_prompt = (
            self.prompt_builder.build_user_prompt(
                question=request_data.question,
                built_context=built_context,
            )
        )

        # =================================================
        # Azure OpenAI generation
        # =================================================
        generation_start = perf_counter()

        llm_service = (
            get_azure_openai_chat_service()
        )

        generation_result = (
            llm_service.generate(
                messages=[
                    ChatMessage(
                        role="system",
                        content=(
                            self.prompt_builder
                            .SYSTEM_PROMPT
                        ),
                    ),
                    ChatMessage(
                        role="user",
                        content=user_prompt,
                    ),
                ],
                temperature=(
                    request_data.temperature
                ),
                max_tokens=(
                    request_data.max_tokens
                ),
            )
        )

        generation_latency_ms = round(
            (
                perf_counter()
                - generation_start
            )
            * 1000,
            2,
        )

        # =================================================
        # Citations
        # =================================================
        citations = [
            CitationResponse(
                citation_number=(
                    source.citation_number
                ),
                document_id=(
                    source.result.document_id
                ),
                chunk_id=(
                    source.result.chunk_id
                ),
                filename=(
                    source.result.filename
                ),
                chunk_index=(
                    source.result.chunk_index
                ),
                page_number=(
                    source.result.page_number
                ),
                content_preview=(
                    self.context_builder
                    .build_preview(
                        source.result.content
                    )
                ),
                dense_score=(
                    source.result.dense_score
                ),
                sparse_score=(
                    source.result.sparse_score
                ),
                fusion_score=(
                    source.result.fusion_score
                ),
                rerank_score=(
                    source.result.rerank_score
                ),
            )
            for source in built_context.sources
        ]

        retrieval_method = (
            "hybrid_rrf_cross_encoder"
            if request_data.enable_reranking
            else "hybrid_rrf"
        )

        total_latency_ms = round(
            (
                perf_counter()
                - total_start
            )
            * 1000,
            2,
        )

        return ChatResponse(
            question=request_data.question,
            answer=generation_result.content,
            knowledge_base_id=(
                knowledge_base_id
            ),
            retrieval_method=(
                retrieval_method
            ),
            model=(
                generation_result.model
            ),
            finish_reason=(
                generation_result.finish_reason
            ),
            citations=citations,
            total_citations=len(
                citations
            ),
            token_usage=TokenUsageResponse(
                prompt_tokens=(
                    generation_result
                    .prompt_tokens
                ),
                completion_tokens=(
                    generation_result
                    .completion_tokens
                ),
                total_tokens=(
                    generation_result
                    .total_tokens
                ),
            ),
            retrieval_latency_ms=(
                retrieval_latency_ms
            ),
            generation_latency_ms=(
                generation_latency_ms
            ),
            total_latency_ms=(
                total_latency_ms
            ),
        )