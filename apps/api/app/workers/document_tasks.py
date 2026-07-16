import logging
from uuid import UUID, uuid4

from celery import Task

from app.ai.embeddings.bge import get_embedding_service
from app.ai.rag.chunking import RecursiveTextChunker
from app.ai.retrieval.dense import QdrantVectorStore
from app.db.session import SessionLocal
from app.modules.documents.constants import DocumentStatus
from app.modules.documents.extractor import (
    DocumentExtractionError,
    DocumentTextExtractor,
)
from app.modules.documents.models import DocumentChunk
from app.modules.documents.repository import DocumentRepository
from app.modules.knowledge_bases.repository import (
    KnowledgeBaseRepository,
)
from app.modules.projects.repository import ProjectRepository
from app.workers.celery_app import celery_app


logger = logging.getLogger(__name__)


def mark_document_failed(
    *,
    document_id: UUID,
    error_message: str,
) -> None:
    """
    Persist failed document status using an isolated database session.

    A separate session is used because the processing transaction may
    already have been rolled back or left in an invalid state.
    """

    database_session = SessionLocal()

    try:
        repository = DocumentRepository(
            database_session
        )

        document = repository.get_document(
            document_id
        )

        if document is None:
            logger.warning(
                "Cannot mark missing document as failed",
                extra={
                    "document_id": str(document_id),
                },
            )
            return

        document.status = DocumentStatus.FAILED
        document.processing_error = (
            error_message.strip()
            or "Unknown document-processing error."
        )[:2000]

        repository.commit()
        repository.refresh(document)

    except Exception:
        database_session.rollback()

        logger.exception(
            "Failed to persist document failure status",
            extra={
                "document_id": str(document_id),
            },
        )

    finally:
        database_session.close()


def cleanup_qdrant_points(
    *,
    vector_store: QdrantVectorStore | None,
    knowledge_base_id: UUID | None,
    point_ids: list[UUID],
    document_id: str,
) -> None:
    """
    Remove newly-created Qdrant points after a processing failure.
    """

    if (
        vector_store is None
        or knowledge_base_id is None
        or not point_ids
    ):
        return

    try:
        vector_store.delete_points(
            knowledge_base_id=knowledge_base_id,
            point_ids=point_ids,
        )

    except Exception:
        logger.exception(
            "Failed to clean Qdrant points",
            extra={
                "document_id": document_id,
                "knowledge_base_id": str(
                    knowledge_base_id
                ),
                "point_count": len(point_ids),
            },
        )


