from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.modules.auth.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse


class AuthService:
    def __init__(self, database_session: Session) -> None:
        self.repository = AuthRepository(database_session)

    def register_user(
        self,
        request_data: RegisterRequest,
    ) -> User:
        existing_user = self.repository.get_user_by_email(
            request_data.email
        )

        if existing_user is not None:
            raise EmailAlreadyRegisteredError()

        user = self.repository.create_user(
            email=request_data.email,
            full_name=request_data.full_name,
            password_hash=hash_password(
                request_data.password
            ),
        )

        try:
            self.repository.commit()
        except IntegrityError as exc:
            self.repository.rollback()
            raise EmailAlreadyRegisteredError() from exc

        return user

    def login(
        self,
        request_data: LoginRequest,
        *,
        client_ip: str | None,
        user_agent: str | None,
    ) -> TokenResponse:
        user = self.repository.get_user_by_email(
            request_data.email
        )

        if user is None or not verify_password(
            request_data.password,
            user.password_hash,
        ):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise InactiveUserError()

        token_response = self._issue_token_pair(
            user,
            client_ip=client_ip,
            user_agent=user_agent,
        )

        self.repository.update_last_login(
            user,
            datetime.now(timezone.utc),
        )

        self.repository.commit()

        return token_response

    def refresh(
        self,
        raw_refresh_token: str,
        *,
        client_ip: str | None,
        user_agent: str | None,
    ) -> TokenResponse:
        payload = decode_token(
            raw_refresh_token,
            expected_type="refresh",
        )

        token_jti = str(payload["jti"])
        user_id = UUID(str(payload["sub"]))

        stored_token = self.repository.get_refresh_token_by_jti(
            token_jti
        )

        now = datetime.now(timezone.utc)

        if (
            stored_token is None
            or stored_token.revoked_at is not None
            or stored_token.expires_at <= now
            or stored_token.token_hash
            != hash_token(raw_refresh_token)
        ):
            raise InvalidRefreshTokenError()

        user = self.repository.get_user_by_id(user_id)

        if user is None:
            raise InvalidRefreshTokenError()

        if not user.is_active:
            raise InactiveUserError()

        # Refresh-token rotation:
        # revoke old token and issue a completely new token pair.
        self.repository.revoke_refresh_token(
            stored_token,
            now,
        )

        token_response = self._issue_token_pair(
            user,
            client_ip=client_ip,
            user_agent=user_agent,
        )

        self.repository.commit()

        return token_response

    def logout(
        self,
        raw_refresh_token: str,
    ) -> None:
        try:
            payload = decode_token(
                raw_refresh_token,
                expected_type="refresh",
            )
        except Exception:
            # Logout remains idempotent.
            return

        stored_token = self.repository.get_refresh_token_by_jti(
            str(payload["jti"])
        )

        if stored_token is None or stored_token.revoked_at is not None:
            return

        self.repository.revoke_refresh_token(
            stored_token,
            datetime.now(timezone.utc),
        )

        self.repository.commit()

    def _issue_token_pair(
        self,
        user: User,
        *,
        client_ip: str | None,
        user_agent: str | None,
    ) -> TokenResponse:
        access_token, expires_in = create_access_token(
            user_id=user.id,
            email=user.email,
        )

        (
            refresh_token,
            token_jti,
            refresh_expires_at,
        ) = create_refresh_token(
            user_id=user.id,
        )

        self.repository.create_refresh_token(
            user_id=user.id,
            token_jti=token_jti,
            token_hash=hash_token(refresh_token),
            expires_at=refresh_expires_at,
            created_ip=client_ip,
            user_agent=user_agent,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )