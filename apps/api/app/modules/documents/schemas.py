from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.modules.documents.constants import DocumentStatus, DocumentType


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    knowledge_base_id: UUID
    original_filename: str
    file_type: DocumentType
    mime_type: str
    file_size: int
    checksum_sha256: str
    status: DocumentStatus
    processing_error: str | None
    page_count: int | None
    chunk_count: int
    uploaded_by: UUID
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int


class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse