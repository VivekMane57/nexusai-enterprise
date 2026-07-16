from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import (
    get_db_session,
)
from app.modules.auth.dependencies import (
    CurrentUser,
)
from app.modules.evaluations.schemas import (
    EvaluationDashboardResponse,
    EvaluationHistoryItem,
    EvaluationRunRequest,
    EvaluationRunResponse,
)
from app.modules.evaluations.service import (
    EvaluationService,
)


router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"],
)


@router.get(
    "/dashboard",
    response_model=EvaluationDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Evaluation Dashboard",
    description=(
        "Return quality metrics generated from "
        "stored RAG conversations and citations."
    ),
)
def get_evaluation_dashboard(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
    days: Annotated[
        int,
        Query(
            ge=1,
            le=30,
        ),
    ] = 7,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=100,
        ),
    ] = 20,
) -> EvaluationDashboardResponse:
    _ = current_user

    service = EvaluationService(
        database_session
    )

    return service.get_dashboard(
        days=days,
        limit=limit,
    )


@router.get(
    "/history",
    response_model=list[
        EvaluationHistoryItem
    ],
    status_code=status.HTTP_200_OK,
    summary="List Evaluation History",
)
def list_evaluation_history(
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
) -> list[
    EvaluationHistoryItem
]:
    _ = current_user

    service = EvaluationService(
        database_session
    )

    return service.get_history(
        limit=limit,
    )


@router.post(
    "/run",
    response_model=EvaluationRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Run RAG Evaluation",
    description=(
        "Evaluate a question, answer, retrieved "
        "contexts and citations using deterministic "
        "RAG quality metrics."
    ),
)
def run_evaluation(
    request_data: EvaluationRunRequest,
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> EvaluationRunResponse:
    _ = current_user

    service = EvaluationService(
        database_session
    )

    return service.run_evaluation(
        request_data
    )