@celery_app.task(
    bind=True,
    name="documents.process_document",
    max_retries=3,
    acks_late=True,
)
def process_document_task(
    self: Task,
    document_id: str,
) -> dict[str, object]:
    """
    Process one uploaded document asynchronously.

    Pipeline:
    1. Load document, knowledge base and project
    2. Mark document as processing
    3. Extract text from PDF, DOCX or TXT
    4. Split text into overlapping chunks
    5. Generate normalized BGE embeddings
    6. Create or reuse the Qdrant collection
    7. Remove previous vectors when retrying
    8. Store new vectors and payloads in Qdrant
    9. Store chunk records in PostgreSQL
    10. Mark document as indexed
    """

    try:
        document_uuid = UUID(
            document_id
        )
    except ValueError as exc:
        raise ValueError(
            f"Invalid document ID: {document_id}"
        ) from exc

    database_session = SessionLocal()

    document_repository = DocumentRepository(
        database_session
    )

    knowledge_base_repository = (
        KnowledgeBaseRepository(
            database_session
        )
    )

    project_repository = ProjectRepository(
        database_session
    )

    vector_store: QdrantVectorStore | None = None
    knowledge_base_id: UUID | None = None
    new_point_ids: list[UUID] = []

    try:
        # =================================================
        # Load database entities
        # =================================================
        document = (
            document_repository.get_document(
                document_uuid
            )
        )

        if document is None:
            raise ValueError(
                f"Document was not found: {document_uuid}"
            )

        knowledge_base = (
            knowledge_base_repository.get(
                document.knowledge_base_id
            )
        )

        if knowledge_base is None:
            raise ValueError(
                "The document knowledge base was not found."
            )

        knowledge_base_id = knowledge_base.id

        project = project_repository.get_project(
            knowledge_base.project_id
        )

        if project is None:
            raise ValueError(
                "The document project was not found."
            )

        # =================================================
        # Mark processing
        # =================================================
        document.status = DocumentStatus.PROCESSING
        document.processing_error = None

        document_repository.commit()
        document_repository.refresh(document)

        logger.info(
            "Document processing started",
            extra={
                "document_id": str(document.id),
                "knowledge_base_id": str(
                    knowledge_base.id
                ),
                "project_id": str(project.id),
                "document_filename": (
                    document.original_filename
                ),
            },
        )

        # =================================================
        # Extract text
        # =================================================
        extractor = DocumentTextExtractor()

        extracted_document = extractor.extract(
            file_path=document.storage_path,
            file_type=document.file_type,
        )

        extracted_text = (
            extracted_document.text.strip()
        )

        if not extracted_text:
            raise DocumentExtractionError(
                "No readable text was extracted from "
                "the uploaded document."
            )

        # =================================================
        # Recursive chunking
        # =================================================
        chunker = RecursiveTextChunker()

        text_chunks = chunker.chunk(
            extracted_text,
            chunk_size=knowledge_base.chunk_size,
            chunk_overlap=(
                knowledge_base.chunk_overlap
            ),
        )

        if not text_chunks:
            raise ValueError(
                "The extracted document did not produce "
                "any valid chunks."
            )

        # =================================================
        # Generate dense embeddings
        # =================================================
        embedding_service = (
            get_embedding_service()
        )

        vectors = (
            embedding_service.embed_documents(
                [
                    chunk.content
                    for chunk in text_chunks
                ]
            )
        )

        if len(vectors) != len(text_chunks):
            raise RuntimeError(
                "Embedding count does not match "
                "generated chunk count."
            )

        # =================================================
        # Prepare Qdrant collection
        # =================================================
        vector_store = QdrantVectorStore()

        vector_store.ensure_collection(
            knowledge_base_id=knowledge_base.id,
            vector_size=(
                embedding_service.dimension
            ),
        )

        # =================================================
        # Remove old chunks on retry/re-index
        # =================================================
        existing_chunks = (
            document_repository
            .list_chunks_by_document(
                document.id
            )
        )

        if existing_chunks:
            existing_point_ids = [
                chunk.qdrant_point_id
                for chunk in existing_chunks
            ]

            vector_store.delete_points(
                knowledge_base_id=knowledge_base.id,
                point_ids=existing_point_ids,
            )

            document_repository.delete_chunks_by_document(
                document.id
            )

            database_session.flush()

        # =================================================
        # Build chunk records and vector payloads
        # =================================================
        database_chunks: list[
            DocumentChunk
        ] = []

        payloads: list[
            dict[str, object]
        ] = []

        for text_chunk in text_chunks:
            point_id = uuid4()

            new_point_ids.append(
                point_id
            )

            chunk_metadata: dict[
                str,
                object,
            ] = {
                "organization_id": str(
                    project.organization_id
                ),
                "project_id": str(
                    project.id
                ),
                "knowledge_base_id": str(
                    knowledge_base.id
                ),
                "document_id": str(
                    document.id
                ),
                "filename": (
                    document.original_filename
                ),
                "file_type": (
                    document.file_type.value
                ),
                "chunk_index": (
                    text_chunk.index
                ),
                "start_offset": (
                    text_chunk.start_offset
                ),
                "end_offset": (
                    text_chunk.end_offset
                ),
            }

            database_chunk = DocumentChunk(
                document_id=document.id,
                knowledge_base_id=(
                    knowledge_base.id
                ),
                chunk_index=(
                    text_chunk.index
                ),
                content=text_chunk.content,
                character_count=(
                    text_chunk.character_count
                ),
                token_count=None,
                page_number=None,
                start_offset=(
                    text_chunk.start_offset
                ),
                end_offset=(
                    text_chunk.end_offset
                ),
                qdrant_point_id=point_id,
                chunk_metadata=(
                    chunk_metadata
                ),
            )

            database_chunks.append(
                database_chunk
            )

            payloads.append(
                {
                    **chunk_metadata,
                    "content": (
                        text_chunk.content
                    ),
                    "character_count": (
                        text_chunk.character_count
                    ),
                }
            )

        # =================================================
        # Insert vectors into Qdrant
        # =================================================
        inserted_count = (
            vector_store.upsert_chunks(
                knowledge_base_id=(
                    knowledge_base.id
                ),
                point_ids=new_point_ids,
                vectors=vectors,
                payloads=payloads,
            )
        )

        if inserted_count != len(
            database_chunks
        ):
            raise RuntimeError(
                "Qdrant inserted-point count does not "
                "match generated chunk count."
            )

        # =================================================
        # Insert chunks into PostgreSQL
        # =================================================
        document_repository.create_chunks(
            database_chunks
        )

        document.status = DocumentStatus.INDEXED
        document.processing_error = None
        document.page_count = (
            extracted_document.page_count
        )
        document.chunk_count = len(
            database_chunks
        )

        document_repository.commit()
        document_repository.refresh(document)

        logger.info(
            "Document processing completed",
            extra={
                "document_id": str(
                    document.id
                ),
                "knowledge_base_id": str(
                    knowledge_base.id
                ),
                "page_count": (
                    document.page_count
                ),
                "chunk_count": (
                    document.chunk_count
                ),
            },
        )

        return {
            "document_id": str(
                document.id
            ),
            "knowledge_base_id": str(
                knowledge_base.id
            ),
            "status": (
                DocumentStatus.INDEXED.value
            ),
            "page_count": (
                document.page_count
            ),
            "chunk_count": (
                document.chunk_count
            ),
        }

    except (
        DocumentExtractionError,
        FileNotFoundError,
        ValueError,
    ) as exc:
        database_session.rollback()

        logger.exception(
            "Document processing failed permanently",
            extra={
                "document_id": document_id,
            },
        )

        cleanup_qdrant_points(
            vector_store=vector_store,
            knowledge_base_id=(
                knowledge_base_id
            ),
            point_ids=new_point_ids,
            document_id=document_id,
        )

        mark_document_failed(
            document_id=document_uuid,
            error_message=str(exc),
        )

        raise

    except Exception as exc:
        database_session.rollback()

        logger.exception(
            "Document processing encountered a "
            "recoverable failure",
            extra={
                "document_id": document_id,
                "retry_number": (
                    self.request.retries
                ),
            },
        )

        cleanup_qdrant_points(
            vector_store=vector_store,
            knowledge_base_id=(
                knowledge_base_id
            ),
            point_ids=new_point_ids,
            document_id=document_id,
        )

        if (
            self.request.retries
            < self.max_retries
        ):
            retry_delay = min(
                60,
                5 * (
                    2
                    ** self.request.retries
                ),
            )

            raise self.retry(
                exc=exc,
                countdown=retry_delay,
            )

        mark_document_failed(
            document_id=document_uuid,
            error_message=str(exc),
        )

        raise

    finally:
        database_session.close()