from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import (
    get_db_session,
)
from app.modules.auth.dependencies import (
    CurrentUser,
)
from app.modules.chat.history_schemas import (
    ConversationCreateRequest,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationMessageRequest,
    ConversationMessageResponse,
    ConversationResponse,
)
from app.modules.chat.history_service import (
    ChatHistoryService,
)


knowledge_base_conversations_router = (
    APIRouter(
        prefix=(
            "/knowledge-bases/"
            "{knowledge_base_id}/"
            "conversations"
        ),
        tags=["Conversations"],
    )
)

conversations_router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@knowledge_base_conversations_router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Conversation",
)
def create_conversation(
    knowledge_base_id: UUID,
    request_data: ConversationCreateRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ConversationResponse:
    service = ChatHistoryService(
        database_session
    )

    conversation = (
        service.create_conversation(
            knowledge_base_id=(
                knowledge_base_id
            ),
            request_data=request_data,
            current_user=current_user,
        )
    )

    return ConversationResponse.model_validate(
        conversation
    )


@knowledge_base_conversations_router.get(
    "",
    response_model=ConversationListResponse,
    summary="List Conversations",
)
def list_conversations(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ConversationListResponse:
    service = ChatHistoryService(
        database_session
    )

    conversations = (
        service.list_conversations(
            knowledge_base_id=(
                knowledge_base_id
            ),
            current_user=current_user,
        )
    )

    return ConversationListResponse(
        items=[
            ConversationResponse
            .model_validate(
                conversation
            )
            for conversation
            in conversations
        ],
        total=len(
            conversations
        ),
    )


@conversations_router.get(
    "/{conversation_id}",
    response_model=(
        ConversationDetailResponse
    ),
    summary="Get Conversation",
)
def get_conversation(
    conversation_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ConversationDetailResponse:
    service = ChatHistoryService(
        database_session
    )

    conversation = (
        service.get_conversation(
            conversation_id=(
                conversation_id
            ),
            current_user=current_user,
        )
    )

    return (
        ConversationDetailResponse
        .model_validate(
            conversation
        )
    )


@conversations_router.post(
    "/{conversation_id}/messages",
    response_model=(
        ConversationMessageResponse
    ),
    status_code=status.HTTP_201_CREATED,
    summary="Send Conversation Message",
)
def send_message(
    conversation_id: UUID,
    request_data: (
        ConversationMessageRequest
    ),
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ConversationMessageResponse:
    service = ChatHistoryService(
        database_session
    )

    return service.send_message(
        conversation_id=(
            conversation_id
        ),
        request_data=request_data,
        current_user=current_user,
    )


@conversations_router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete Conversation",
)
def delete_conversation(
    conversation_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> Response:
    service = ChatHistoryService(
        database_session
    )

    service.delete_conversation(
        conversation_id=conversation_id,
        current_user=current_user,
    )

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )