from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Response,
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
    summary="Upload Document",
    description=(
        "Upload a PDF, DOCX, or TXT document to a knowledge base. "
        "The document is stored and queued for background indexing."
    ),
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
    """
    Store a document and enqueue its ingestion task.
    """

    service = DocumentService(
        database_session
    )

    document = await service.upload_document(
        knowledge_base_id=knowledge_base_id,
        upload_file=file,
        current_user=current_user,
    )

    return DocumentUploadResponse(
        message=(
            "Document uploaded and processing queued "
            "successfully."
        ),
        document=DocumentResponse.model_validate(
            document
        ),
    )


@knowledge_base_documents_router.get(
    "",
    response_model=DocumentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Documents",
    description=(
        "List all documents belonging to the selected "
        "knowledge base."
    ),
)
def list_documents(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> DocumentListResponse:
    """
    List documents for one knowledge base.
    """

    service = DocumentService(
        database_session
    )

    documents = service.list_documents(
        knowledge_base_id
    )

    return DocumentListResponse(
        items=[
            DocumentResponse.model_validate(
                document
            )
            for document in documents
        ],
        total=len(documents),
    )


@documents_router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Document",
    description=(
        "Return document metadata, processing status, "
        "page count, chunk count, and processing error."
    ),
)
def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> DocumentResponse:
    """
    Get one document and its current processing status.
    """

    service = DocumentService(
        database_session
    )

    document = service.get_document(
        document_id
    )

    return DocumentResponse.model_validate(
        document
    )


@documents_router.post(
    "/{document_id}/retry",
    response_model=DocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Retry Document Processing",
    description=(
        "Reset a document to queued status and submit "
        "its ingestion task to Celery again."
    ),
)
def retry_document_processing(
    document_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> DocumentResponse:
    """
    Queue an existing document for ingestion again.
    """

    service = DocumentService(
        database_session
    )

    document = (
        service.retry_document_processing(
            document_id
        )
    )

    return DocumentResponse.model_validate(
        document
    )


@documents_router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Document",
    description=(
        "Delete the stored file, PostgreSQL chunk records, "
        "Qdrant vectors, and document metadata."
    ),
    response_class=Response,
)
def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> Response:
    """
    Delete a document and its associated data.
    """

    service = DocumentService(
        database_session
    )

    service.delete_document(
        document_id
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )