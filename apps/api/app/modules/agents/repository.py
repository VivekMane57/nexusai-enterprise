from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.modules.agents.models import (
    AgentRun,
    AgentRunStep,
)


class AgentRepository:
    def __init__(
        self,
        database_session: Session,
    ) -> None:
        self.database_session = database_session

    def create_run(
        self,
        agent_run: AgentRun,
    ) -> AgentRun:
        self.database_session.add(agent_run)
        self.database_session.flush()

        return agent_run

    def get_run(
        self,
        *,
        run_id: UUID,
        created_by: UUID,
    ) -> AgentRun | None:
        statement = (
            select(AgentRun)
            .options(
                selectinload(
                    AgentRun.steps
                )
            )
            .where(
                AgentRun.id == run_id,
                AgentRun.created_by == created_by,
            )
        )

        return (
            self.database_session.execute(
                statement
            )
            .scalars()
            .first()
        )

    def list_runs(
        self,
        *,
        created_by: UUID,
        limit: int = 50,
    ) -> list[AgentRun]:
        statement = (
            select(AgentRun)
            .where(
                AgentRun.created_by == created_by
            )
            .order_by(
                AgentRun.created_at.desc()
            )
            .limit(limit)
        )

        return list(
            self.database_session.execute(
                statement
            )
            .scalars()
            .all()
        )

    def create_step(
        self,
        step: AgentRunStep,
    ) -> AgentRunStep:
        self.database_session.add(step)
        self.database_session.flush()

        return step

    def delete_run(
        self,
        agent_run: AgentRun,
    ) -> None:
        self.database_session.delete(
            agent_run
        )

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()

    def refresh(
        self,
        instance: object,
    ) -> None:
        self.database_session.refresh(
            instance
        )