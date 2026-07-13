import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

import jwt
from jwt import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings
from app.core.exceptions import ApplicationError


password_hash = PasswordHash.recommended()


class TokenPayloadError(ApplicationError):
    def __init__(self, message: str = "Invalid authentication token.") -> None:
        super().__init__(
            message,
            status_code=401,
            error_code="INVALID_TOKEN",
        )


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    *,
    user_id: UUID,
    email: str,
) -> tuple[str, int]:
    expires_delta = timedelta(
        minutes=settings.access_token_expire_minutes
    )

    expires_at = datetime.now(timezone.utc) + expires_delta

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "jti": str(uuid4()),
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }

    encoded_token = jwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    return encoded_token, int(expires_delta.total_seconds())


def create_refresh_token(
    *,
    user_id: UUID,
) -> tuple[str, str, datetime]:
    token_jti = str(uuid4())

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": token_jti,
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }

    encoded_token = jwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    return encoded_token, token_jti, expires_at


def decode_token(
    token: str,
    *,
    expected_type: str,
) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
    except InvalidTokenError as exc:
        raise TokenPayloadError() from exc

    token_type = payload.get("type")

    if token_type != expected_type:
        raise TokenPayloadError(
            f"Expected a {expected_type} token."
        )

    if not payload.get("sub") or not payload.get("jti"):
        raise TokenPayloadError()

    return payload