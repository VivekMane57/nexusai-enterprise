from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import (
    get_db_session,
)
from app.modules.agents.exceptions import (
    AgentRunNotFoundError,
)
from app.modules.agents.schemas import (
    AgentDashboardResponse,
    AgentDefinitionResponse,
    AgentRunDetailResponse,
    AgentRunListResponse,
    AgentRunRequest,
)
from app.modules.agents.service import (
    AgentService,
)
from app.modules.auth.dependencies import (
    CurrentUser,
)


router = APIRouter(
    prefix="/agents",
    tags=["Agents"],
)


@router.get(
    "",
    response_model=list[
        AgentDefinitionResponse
    ],
    summary="List Available Agents",
)
def list_available_agents(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> list[
    AgentDefinitionResponse
]:
    _ = current_user

    service = AgentService(
        database_session
    )

    return service.list_available_agents()


@router.get(
    "/dashboard",
    response_model=AgentDashboardResponse,
    summary="Get Agent Dashboard",
)
def get_agent_dashboard(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=50,
        ),
    ] = 10,
) -> AgentDashboardResponse:
    service = AgentService(
        database_session
    )

    return service.get_dashboard(
        current_user=current_user,
        limit=limit,
    )


@router.post(
    "/run",
    response_model=AgentRunDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run AI Agent",
    description=(
        "Run a specialist agent using hybrid "
        "retrieval, reranking, Azure OpenAI, "
        "citations and execution tracing."
    ),
)
def run_agent(
    request_data: AgentRunRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> AgentRunDetailResponse:
    service = AgentService(
        database_session
    )

    agent_run = service.run_agent(
        request_data=request_data,
        current_user=current_user,
    )

    return (
        AgentRunDetailResponse
        .model_validate(agent_run)
    )


@router.get(
    "/runs",
    response_model=AgentRunListResponse,
    summary="List Agent Runs",
)
def list_agent_runs(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=200,
        ),
    ] = 50,
) -> AgentRunListResponse:
    service = AgentService(
        database_session
    )

    return service.list_runs(
        current_user=current_user,
        limit=limit,
    )


@router.get(
    "/runs/{run_id}",
    response_model=AgentRunDetailResponse,
    summary="Get Agent Run",
)
def get_agent_run(
    run_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> AgentRunDetailResponse:
    service = AgentService(
        database_session
    )

    try:
        agent_run = service.get_run(
            run_id=run_id,
            current_user=current_user,
        )
    except AgentRunNotFoundError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Agent run not found.",
        ) from error

    return (
        AgentRunDetailResponse
        .model_validate(agent_run)
    )


@router.delete(
    "/runs/{run_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete Agent Run",
)
def delete_agent_run(
    run_id: UUID,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> Response:
    service = AgentService(
        database_session
    )

    try:
        service.delete_run(
            run_id=run_id,
            current_user=current_user,
        )
    except AgentRunNotFoundError as error:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Agent run not found.",
        ) from error

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )