from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.documents.constants import (
    ALLOWED_DOCUMENT_EXTENSIONS,
    ALLOWED_DOCUMENT_MIME_TYPES,
    DocumentStatus,
)
from app.modules.documents.exceptions import (
    DocumentNotFoundError,
    DocumentTooLargeError,
    EmptyDocumentError,
    UnsupportedDocumentTypeError,
)
from app.modules.documents.models import Document
from app.modules.documents.repository import DocumentRepository
from app.modules.documents.storage import LocalDocumentStorage
from app.modules.knowledge_bases.exceptions import (
    KnowledgeBaseNotFoundError,
)
from app.modules.knowledge_bases.repository import (
    KnowledgeBaseRepository,
)
from app.modules.projects.repository import ProjectRepository
from app.modules.users.models import User


class DocumentService:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session
        self.repository = DocumentRepository(database_session)
        self.knowledge_base_repository = (
            KnowledgeBaseRepository(database_session)
        )
        self.project_repository = ProjectRepository(
            database_session
        )
        self.storage = LocalDocumentStorage()

    async def upload_document(
        self,
        *,
        knowledge_base_id: UUID,
        upload_file: UploadFile,
        current_user: User,
    ) -> Document:
        knowledge_base = self.knowledge_base_repository.get(
            knowledge_base_id
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        project = self.project_repository.get_project(
            knowledge_base.project_id
        )

        if project is None:
            raise KnowledgeBaseNotFoundError()

        original_filename = upload_file.filename or "document"

        extension = Path(original_filename).suffix.lower()

        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise UnsupportedDocumentTypeError()

        mime_type = upload_file.content_type or ""

        if mime_type not in ALLOWED_DOCUMENT_MIME_TYPES:
            raise UnsupportedDocumentTypeError()

        (
            stored_filename,
            storage_path,
            file_size,
            checksum,
        ) = await self.storage.save(
            upload=upload_file,
            organization_id=str(project.organization_id),
            project_id=str(project.id),
            knowledge_base_id=str(knowledge_base.id),
            extension=extension,
        )

        if file_size == 0:
            self.storage.delete(storage_path)
            raise EmptyDocumentError()

        if file_size > settings.max_upload_size_bytes:
            self.storage.delete(storage_path)
            raise DocumentTooLargeError()

        document = Document(
            knowledge_base_id=knowledge_base.id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_type=ALLOWED_DOCUMENT_EXTENSIONS[
                extension
            ],
            mime_type=mime_type,
            file_size=file_size,
            storage_path=storage_path,
            checksum_sha256=checksum,
            status=DocumentStatus.UPLOADED,
            uploaded_by=current_user.id,
        )

        self.repository.create(document)
        self.repository.commit()
        self.repository.refresh(document)

        return document

    def get_document(
        self,
        document_id: UUID,
    ) -> Document:
        document = self.repository.get(document_id)

        if document is None:
            raise DocumentNotFoundError()

        return document

    def list_documents(
        self,
        knowledge_base_id: UUID,
    ) -> list[Document]:
        knowledge_base = self.knowledge_base_repository.get(
            knowledge_base_id
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        return self.repository.list_by_knowledge_base(
            knowledge_base_id
        )

    def delete_document(
        self,
        document_id: UUID,
    ) -> None:
        document = self.get_document(document_id)

        self.storage.delete(document.storage_path)

        self.repository.delete(document)
        self.repository.commit()