from collections.abc import Generator
from time import perf_counter
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.llm.azure_openai import (
    ChatMessage as LLMChatMessage,
    get_azure_openai_chat_service,
)
from app.modules.chat.context_builder import (
    RAGContextBuilder,
)
from app.modules.chat.history_schemas import (
    ConversationMessageRequest,
)
from app.modules.chat.history_service import (
    ChatHistoryService,
)
from app.modules.chat.models import (
    ChatMessage,
    ChatMessageRole,
)
from app.modules.chat.prompt_builder import (
    RAGPromptBuilder,
)
from app.modules.chat.repository import (
    ChatRepository,
)
from app.modules.chat.sse import SSEEvent
from app.modules.retrieval.schemas import (
    HybridSearchRequest,
)
from app.modules.retrieval.service import (
    RetrievalService,
)
from app.modules.users.models import User


class StreamingChatService:
    """
    Run grounded RAG and stream Azure OpenAI tokens through SSE.
    """

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = (
            database_session
        )

        self.repository = ChatRepository(
            database_session
        )

        self.history_service = (
            ChatHistoryService(
                database_session
            )
        )

        self.retrieval_service = (
            RetrievalService(
                database_session
            )
        )

        self.context_builder = (
            RAGContextBuilder()
        )

        self.prompt_builder = (
            RAGPromptBuilder()
        )

    def stream_answer(
        self,
        *,
        conversation_id: UUID,
        request_data: ConversationMessageRequest,
        current_user: User,
    ) -> Generator[str, None, None]:
        """
        Save the user message, retrieve evidence, stream the answer,
        then save the completed assistant message.
        """

        total_start = perf_counter()

        try:
            conversation = (
                self.history_service
                .get_conversation(
                    conversation_id=(
                        conversation_id
                    ),
                    current_user=current_user,
                )
            )

            user_message = ChatMessage(
                conversation_id=(
                    conversation.id
                ),
                role=ChatMessageRole.USER,
                content=(
                    request_data.question
                ),
                citations=[],
                retrieval_method=None,
                model_name=None,
                prompt_tokens=None,
                completion_tokens=None,
                total_tokens=None,
                retrieval_latency_ms=None,
                generation_latency_ms=None,
                total_latency_ms=None,
                message_metadata={
                    "streamed": True,
                },
            )

            self.repository.create_message(
                user_message
            )

            conversation.message_count += 1

            if conversation.message_count == 1:
                conversation.title = (
                    self._generate_title(
                        request_data.question
                    )
                )

            self.repository.commit()
            self.repository.refresh(
                user_message
            )
            self.repository.refresh(
                conversation
            )

            yield SSEEvent(
                event="start",
                data={
                    "conversation_id": (
                        str(conversation.id)
                    ),
                    "user_message_id": (
                        str(user_message.id)
                    ),
                },
            ).encode()

            # =============================================
            # Retrieval
            # =============================================
            retrieval_start = perf_counter()

            retrieval_request = (
                HybridSearchRequest(
                    query=(
                        request_data.question
                    ),
                    dense_top_k=(
                        request_data
                        .dense_top_k
                    ),
                    sparse_top_k=(
                        request_data
                        .sparse_top_k
                    ),
                    final_top_k=(
                        request_data
                        .final_context_top_k
                    ),
                    enable_reranking=(
                        request_data
                        .enable_reranking
                    ),
                    rerank_top_k=(
                        request_data
                        .retrieval_top_k
                    ),
                    reranker_batch_size=(
                        request_data
                        .reranker_batch_size
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

            results = (
                self.retrieval_service.search(
                    knowledge_base_id=(
                        conversation
                        .knowledge_base_id
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
            )

            built_context = (
                self.context_builder.build(
                    results
                )
            )

            user_prompt = (
                self.prompt_builder
                .build_user_prompt(
                    question=(
                        request_data.question
                    ),
                    built_context=(
                        built_context
                    ),
                )
            )

            citations = [
                {
                    "citation_number": (
                        source.citation_number
                    ),
                    "document_id": str(
                        source.result.document_id
                    ),
                    "chunk_id": (
                        str(
                            source.result.chunk_id
                        )
                        if source.result.chunk_id
                        is not None
                        else None
                    ),
                    "filename": (
                        source.result.filename
                    ),
                    "chunk_index": (
                        source.result.chunk_index
                    ),
                    "page_number": (
                        source.result.page_number
                    ),
                    "content_preview": (
                        self.context_builder
                        .build_preview(
                            source.result.content
                        )
                    ),
                    "dense_score": (
                        source.result.dense_score
                    ),
                    "sparse_score": (
                        source.result.sparse_score
                    ),
                    "fusion_score": (
                        source.result.fusion_score
                    ),
                    "rerank_score": (
                        source.result.rerank_score
                    ),
                }
                for source
                in built_context.sources
            ]

            yield SSEEvent(
                event="sources",
                data={
                    "citations": citations,
                    "total": len(citations),
                },
            ).encode()

            # =============================================
            # Azure OpenAI streaming
            # =============================================
            generation_start = perf_counter()

            llm_service = (
                get_azure_openai_chat_service()
            )

            answer_parts: list[str] = []

            model_name: str | None = None
            finish_reason: str | None = None

            prompt_tokens: int | None = None
            completion_tokens: int | None = None
            total_tokens: int | None = None

            stream = (
                llm_service.stream_generate(
                    messages=[
                        LLMChatMessage(
                            role="system",
                            content=(
                                self.prompt_builder
                                .SYSTEM_PROMPT
                            ),
                        ),
                        LLMChatMessage(
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

            for chunk in stream:
                if chunk.model is not None:
                    model_name = chunk.model

                if (
                    chunk.finish_reason
                    is not None
                ):
                    finish_reason = (
                        chunk.finish_reason
                    )

                if (
                    chunk.prompt_tokens
                    is not None
                ):
                    prompt_tokens = (
                        chunk.prompt_tokens
                    )

                if (
                    chunk.completion_tokens
                    is not None
                ):
                    completion_tokens = (
                        chunk.completion_tokens
                    )

                if (
                    chunk.total_tokens
                    is not None
                ):
                    total_tokens = (
                        chunk.total_tokens
                    )

                if chunk.content:
                    answer_parts.append(
                        chunk.content
                    )

                    yield SSEEvent(
                        event="token",
                        data={
                            "content": (
                                chunk.content
                            ),
                        },
                    ).encode()

            complete_answer = "".join(
                answer_parts
            ).strip()

            if not complete_answer:
                raise RuntimeError(
                    "Azure OpenAI returned an empty streamed answer."
                )

            generation_latency_ms = round(
                (
                    perf_counter()
                    - generation_start
                )
                * 1000,
            )

            total_latency_ms = round(
                (
                    perf_counter()
                    - total_start
                )
                * 1000,
            )

            retrieval_method = (
                "hybrid_rrf_cross_encoder"
                if request_data.enable_reranking
                else "hybrid_rrf"
            )

            assistant_message = ChatMessage(
                conversation_id=(
                    conversation.id
                ),
                role=(
                    ChatMessageRole.ASSISTANT
                ),
                content=complete_answer,
                citations=citations,
                retrieval_method=(
                    retrieval_method
                ),
                model_name=model_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=(
                    completion_tokens
                ),
                total_tokens=total_tokens,
                retrieval_latency_ms=(
                    retrieval_latency_ms
                ),
                generation_latency_ms=(
                    generation_latency_ms
                ),
                total_latency_ms=(
                    total_latency_ms
                ),
                message_metadata={
                    "finish_reason": (
                        finish_reason
                    ),
                    "streamed": True,
                    "total_citations": (
                        len(citations)
                    ),
                },
            )

            self.repository.create_message(
                assistant_message
            )

            conversation.message_count += 1

            self.repository.commit()
            self.repository.refresh(
                assistant_message
            )
            self.repository.refresh(
                conversation
            )

            yield SSEEvent(
                event="done",
                data={
                    "conversation_id": (
                        str(conversation.id)
                    ),
                    "assistant_message_id": (
                        str(
                            assistant_message.id
                        )
                    ),
                    "answer": complete_answer,
                    "model": model_name,
                    "finish_reason": (
                        finish_reason
                    ),
                    "token_usage": {
                        "prompt_tokens": (
                            prompt_tokens
                        ),
                        "completion_tokens": (
                            completion_tokens
                        ),
                        "total_tokens": (
                            total_tokens
                        ),
                    },
                    "latency": {
                        "retrieval_ms": (
                            retrieval_latency_ms
                        ),
                        "generation_ms": (
                            generation_latency_ms
                        ),
                        "total_ms": (
                            total_latency_ms
                        ),
                    },
                },
            ).encode()

        except Exception as exc:
            self.repository.rollback()

            yield SSEEvent(
                event="error",
                data={
                    "error": (
                        type(exc).__name__
                    ),
                    "message": str(exc),
                },
            ).encode()

    @staticmethod
    def _generate_title(
        question: str,
    ) -> str:
        normalized = " ".join(
            question.split()
        ).strip()

        if len(normalized) <= 70:
            return normalized

        return (
            normalized[:70].rstrip()
            + "..."
        )