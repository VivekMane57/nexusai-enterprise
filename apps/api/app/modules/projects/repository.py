from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.projects.models import Project


class ProjectRepository:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session

    def create_project(
        self,
        project: Project,
    ) -> Project:
        self.database_session.add(project)
        self.database_session.flush()

        return project

    def get_project(
        self,
        project_id: UUID,
    ) -> Project | None:
        return self.database_session.get(
            Project,
            project_id,
        )

    def get_project_by_slug(
        self,
        *,
        organization_id: UUID,
        slug: str,
    ) -> Project | None:
        statement = select(Project).where(
            Project.organization_id == organization_id,
            Project.slug == slug,
        )

        return self.database_session.scalar(statement)

    def list_projects(
        self,
        organization_id: UUID,
    ) -> list[Project]:
        statement = (
            select(Project)
            .where(
                Project.organization_id == organization_id
            )
            .order_by(Project.created_at.desc())
        )

        return list(
            self.database_session.scalars(statement).all()
        )

    def delete_project(
        self,
        project: Project,
    ) -> None:
        self.database_session.delete(project)

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(self, entity: object) -> None:
        self.database_session.refresh(entity)