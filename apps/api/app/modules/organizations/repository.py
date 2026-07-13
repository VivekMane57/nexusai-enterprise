from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.modules.organizations.constants import (
    MembershipStatus,
    OrganizationRole,
)
from app.modules.organizations.models import (
    Organization,
    OrganizationMember,
)
from app.modules.users.models import User


class OrganizationRepository:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session

    def create_organization(
        self,
        *,
        name: str,
        slug: str,
        description: str | None,
        owner_id: UUID,
    ) -> Organization:
        organization = Organization(
            name=name,
            slug=slug,
            description=description,
            owner_id=owner_id,
        )

        self.database_session.add(organization)
        self.database_session.flush()

        return organization

    def create_membership(
        self,
        *,
        organization_id: UUID,
        user_id: UUID,
        role: OrganizationRole,
    ) -> OrganizationMember:
        membership = OrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
            role=role,
            status=MembershipStatus.ACTIVE,
        )

        self.database_session.add(membership)
        self.database_session.flush()

        return membership

    def get_organization(
        self,
        organization_id: UUID,
    ) -> Organization | None:
        return self.database_session.get(
            Organization,
            organization_id,
        )

    def get_organization_by_slug(
        self,
        slug: str,
    ) -> Organization | None:
        statement = select(Organization).where(
            Organization.slug == slug
        )

        return self.database_session.scalar(statement)

    def list_user_organizations(
        self,
        user_id: UUID,
    ) -> list[Organization]:
        statement = (
            select(Organization)
            .join(OrganizationMember)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.status
                == MembershipStatus.ACTIVE,
            )
            .order_by(Organization.created_at.desc())
        )

        return list(
            self.database_session.scalars(statement).all()
        )

    def get_membership(
        self,
        *,
        organization_id: UUID,
        user_id: UUID,
    ) -> OrganizationMember | None:
        statement = select(OrganizationMember).where(
            OrganizationMember.organization_id
            == organization_id,
            OrganizationMember.user_id == user_id,
        )

        return self.database_session.scalar(statement)

    def get_membership_by_id(
        self,
        *,
        organization_id: UUID,
        membership_id: UUID,
    ) -> OrganizationMember | None:
        statement = (
            select(OrganizationMember)
            .options(
                joinedload(OrganizationMember.user)
            )
            .where(
                OrganizationMember.organization_id
                == organization_id,
                OrganizationMember.id == membership_id,
            )
        )

        return self.database_session.scalar(statement)

    def list_members(
        self,
        organization_id: UUID,
    ) -> list[OrganizationMember]:
        statement = (
            select(OrganizationMember)
            .options(
                joinedload(OrganizationMember.user)
            )
            .where(
                OrganizationMember.organization_id
                == organization_id
            )
            .order_by(OrganizationMember.joined_at.asc())
        )

        return list(
            self.database_session.scalars(statement).all()
        )

    def get_user_by_email(
        self,
        email: str,
    ) -> User | None:
        statement = select(User).where(
            User.email == email
        )

        return self.database_session.scalar(statement)

    def delete_membership(
        self,
        membership: OrganizationMember,
    ) -> None:
        self.database_session.delete(membership)

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(self, entity: object) -> None:
        self.database_session.refresh(entity)