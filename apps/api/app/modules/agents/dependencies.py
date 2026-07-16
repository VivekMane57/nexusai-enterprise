from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.agents.service import AgentService


def get_agent_service(
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> AgentService:
    """
    Dependency for AgentService.
    """

    return AgentService(
        database_session=database_session,
    )