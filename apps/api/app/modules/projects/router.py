from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import CurrentUser
from app.modules.organizations.constants import (
    OrganizationRole,
)
from app.modules.organizations.dependencies import (
    CurrentMembership,
    require_organization_roles,
)
from app.modules.organizations.models import (
    OrganizationMember,
)
from app.modules.projects.exceptions import (
    ProjectAccessDeniedError,
)
from app.modules.projects.schemas import (
    ProjectCreateRequest,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.modules.projects.service import ProjectService


organization_projects_router = APIRouter(
    prefix="/organizations/{organization_id}/projects",
    tags=["Projects"],
)

projects_router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@organization_projects_router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    organization_id: UUID,
    request_data: ProjectCreateRequest,
    current_user: CurrentUser,
    membership: Annotated[
        OrganizationMember,
        Depends(
            require_organization_roles(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
                OrganizationRole.AI_ENGINEER,
            )
        ),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ProjectResponse:
    service = ProjectService(database_session)

    project = service.create_project(
        organization_id,
        request_data,
        current_user,
    )

    return ProjectResponse.model_validate(project)


@organization_projects_router.get(
    "",
    response_model=ProjectListResponse,
)
def list_projects(
    organization_id: UUID,
    membership: CurrentMembership,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ProjectListResponse:
    service = ProjectService(database_session)

    projects = service.list_projects(
        organization_id
    )

    return ProjectListResponse(
        items=[
            ProjectResponse.model_validate(item)
            for item in projects
        ],
        total=len(projects),
    )


def validate_project_membership(
    *,
    project_organization_id: UUID,
    membership: OrganizationMember,
) -> None:
    if membership.organization_id != project_organization_id:
        raise ProjectAccessDeniedError()


@projects_router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ProjectResponse:
    service = ProjectService(database_session)
    project = service.get_project(project_id)

    from app.modules.organizations.repository import (
        OrganizationRepository,
    )

    repository = OrganizationRepository(
        database_session
    )

    membership = repository.get_membership(
        organization_id=project.organization_id,
        user_id=current_user.id,
    )

    if membership is None:
        raise ProjectAccessDeniedError()

    return ProjectResponse.model_validate(project)


@projects_router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: UUID,
    request_data: ProjectUpdateRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> ProjectResponse:
    service = ProjectService(database_session)
    project = service.get_project(project_id)

    from app.modules.organizations.repository import (
        OrganizationRepository,
    )

    repository = OrganizationRepository(
        database_session
    )

    membership = repository.get_membership(
        organization_id=project.organization_id,
        user_id=current_user.id,
    )

    allowed_roles = {
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
        OrganizationRole.AI_ENGINEER,
    }

    if (
        membership is None
        or membership.role not in allowed_roles
    ):
        raise ProjectAccessDeniedError()

    updated_project = service.update_project(
        project_id,
        request_data,
    )

    return ProjectResponse.model_validate(
        updated_project
    )


@projects_router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> None:
    service = ProjectService(database_session)
    project = service.get_project(project_id)

    from app.modules.organizations.repository import (
        OrganizationRepository,
    )

    repository = OrganizationRepository(
        database_session
    )

    membership = repository.get_membership(
        organization_id=project.organization_id,
        user_id=current_user.id,
    )

    allowed_roles = {
        OrganizationRole.OWNER,
        OrganizationRole.ADMIN,
    }

    if (
        membership is None
        or membership.role not in allowed_roles
    ):
        raise ProjectAccessDeniedError()

    service.delete_project(project_id)