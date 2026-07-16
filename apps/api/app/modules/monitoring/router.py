from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import (
    get_db_session,
)
from app.modules.auth.dependencies import (
    CurrentUser,
)
from app.modules.monitoring.schemas import (
    MonitoringDashboardResponse,
)
from app.modules.monitoring.service import (
    MonitoringService,
)


router = APIRouter(
    prefix="/monitoring",
    tags=["Monitoring"],
)


@router.get(
    "/dashboard",
    response_model=MonitoringDashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Monitoring Dashboard",
    description=(
        "Return AI usage metrics, document "
        "processing statistics, recent activity "
        "and infrastructure service health."
    ),
)
def get_monitoring_dashboard(
    current_user: CurrentUser,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> MonitoringDashboardResponse:
    service = MonitoringService(
        database_session
    )

    return service.get_dashboard()