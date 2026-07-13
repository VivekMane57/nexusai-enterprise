from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Path
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import CurrentUser
from app.modules.organizations.constants import (
    MembershipStatus,
    OrganizationRole,
)
from app.modules.organizations.repository import (
    OrganizationRepository,
)
from app.modules.projects.exceptions import (
    ProjectAccessDeniedError,
    ProjectNotFoundError,
)
from app.modules.projects.models import Project
from app.modules.projects.repository import ProjectRepository


def get_accessible_project(
    project_id: Annotated[UUID, Path()],
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> Project:
    project_repository = ProjectRepository(database_session)
    organization_repository = OrganizationRepository(
        database_session
    )

    project = project_repository.get_project(project_id)

    if project is None:
        raise ProjectNotFoundError()

    membership = organization_repository.get_membership(
        organization_id=project.organization_id,
        user_id=current_user.id,
    )

    if (
        membership is None
        or membership.status != MembershipStatus.ACTIVE
    ):
        raise ProjectAccessDeniedError()

    return project


AccessibleProject = Annotated[
    Project,
    Depends(get_accessible_project),
]


def require_project_roles(
    *allowed_roles: OrganizationRole,
) -> Callable[..., Project]:
    def dependency(
        project_id: Annotated[UUID, Path()],
        current_user: CurrentUser,
        database_session: Annotated[
            Session,
            Depends(get_db_session),
        ],
    ) -> Project:
        project_repository = ProjectRepository(
            database_session
        )
        organization_repository = OrganizationRepository(
            database_session
        )

        project = project_repository.get_project(project_id)

        if project is None:
            raise ProjectNotFoundError()

        membership = organization_repository.get_membership(
            organization_id=project.organization_id,
            user_id=current_user.id,
        )

        if (
            membership is None
            or membership.status
            != MembershipStatus.ACTIVE
            or membership.role not in allowed_roles
        ):
            raise ProjectAccessDeniedError()

        return project

    return dependency