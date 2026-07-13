from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.modules.projects.constants import (
    ProjectEnvironment,
    ProjectStatus,
)


class ProjectCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=3000,
    )

    environment: ProjectEnvironment = (
        ProjectEnvironment.DEVELOPMENT
    )

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.strip().split())


class ProjectUpdateRequest(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = Field(
        default=None,
        max_length=3000,
    )

    environment: ProjectEnvironment | None = None
    status: ProjectStatus | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return " ".join(value.strip().split())


class ProjectResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    organization_id: UUID
    name: str
    slug: str
    description: str | None
    environment: ProjectEnvironment
    status: ProjectStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int