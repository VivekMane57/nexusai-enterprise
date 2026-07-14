from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
)
from fastapi.responses import (
    StreamingResponse,
)
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import (
    CurrentUser,
)
from app.modules.chat.history_schemas import (
    ConversationMessageRequest,
)
from app.modules.chat.stream_service import (
    StreamingChatService,
)


router = APIRouter(
    prefix="/conversations",
    tags=["Streaming Chat"],
)


@router.post(
    "/{conversation_id}/messages/stream",
    status_code=status.HTTP_200_OK,
    summary="Stream Conversation Message",
    description=(
        "Generate a grounded RAG response and stream "
        "Azure OpenAI tokens using Server-Sent Events."
    ),
)
def stream_chat_message(
    conversation_id: UUID,
    request_data: ConversationMessageRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> StreamingResponse:
    service = StreamingChatService(
        database_session
    )

    event_stream = service.stream_answer(
        conversation_id=conversation_id,
        request_data=request_data,
        current_user=current_user,
    )

    return StreamingResponse(
        event_stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": (
                "no-cache, no-transform"
            ),
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )