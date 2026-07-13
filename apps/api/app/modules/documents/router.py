from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import CurrentUser
from app.modules.documents.schemas import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.modules.documents.service import DocumentService


knowledge_base_documents_router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}/documents",
    tags=["Documents"],
)

documents_router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@knowledge_base_documents_router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
    file: UploadFile = File(...),
) -> DocumentUploadResponse:
    service = DocumentService(database_session)

    document = await service.upload_document(
        knowledge_base_id=knowledge_base_id,
        upload_file=file,
        current_user=current_user,
    )

    return DocumentUploadResponse(
        message="Document uploaded successfully.",
        document=DocumentResponse.model_validate(document),
    )


@knowledge_base_documents_router.get(
    "",
    response_model=DocumentListResponse,
)
def list_documents(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> DocumentListResponse:
    service = DocumentService(database_session)

    documents = service.list_documents(
        knowledge_base_id
    )

    return DocumentListResponse(
        items=[
            DocumentResponse.model_validate(item)
            for item in documents
        ],
        total=len(documents),
    )


@documents_router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> DocumentResponse:
    service = DocumentService(database_session)

    document = service.get_document(document_id)

    return DocumentResponse.model_validate(document)


@documents_router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> None:
    service = DocumentService(database_session)

    service.delete_document(document_id)