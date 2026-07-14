from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.modules.documents.models import (
    Document,
    DocumentChunk,
)


class DocumentRepository:
    """
    Database access layer for documents and document chunks.

    This repository does not contain business logic. It only performs
    database operations using the provided SQLAlchemy session.
    """

    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session

    # =====================================================
    # Document operations
    # =====================================================
    def create_document(
        self,
        document: Document,
    ) -> Document:
        self.database_session.add(document)
        self.database_session.flush()

        return document

    def get_document(
        self,
        document_id: UUID,
    ) -> Document | None:
        return self.database_session.get(
            Document,
            document_id,
        )

    def get_document_with_chunks(
        self,
        document_id: UUID,
    ) -> Document | None:
        statement = (
            select(Document)
            .options(
                selectinload(Document.chunks)
            )
            .where(
                Document.id == document_id
            )
        )

        return self.database_session.scalar(
            statement
        )

    def list_documents_by_knowledge_base(
        self,
        knowledge_base_id: UUID,
    ) -> list[Document]:
        statement = (
            select(Document)
            .where(
                Document.knowledge_base_id
                == knowledge_base_id
            )
            .order_by(
                Document.created_at.desc()
            )
        )

        return list(
            self.database_session.scalars(
                statement
            ).all()
        )

    def delete_document(
        self,
        document: Document,
    ) -> None:
        self.database_session.delete(document)

    # =====================================================
    # Chunk operations
    # =====================================================
    def create_chunks(
        self,
        chunks: list[DocumentChunk],
    ) -> list[DocumentChunk]:
        if not chunks:
            return []

        self.database_session.add_all(chunks)
        self.database_session.flush()

        return chunks

    def list_chunks_by_document(
        self,
        document_id: UUID,
    ) -> list[DocumentChunk]:
        statement = (
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id
                == document_id
            )
            .order_by(
                DocumentChunk.chunk_index.asc()
            )
        )

        return list(
            self.database_session.scalars(
                statement
            ).all()
        )

    def list_chunks_by_knowledge_base(
        self,
        knowledge_base_id: UUID,
        *,
        limit: int | None = None,
    ) -> list[DocumentChunk]:
        statement = (
            select(DocumentChunk)
            .where(
                DocumentChunk.knowledge_base_id
                == knowledge_base_id
            )
            .order_by(
                DocumentChunk.created_at.asc()
            )
        )

        if limit is not None:
            statement = statement.limit(limit)

        return list(
            self.database_session.scalars(
                statement
            ).all()
        )

    def delete_chunks_by_document(
        self,
        document_id: UUID,
    ) -> None:
        statement = delete(
            DocumentChunk
        ).where(
            DocumentChunk.document_id
            == document_id
        )

        self.database_session.execute(
            statement
        )

    def count_chunks_by_document(
        self,
        document_id: UUID,
    ) -> int:
        statement = select(
            DocumentChunk.id
        ).where(
            DocumentChunk.document_id
            == document_id
        )

        return len(
            self.database_session.scalars(
                statement
            ).all()
        )

    # =====================================================
    # Transaction helpers
    # =====================================================
    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(
        self,
        entity: object,
    ) -> None:
        self.database_session.refresh(entity)