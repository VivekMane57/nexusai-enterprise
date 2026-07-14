from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.chat.history_schemas import (
    ConversationCreateRequest,
    ConversationMessageRequest,
    ConversationMessageResponse,
)
from app.modules.chat.models import (
    ChatConversation,
    ChatMessage,
    ChatMessageRole,
)
from app.modules.chat.repository import (
    ChatRepository,
)
from app.modules.chat.schemas import (
    ChatRequest,
)
from app.modules.chat.service import (
    ChatService,
)
from app.modules.knowledge_bases.exceptions import (
    KnowledgeBaseNotFoundError,
)
from app.modules.knowledge_bases.repository import (
    KnowledgeBaseRepository,
)
from app.modules.users.models import User


class ConversationNotFoundError(
    LookupError
):
    pass


class ConversationAccessDeniedError(
    PermissionError
):
    pass


class ChatHistoryService:
    """
    Manage persistent chat conversations and RAG messages.
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

        self.knowledge_base_repository = (
            KnowledgeBaseRepository(
                database_session
            )
        )

        self.chat_service = ChatService(
            database_session
        )

    def create_conversation(
        self,
        *,
        knowledge_base_id: UUID,
        request_data: ConversationCreateRequest,
        current_user: User,
    ) -> ChatConversation:
        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        title = " ".join(
            request_data.title.split()
        ).strip()

        conversation = ChatConversation(
            knowledge_base_id=(
                knowledge_base_id
            ),
            created_by=current_user.id,
            title=title,
            message_count=0,
        )

        self.repository.create_conversation(
            conversation
        )
        self.repository.commit()
        self.repository.refresh(
            conversation
        )

        return conversation

    def list_conversations(
        self,
        *,
        knowledge_base_id: UUID,
        current_user: User,
    ) -> list[ChatConversation]:
        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        return self.repository.list_conversations(
            knowledge_base_id=(
                knowledge_base_id
            ),
            created_by=current_user.id,
        )

    def get_conversation(
        self,
        *,
        conversation_id: UUID,
        current_user: User,
    ) -> ChatConversation:
        conversation = (
            self.repository
            .get_conversation_with_messages(
                conversation_id
            )
        )

        if conversation is None:
            raise ConversationNotFoundError(
                "Conversation was not found."
            )

        if (
            conversation.created_by
            != current_user.id
        ):
            raise ConversationAccessDeniedError(
                "You do not have access to "
                "this conversation."
            )

        return conversation

    def delete_conversation(
        self,
        *,
        conversation_id: UUID,
        current_user: User,
    ) -> None:
        conversation = self.get_conversation(
            conversation_id=(
                conversation_id
            ),
            current_user=current_user,
        )

        self.repository.delete_conversation(
            conversation
        )
        self.repository.commit()

    def send_message(
        self,
        *,
        conversation_id: UUID,
        request_data: ConversationMessageRequest,
        current_user: User,
    ) -> ConversationMessageResponse:
        conversation = self.get_conversation(
            conversation_id=(
                conversation_id
            ),
            current_user=current_user,
        )

        user_message = ChatMessage(
            conversation_id=(
                conversation.id
            ),
            role=ChatMessageRole.USER,
            content=request_data.question,
            citations=[],
            retrieval_method=None,
            model_name=None,
            prompt_tokens=None,
            completion_tokens=None,
            total_tokens=None,
            retrieval_latency_ms=None,
            generation_latency_ms=None,
            total_latency_ms=None,
            message_metadata={},
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

        try:
            chat_response = (
                self.chat_service
                .answer_question(
                    knowledge_base_id=(
                        conversation
                        .knowledge_base_id
                    ),
                    request_data=ChatRequest(
                        question=(
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
                        retrieval_top_k=(
                            request_data
                            .retrieval_top_k
                        ),
                        final_context_top_k=(
                            request_data
                            .final_context_top_k
                        ),
                        enable_reranking=(
                            request_data
                            .enable_reranking
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
                        temperature=(
                            request_data
                            .temperature
                        ),
                        max_tokens=(
                            request_data
                            .max_tokens
                        ),
                    ),
                )
            )

            assistant_message = ChatMessage(
                conversation_id=(
                    conversation.id
                ),
                role=(
                    ChatMessageRole.ASSISTANT
                ),
                content=chat_response.answer,
                citations=[
                    citation.model_dump(
                        mode="json"
                    )
                    for citation
                    in chat_response.citations
                ],
                retrieval_method=(
                    chat_response
                    .retrieval_method
                ),
                model_name=(
                    chat_response.model
                ),
                prompt_tokens=(
                    chat_response.token_usage
                    .prompt_tokens
                ),
                completion_tokens=(
                    chat_response.token_usage
                    .completion_tokens
                ),
                total_tokens=(
                    chat_response.token_usage
                    .total_tokens
                ),
                retrieval_latency_ms=round(
                    chat_response
                    .retrieval_latency_ms
                ),
                generation_latency_ms=round(
                    chat_response
                    .generation_latency_ms
                ),
                total_latency_ms=round(
                    chat_response
                    .total_latency_ms
                ),
                message_metadata={
                    "finish_reason": (
                        chat_response
                        .finish_reason
                    ),
                    "total_citations": (
                        chat_response
                        .total_citations
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

        except Exception:
            self.repository.rollback()
            raise

        return ConversationMessageResponse(
            conversation=conversation,
            user_message=user_message,
            assistant_message=(
                assistant_message
            ),
        )

    @staticmethod
    def _generate_title(
        question: str,
    ) -> str:
        normalized_question = " ".join(
            question.split()
        ).strip()

        maximum_length = 70

        if (
            len(normalized_question)
            <= maximum_length
        ):
            return normalized_question

        return (
            normalized_question[
                :maximum_length
            ].rstrip()
            + "..."
        )