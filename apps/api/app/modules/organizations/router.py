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
from app.modules.organizations.schemas import (
    OrganizationCreateRequest,
    OrganizationListResponse,
    OrganizationMemberCreateRequest,
    OrganizationMemberResponse,
    OrganizationMemberUpdateRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
)
from app.modules.organizations.service import (
    OrganizationService,
)


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organization(
    request_data: OrganizationCreateRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationResponse:
    service = OrganizationService(database_session)

    organization = service.create_organization(
        request_data,
        current_user,
    )

    return OrganizationResponse.model_validate(
        organization
    )


@router.get(
    "",
    response_model=OrganizationListResponse,
)
def list_organizations(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationListResponse:
    service = OrganizationService(database_session)

    organizations = service.list_organizations(
        current_user
    )

    return OrganizationListResponse(
        items=[
            OrganizationResponse.model_validate(item)
            for item in organizations
        ],
        total=len(organizations),
    )


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def get_organization(
    organization_id: UUID,
    membership: CurrentMembership,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationResponse:
    service = OrganizationService(database_session)

    organization = service.get_organization(
        organization_id
    )

    return OrganizationResponse.model_validate(
        organization
    )


@router.patch(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
def update_organization(
    organization_id: UUID,
    request_data: OrganizationUpdateRequest,
    membership: Annotated[
        OrganizationMember,
        Depends(
            require_organization_roles(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
            )
        ),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationResponse:
    service = OrganizationService(database_session)

    organization = service.update_organization(
        organization_id,
        request_data,
    )

    return OrganizationResponse.model_validate(
        organization
    )


@router.get(
    "/{organization_id}/members",
    response_model=list[OrganizationMemberResponse],
)
def list_members(
    organization_id: UUID,
    membership: CurrentMembership,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> list[OrganizationMemberResponse]:
    service = OrganizationService(database_session)

    members = service.list_members(organization_id)

    return [
        OrganizationMemberResponse.model_validate(member)
        for member in members
    ]


@router.post(
    "/{organization_id}/members",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    organization_id: UUID,
    request_data: OrganizationMemberCreateRequest,
    membership: Annotated[
        OrganizationMember,
        Depends(
            require_organization_roles(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
            )
        ),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationMemberResponse:
    service = OrganizationService(database_session)

    created_member = service.add_member(
        organization_id,
        request_data,
    )

    return OrganizationMemberResponse.model_validate(
        created_member
    )


@router.patch(
    "/{organization_id}/members/{membership_id}",
    response_model=OrganizationMemberResponse,
)
def update_member(
    organization_id: UUID,
    membership_id: UUID,
    request_data: OrganizationMemberUpdateRequest,
    current_membership: Annotated[
        OrganizationMember,
        Depends(
            require_organization_roles(
                OrganizationRole.OWNER,
            )
        ),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationMemberResponse:
    service = OrganizationService(database_session)

    updated_member = service.update_member(
        organization_id,
        membership_id,
        request_data,
    )

    return OrganizationMemberResponse.model_validate(
        updated_member
    )


@router.delete(
    "/{organization_id}/members/{membership_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    organization_id: UUID,
    membership_id: UUID,
    membership: Annotated[
        OrganizationMember,
        Depends(
            require_organization_roles(
                OrganizationRole.OWNER,
                OrganizationRole.ADMIN,
            )
        ),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> None:
    service = OrganizationService(database_session)

    service.remove_member(
        organization_id,
        membership_id,
    )