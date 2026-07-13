from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.modules.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("X-Forwarded-For")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client is not None:
        return request.client.host

    return None


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a user",
)
def register(
    request_data: RegisterRequest,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> UserResponse:
    service = AuthService(database_session)

    user = service.register_user(request_data)

    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate a user",
)
def login(
    request: Request,
    request_data: LoginRequest,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> TokenResponse:
    service = AuthService(database_session)

    return service.login(
        request_data,
        client_ip=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate a refresh token",
)
def refresh(
    request: Request,
    request_data: RefreshTokenRequest,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> TokenResponse:
    service = AuthService(database_session)

    return service.refresh(
        request_data.refresh_token,
        client_ip=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke a refresh token",
)
def logout(
    request_data: LogoutRequest,
    database_session: Annotated[
        Session,
        Depends(get_db_session),
    ],
) -> MessageResponse:
    service = AuthService(database_session)

    service.logout(request_data.refresh_token)

    return MessageResponse(
        message="Logout completed successfully."
    )