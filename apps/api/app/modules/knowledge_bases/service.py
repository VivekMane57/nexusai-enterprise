from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.knowledge_bases.exceptions import (
    KnowledgeBaseConflictError,
    KnowledgeBaseNotFoundError,
)
from app.modules.knowledge_bases.models import KnowledgeBase
from app.modules.knowledge_bases.repository import KnowledgeBaseRepository
from app.modules.knowledge_bases.schemas import (
    KnowledgeBaseCreateRequest,
    KnowledgeBaseUpdateRequest,
)
from app.modules.projects.exceptions import ProjectNotFoundError
from app.modules.projects.repository import ProjectRepository
from app.modules.users.models import User
from app.shared.utils.slug import generate_slug


class KnowledgeBaseService:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session
        self.repository = KnowledgeBaseRepository(database_session)
        self.project_repository = ProjectRepository(database_session)

    def create_knowledge_base(
        self,
        *,
        project_id: UUID,
        request_data: KnowledgeBaseCreateRequest,
        current_user: User,
    ) -> KnowledgeBase:
        project = self.project_repository.get_project(project_id)

        if project is None:
            raise ProjectNotFoundError()

        base_slug = generate_slug(request_data.name)
        slug = base_slug
        suffix = 2

        while self.repository.get_by_slug(
            project_id=project_id,
            slug=slug,
        ) is not None:
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        knowledge_base = KnowledgeBase(
            project_id=project_id,
            name=request_data.name,
            slug=slug,
            description=request_data.description,
            embedding_model=settings.embedding_model,
            chunking_strategy=request_data.chunking_strategy,
            chunk_size=request_data.chunk_size,
            chunk_overlap=request_data.chunk_overlap,
            created_by=current_user.id,
        )

        self.repository.create(knowledge_base)

        try:
            self.repository.commit()
        except IntegrityError as exc:
            self.repository.rollback()
            raise KnowledgeBaseConflictError() from exc

        self.repository.refresh(knowledge_base)

        return knowledge_base

    def get_knowledge_base(
        self,
        knowledge_base_id: UUID,
    ) -> KnowledgeBase:
        knowledge_base = self.repository.get(knowledge_base_id)

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundError()

        return knowledge_base

    def list_knowledge_bases(
        self,
        project_id: UUID,
    ) -> list[KnowledgeBase]:
        project = self.project_repository.get_project(project_id)

        if project is None:
            raise ProjectNotFoundError()

        return self.repository.list_by_project(project_id)

    def update_knowledge_base(
        self,
        *,
        knowledge_base_id: UUID,
        request_data: KnowledgeBaseUpdateRequest,
    ) -> KnowledgeBase:
        knowledge_base = self.get_knowledge_base(
            knowledge_base_id
        )

        update_data = request_data.model_dump(
            exclude_unset=True
        )

        if "name" in update_data:
            knowledge_base.name = update_data["name"]

        if "description" in update_data:
            knowledge_base.description = update_data[
                "description"
            ]

        if "status" in update_data:
            knowledge_base.status = update_data["status"]

        self.repository.commit()
        self.repository.refresh(knowledge_base)

        return knowledge_base

    def delete_knowledge_base(
        self,
        knowledge_base_id: UUID,
    ) -> None:
        knowledge_base = self.get_knowledge_base(
            knowledge_base_id
        )

        self.repository.delete(knowledge_base)
        self.repository.commit()