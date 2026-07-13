from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.projects.exceptions import (
    ProjectNotFoundError,
    ProjectSlugConflictError,
)
from app.modules.projects.models import Project
from app.modules.projects.repository import (
    ProjectRepository,
)
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
)
from app.modules.users.models import User
from app.shared.utils.slug import generate_slug


class ProjectService:
    def __init__(self, database_session: Session) -> None:
        self.repository = ProjectRepository(
            database_session
        )

    def create_project(
        self,
        organization_id: UUID,
        request_data: ProjectCreateRequest,
        current_user: User,
    ) -> Project:
        base_slug = generate_slug(request_data.name)
        slug = base_slug
        suffix = 2

        while self.repository.get_project_by_slug(
            organization_id=organization_id,
            slug=slug,
        ) is not None:
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        project = Project(
            organization_id=organization_id,
            name=request_data.name,
            slug=slug,
            description=request_data.description,
            environment=request_data.environment,
            created_by=current_user.id,
        )

        self.repository.create_project(project)

        try:
            self.repository.commit()
        except IntegrityError as exc:
            self.repository.rollback()
            raise ProjectSlugConflictError() from exc

        self.repository.refresh(project)

        return project

    def list_projects(
        self,
        organization_id: UUID,
    ) -> list[Project]:
        return self.repository.list_projects(
            organization_id
        )

    def get_project(
        self,
        project_id: UUID,
    ) -> Project:
        project = self.repository.get_project(
            project_id
        )

        if project is None:
            raise ProjectNotFoundError()

        return project

    def update_project(
        self,
        project_id: UUID,
        request_data: ProjectUpdateRequest,
    ) -> Project:
        project = self.get_project(project_id)

        update_data = request_data.model_dump(
            exclude_unset=True
        )

        if "name" in update_data:
            project.name = update_data["name"]

        if "description" in update_data:
            project.description = update_data[
                "description"
            ]

        if "environment" in update_data:
            project.environment = update_data[
                "environment"
            ]

        if "status" in update_data:
            project.status = update_data["status"]

        self.repository.commit()
        self.repository.refresh(project)

        return project

    def delete_project(
        self,
        project_id: UUID,
    ) -> None:
        project = self.get_project(project_id)

        self.repository.delete_project(project)
        self.repository.commit()