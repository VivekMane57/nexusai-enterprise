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
from app.modules.organizations.exceptions import (
    OrganizationAccessDeniedError,
)
from app.modules.organizations.models import (
    OrganizationMember,
)
from app.modules.organizations.repository import (
    OrganizationRepository,
)


def get_current_membership(
    organization_id: Annotated[
        UUID,
        Path(),
    ],
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> OrganizationMember:
    repository = OrganizationRepository(
        database_session
    )

    membership = repository.get_membership(
        organization_id=organization_id,
        user_id=current_user.id,
    )

    if (
        membership is None
        or membership.status != MembershipStatus.ACTIVE
    ):
        raise OrganizationAccessDeniedError()

    return membership


CurrentMembership = Annotated[
    OrganizationMember,
    Depends(get_current_membership),
]


def require_organization_roles(
    *allowed_roles: OrganizationRole,
) -> Callable[..., OrganizationMember]:
    def dependency(
        membership: CurrentMembership,
    ) -> OrganizationMember:
        if membership.role not in allowed_roles:
            raise OrganizationAccessDeniedError()

        return membership

    return dependency