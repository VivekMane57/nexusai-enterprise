from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)

from app.modules.organizations.constants import (
    MembershipStatus,
    OrganizationRole,
    OrganizationStatus,
)


class OrganizationCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.strip().split())


class OrganizationUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    status: OrganizationStatus | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return " ".join(value.strip().split())


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    name: str
    slug: str
    description: str | None
    owner_id: UUID
    status: OrganizationStatus
    created_at: datetime
    updated_at: datetime


class OrganizationMemberCreateRequest(BaseModel):
    email: EmailStr
    role: OrganizationRole = OrganizationRole.VIEWER

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class OrganizationMemberUpdateRequest(BaseModel):
    role: OrganizationRole | None = None
    status: MembershipStatus | None = None


class MemberUserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    organization_id: UUID
    user_id: UUID
    role: OrganizationRole
    status: MembershipStatus
    joined_at: datetime
    created_at: datetime
    updated_at: datetime
    user: MemberUserResponse


class OrganizationListResponse(BaseModel):
    items: list[OrganizationResponse]
    total: int