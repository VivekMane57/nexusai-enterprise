from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.ai.retrieval.dense import QdrantVectorStore
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
from app.workers.celery_app import celery_app


class DocumentService:
    """
    Business logic for document upload, processing, retrieval and deletion.

    Upload flow:
    1. Validate knowledge base and project
    2. Validate extension and MIME type
    3. Save file to local storage
    4. Validate file size
    5. Save metadata to PostgreSQL
    6. Queue asynchronous ingestion through Celery
    """

    PROCESS_DOCUMENT_TASK_NAME = "documents.process_document"

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session

        self.repository = DocumentRepository(
            database_session
        )

        self.knowledge_base_repository = (
            KnowledgeBaseRepository(
                database_session
            )
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
        """
        Persist an uploaded document and enqueue background ingestion.
        """

        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        project = self.project_repository.get_project(
            knowledge_base.project_id
        )

        if project is None:
            raise KnowledgeBaseNotFoundError()

        original_filename = (
            upload_file.filename
            or "document"
        ).strip()

        extension = Path(
            original_filename
        ).suffix.lower()

        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise UnsupportedDocumentTypeError()

        mime_type = (
            upload_file.content_type
            or ""
        ).lower().strip()

        if mime_type not in ALLOWED_DOCUMENT_MIME_TYPES:
            raise UnsupportedDocumentTypeError()

        storage_path: str | None = None

        try:
            (
                stored_filename,
                storage_path,
                file_size,
                checksum,
            ) = await self.storage.save(
                upload=upload_file,
                organization_id=str(
                    project.organization_id
                ),
                project_id=str(project.id),
                knowledge_base_id=str(
                    knowledge_base.id
                ),
                extension=extension,
            )

            if file_size <= 0:
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
                status=DocumentStatus.QUEUED,
                processing_error=None,
                page_count=None,
                chunk_count=0,
                uploaded_by=current_user.id,
            )

            self.repository.create_document(document)
            self.repository.commit()
            self.repository.refresh(document)

        except (
            EmptyDocumentError,
            DocumentTooLargeError,
            UnsupportedDocumentTypeError,
        ):
            self.repository.rollback()
            raise

        except SQLAlchemyError:
            self.repository.rollback()

            if storage_path is not None:
                self.storage.delete(storage_path)

            raise

        except Exception:
            self.repository.rollback()

            if storage_path is not None:
                self.storage.delete(storage_path)

            raise

        finally:
            await upload_file.close()

        self._enqueue_document_processing(
            document
        )

        return document

    def get_document(
        self,
        document_id: UUID,
    ) -> Document:
        """
        Return one document.
        """

        document = self.repository.get_document(
            document_id
        )

        if document is None:
            raise DocumentNotFoundError()

        return document

    def get_document_with_chunks(
        self,
        document_id: UUID,
    ) -> Document:
        """
        Return a document with loaded chunks.
        """

        document = (
            self.repository.get_document_with_chunks(
                document_id
            )
        )

        if document is None:
            raise DocumentNotFoundError()

        return document

    def list_documents(
        self,
        knowledge_base_id: UUID,
    ) -> list[Document]:
        """
        List documents belonging to one knowledge base.
        """

        knowledge_base = (
            self.knowledge_base_repository.get(
                knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        return (
            self.repository
            .list_documents_by_knowledge_base(
                knowledge_base_id
            )
        )

    def retry_document_processing(
        self,
        document_id: UUID,
    ) -> Document:
        """
        Queue an existing document for processing again.
        """

        document = self.get_document(
            document_id
        )

        document.status = DocumentStatus.QUEUED
        document.processing_error = None

        self.repository.commit()
        self.repository.refresh(document)

        self._enqueue_document_processing(
            document
        )

        return document

    def delete_document(
        self,
        document_id: UUID,
    ) -> None:
        """
        Delete Qdrant vectors, PostgreSQL chunks, metadata and local file.
        """

        document = (
            self.repository.get_document_with_chunks(
                document_id
            )
        )

        if document is None:
            raise DocumentNotFoundError()

        storage_path = document.storage_path

        point_ids = [
            chunk.qdrant_point_id
            for chunk in document.chunks
        ]

        if point_ids:
            vector_store = QdrantVectorStore()

            vector_store.delete_points(
                knowledge_base_id=document.knowledge_base_id,
                point_ids=point_ids,
            )

        try:
            self.repository.delete_chunks_by_document(
                document.id
            )

            self.repository.delete_document(
                document
            )

            self.repository.commit()

        except Exception:
            self.repository.rollback()
            raise

        self.storage.delete(storage_path)

    def _enqueue_document_processing(
        self,
        document: Document,
    ) -> None:
        """
        Send one document-processing task to Celery.
        """

        try:
            celery_app.send_task(
                self.PROCESS_DOCUMENT_TASK_NAME,
                args=[str(document.id)],
                queue="celery",
            )

        except Exception as exc:
            document.status = DocumentStatus.FAILED
            document.processing_error = (
                "Document was saved, but its processing "
                f"task could not be queued: {exc}"
            )[:2000]

            self.repository.commit()
            self.repository.refresh(document)