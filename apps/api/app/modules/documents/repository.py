from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.documents.models import Document


class DocumentRepository:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session

    def create(self, document: Document) -> Document:
        self.database_session.add(document)
        self.database_session.flush()
        return document

    def get(self, document_id: UUID) -> Document | None:
        return self.database_session.get(
            Document,
            document_id,
        )

    def list_by_knowledge_base(
        self,
        knowledge_base_id: UUID,
    ) -> list[Document]:
        statement = (
            select(Document)
            .where(
                Document.knowledge_base_id
                == knowledge_base_id
            )
            .order_by(Document.created_at.desc())
        )

        return list(
            self.database_session.scalars(statement).all()
        )

    def delete(self, document: Document) -> None:
        self.database_session.delete(document)

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(self, entity: object) -> None:
        self.database_session.refresh(entity)