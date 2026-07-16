from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import (
    get_db_session,
)
from app.modules.audit.service import (
    AuditService,
)


def get_audit_service(
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> AuditService:
    return AuditService(
        database_session
    )


AuditServiceDependency = (
    Annotated[
        AuditService,
        Depends(
            get_audit_service
        ),
    ]
)