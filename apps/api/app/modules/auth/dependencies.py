from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ApplicationError
from app.core.security import decode_token
from app.db.session import get_db_session
from app.modules.auth.exceptions import InactiveUserError
from app.modules.auth.repository import AuthRepository
from app.modules.users.models import User


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> User:
    if credentials is None:
        raise ApplicationError(
            "Authentication credentials were not provided.",
            status_code=401,
            error_code="AUTHENTICATION_REQUIRED",
        )

    payload = decode_token(
        credentials.credentials,
        expected_type="access",
    )

    try:
        user_id = UUID(str(payload["sub"]))
    except ValueError as exc:
        raise ApplicationError(
            "Invalid authentication token.",
            status_code=401,
            error_code="INVALID_TOKEN",
        ) from exc

    repository = AuthRepository(database_session)
    user = repository.get_user_by_id(user_id)

    if user is None:
        raise ApplicationError(
            "The authenticated user no longer exists.",
            status_code=401,
            error_code="USER_NOT_FOUND",
        )

    if not user.is_active:
        raise InactiveUserError()

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]