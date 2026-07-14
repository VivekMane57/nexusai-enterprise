from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.chat.models import (
    ChatConversation,
    ChatMessage,
)


class ChatRepository:
    """
    Database access layer for chat conversations and messages.
    """

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session

    def create_conversation(
        self,
        conversation: ChatConversation,
    ) -> ChatConversation:
        self.database_session.add(
            conversation
        )
        self.database_session.flush()

        return conversation

    def get_conversation(
        self,
        conversation_id: UUID,
    ) -> ChatConversation | None:
        return self.database_session.get(
            ChatConversation,
            conversation_id,
        )

    def get_conversation_with_messages(
        self,
        conversation_id: UUID,
    ) -> ChatConversation | None:
        statement = (
            select(ChatConversation)
            .options(
                selectinload(
                    ChatConversation.messages
                )
            )
            .where(
                ChatConversation.id
                == conversation_id
            )
        )

        return self.database_session.scalar(
            statement
        )

    def list_conversations(
        self,
        *,
        knowledge_base_id: UUID,
        created_by: UUID,
    ) -> list[ChatConversation]:
        statement = (
            select(ChatConversation)
            .where(
                ChatConversation.knowledge_base_id
                == knowledge_base_id,
                ChatConversation.created_by
                == created_by,
            )
            .order_by(
                ChatConversation.updated_at.desc()
            )
        )

        return list(
            self.database_session.scalars(
                statement
            ).all()
        )

    def create_message(
        self,
        message: ChatMessage,
    ) -> ChatMessage:
        self.database_session.add(
            message
        )
        self.database_session.flush()

        return message

    def list_messages(
        self,
        conversation_id: UUID,
    ) -> list[ChatMessage]:
        statement = (
            select(ChatMessage)
            .where(
                ChatMessage.conversation_id
                == conversation_id
            )
            .order_by(
                ChatMessage.created_at.asc()
            )
        )

        return list(
            self.database_session.scalars(
                statement
            ).all()
        )

    def delete_conversation(
        self,
        conversation: ChatConversation,
    ) -> None:
        self.database_session.delete(
            conversation
        )

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(
        self,
        entity: object,
    ) -> None:
        self.database_session.refresh(
            entity
        )