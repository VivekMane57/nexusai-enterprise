from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.organizations.constants import (
    OrganizationRole,
)
from app.modules.organizations.exceptions import (
    MemberAlreadyExistsError,
    MemberUserNotFoundError,
    OrganizationMemberNotFoundError,
    OrganizationNotFoundError,
    OrganizationSlugConflictError,
    OwnerMembershipModificationError,
)
from app.modules.organizations.models import (
    Organization,
    OrganizationMember,
)
from app.modules.organizations.repository import (
    OrganizationRepository,
)
from app.modules.organizations.schemas import (
    OrganizationCreateRequest,
    OrganizationMemberCreateRequest,
    OrganizationMemberUpdateRequest,
    OrganizationUpdateRequest,
)
from app.modules.users.models import User
from app.shared.utils.slug import generate_slug


class OrganizationService:
    def __init__(self, database_session: Session) -> None:
        self.repository = OrganizationRepository(
            database_session
        )

    def create_organization(
        self,
        request_data: OrganizationCreateRequest,
        current_user: User,
    ) -> Organization:
        base_slug = generate_slug(request_data.name)
        slug = base_slug
        suffix = 2

        while (
            self.repository.get_organization_by_slug(slug)
            is not None
        ):
            slug = f"{base_slug}-{suffix}"
            suffix += 1

        organization = self.repository.create_organization(
            name=request_data.name,
            slug=slug,
            description=request_data.description,
            owner_id=current_user.id,
        )

        self.repository.create_membership(
            organization_id=organization.id,
            user_id=current_user.id,
            role=OrganizationRole.OWNER,
        )

        try:
            self.repository.commit()
        except IntegrityError as exc:
            self.repository.rollback()
            raise OrganizationSlugConflictError() from exc

        self.repository.refresh(organization)

        return organization

    def list_organizations(
        self,
        current_user: User,
    ) -> list[Organization]:
        return self.repository.list_user_organizations(
            current_user.id
        )

    def get_organization(
        self,
        organization_id: UUID,
    ) -> Organization:
        organization = self.repository.get_organization(
            organization_id
        )

        if organization is None:
            raise OrganizationNotFoundError()

        return organization

    def update_organization(
        self,
        organization_id: UUID,
        request_data: OrganizationUpdateRequest,
    ) -> Organization:
        organization = self.get_organization(
            organization_id
        )

        update_data = request_data.model_dump(
            exclude_unset=True
        )

        if "name" in update_data:
            organization.name = update_data["name"]

        if "description" in update_data:
            organization.description = update_data[
                "description"
            ]

        if "status" in update_data:
            organization.status = update_data["status"]

        self.repository.commit()
        self.repository.refresh(organization)

        return organization

    def add_member(
        self,
        organization_id: UUID,
        request_data: OrganizationMemberCreateRequest,
    ) -> OrganizationMember:
        self.get_organization(organization_id)

        if request_data.role == OrganizationRole.OWNER:
            raise OwnerMembershipModificationError()

        user = self.repository.get_user_by_email(
            request_data.email
        )

        if user is None:
            raise MemberUserNotFoundError()

        existing = self.repository.get_membership(
            organization_id=organization_id,
            user_id=user.id,
        )

        if existing is not None:
            raise MemberAlreadyExistsError()

        membership = self.repository.create_membership(
            organization_id=organization_id,
            user_id=user.id,
            role=request_data.role,
        )

        try:
            self.repository.commit()
        except IntegrityError as exc:
            self.repository.rollback()
            raise MemberAlreadyExistsError() from exc

        return self.repository.get_membership_by_id(
            organization_id=organization_id,
            membership_id=membership.id,
        ) or membership

    def list_members(
        self,
        organization_id: UUID,
    ) -> list[OrganizationMember]:
        self.get_organization(organization_id)

        return self.repository.list_members(
            organization_id
        )

    def update_member(
        self,
        organization_id: UUID,
        membership_id: UUID,
        request_data: OrganizationMemberUpdateRequest,
    ) -> OrganizationMember:
        membership = self.repository.get_membership_by_id(
            organization_id=organization_id,
            membership_id=membership_id,
        )

        if membership is None:
            raise OrganizationMemberNotFoundError()

        if membership.role == OrganizationRole.OWNER:
            raise OwnerMembershipModificationError()

        update_data = request_data.model_dump(
            exclude_unset=True
        )

        if update_data.get("role") == OrganizationRole.OWNER:
            raise OwnerMembershipModificationError()

        for field_name, value in update_data.items():
            setattr(membership, field_name, value)

        self.repository.commit()
        self.repository.refresh(membership)

        return membership

    def remove_member(
        self,
        organization_id: UUID,
        membership_id: UUID,
    ) -> None:
        membership = self.repository.get_membership_by_id(
            organization_id=organization_id,
            membership_id=membership_id,
        )

        if membership is None:
            raise OrganizationMemberNotFoundError()

        if membership.role == OrganizationRole.OWNER:
            raise OwnerMembershipModificationError()

        self.repository.delete_membership(membership)
        self.repository.commit()