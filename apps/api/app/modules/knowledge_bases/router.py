from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.dependencies import CurrentUser
from app.modules.organizations.constants import (
    OrganizationRole,
)
from app.modules.projects.dependencies import (
    AccessibleProject,
    require_project_roles,
)
from app.modules.projects.models import Project
from app.modules.knowledge_bases.schemas import (
    KnowledgeBaseCreateRequest,
    KnowledgeBaseListResponse,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdateRequest,
)
from app.modules.knowledge_bases.service import (
    KnowledgeBaseService,
)


project_knowledge_bases_router = APIRouter(
    prefix="/projects/{project_id}/knowledge-bases",
    tags=["Knowledge Bases"],
)

knowledge_bases_router = APIRouter(
    prefix="/knowledge-bases",
    tags=["Knowledge Bases"],
)


@project_knowledge_bases_router.post(
    "",
    response_model=KnowledgeBaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_knowledge_base(
    project_id: UUID,
    request_data: KnowledgeBaseCreateRequest,
    current_user: CurrentUser,
    project: Annotated[
        Project,
        Depends(
            require_project_roles(
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
) -> KnowledgeBaseResponse:
    service = KnowledgeBaseService(database_session)

    knowledge_base = service.create_knowledge_base(
        project_id=project_id,
        request_data=request_data,
        current_user=current_user,
    )

    return KnowledgeBaseResponse.model_validate(
        knowledge_base
    )


@project_knowledge_bases_router.get(
    "",
    response_model=KnowledgeBaseListResponse,
)
def list_knowledge_bases(
    project_id: UUID,
    project: AccessibleProject,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> KnowledgeBaseListResponse:
    service = KnowledgeBaseService(database_session)

    knowledge_bases = service.list_knowledge_bases(
        project_id
    )

    return KnowledgeBaseListResponse(
        items=[
            KnowledgeBaseResponse.model_validate(item)
            for item in knowledge_bases
        ],
        total=len(knowledge_bases),
    )


@knowledge_bases_router.get(
    "/{knowledge_base_id}",
    response_model=KnowledgeBaseResponse,
)
def get_knowledge_base(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> KnowledgeBaseResponse:
    service = KnowledgeBaseService(database_session)

    knowledge_base = service.get_knowledge_base(
        knowledge_base_id
    )

    return KnowledgeBaseResponse.model_validate(
        knowledge_base
    )


@knowledge_bases_router.patch(
    "/{knowledge_base_id}",
    response_model=KnowledgeBaseResponse,
)
def update_knowledge_base(
    knowledge_base_id: UUID,
    request_data: KnowledgeBaseUpdateRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> KnowledgeBaseResponse:
    service = KnowledgeBaseService(database_session)

    knowledge_base = service.update_knowledge_base(
        knowledge_base_id=knowledge_base_id,
        request_data=request_data,
    )

    return KnowledgeBaseResponse.model_validate(
        knowledge_base
    )


@knowledge_bases_router.delete(
    "/{knowledge_base_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_knowledge_base(
    knowledge_base_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> None:
    service = KnowledgeBaseService(database_session)

    service.delete_knowledge_base(
        knowledge_base_id
    )