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
from app.modules.chat.schemas import (
    ChatRequest,
    ChatResponse,
)
from app.modules.chat.service import (
    ChatService,
)


router = APIRouter(
    prefix=(
        "/knowledge-bases/"
        "{knowledge_base_id}/chat"
    ),
    tags=["Chat"],
)


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Knowledge Base",
    description=(
        "Answer a question using hybrid retrieval, "
        "cross-encoder reranking, Azure OpenAI and "
        "source citations."
    ),
)
def ask_knowledge_base(
    knowledge_base_id: UUID,
    request_data: ChatRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ChatResponse:
    """
    Generate a grounded answer from indexed knowledge-base documents.
    """

    service = ChatService(
        database_session
    )

    return service.answer_question(
        knowledge_base_id=knowledge_base_id,
        request_data=request_data,
    )