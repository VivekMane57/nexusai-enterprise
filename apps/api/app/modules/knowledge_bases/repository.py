from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.knowledge_bases.models import KnowledgeBase


class KnowledgeBaseRepository:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session

    def create(
        self,
        knowledge_base: KnowledgeBase,
    ) -> KnowledgeBase:
        self.database_session.add(knowledge_base)
        self.database_session.flush()
        return knowledge_base

    def get(
        self,
        knowledge_base_id: UUID,
    ) -> KnowledgeBase | None:
        return self.database_session.get(
            KnowledgeBase,
            knowledge_base_id,
        )

    def get_by_slug(
        self,
        *,
        project_id: UUID,
        slug: str,
    ) -> KnowledgeBase | None:
        statement = select(KnowledgeBase).where(
            KnowledgeBase.project_id == project_id,
            KnowledgeBase.slug == slug,
        )

        return self.database_session.scalar(statement)

    def list_by_project(
        self,
        project_id: UUID,
    ) -> list[KnowledgeBase]:
        statement = (
            select(KnowledgeBase)
            .where(KnowledgeBase.project_id == project_id)
            .order_by(KnowledgeBase.created_at.desc())
        )

        return list(
            self.database_session.scalars(statement).all()
        )

    def delete(self, knowledge_base: KnowledgeBase) -> None:
        self.database_session.delete(knowledge_base)

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(self, entity: object) -> None:
        self.database_session.refresh(entity)