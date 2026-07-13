from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import RefreshToken
from app.modules.users.models import User


class AuthRepository:
    def __init__(self, database_session: Session) -> None:
        self.database_session = database_session

    def get_user_by_email(
        self,
        email: str,
    ) -> User | None:
        statement = select(User).where(
            User.email == email
        )

        return self.database_session.scalar(statement)

    def get_user_by_id(
        self,
        user_id: UUID,
    ) -> User | None:
        return self.database_session.get(
            User,
            user_id,
        )

    def create_user(
        self,
        *,
        email: str,
        full_name: str,
        password_hash: str,
    ) -> User:
        user = User(
            email=email,
            full_name=full_name,
            password_hash=password_hash,
        )

        self.database_session.add(user)
        self.database_session.flush()
        self.database_session.refresh(user)

        return user

    def create_refresh_token(
        self,
        *,
        user_id: UUID,
        token_jti: str,
        token_hash: str,
        expires_at: datetime,
        created_ip: str | None,
        user_agent: str | None,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token_jti=token_jti,
            token_hash=token_hash,
            expires_at=expires_at,
            created_ip=created_ip,
            user_agent=user_agent,
        )

        self.database_session.add(refresh_token)
        self.database_session.flush()

        return refresh_token

    def get_refresh_token_by_jti(
        self,
        token_jti: str,
    ) -> RefreshToken | None:
        statement = select(RefreshToken).where(
            RefreshToken.token_jti == token_jti
        )

        return self.database_session.scalar(statement)

    def revoke_refresh_token(
        self,
        refresh_token: RefreshToken,
        revoked_at: datetime,
    ) -> None:
        refresh_token.revoked_at = revoked_at
        self.database_session.add(refresh_token)

    def update_last_login(
        self,
        user: User,
        last_login_at: datetime,
    ) -> None:
        user.last_login_at = last_login_at
        self.database_session.add(user)

    def commit(self) -> None:
        self.database_session.commit()

    def rollback(self) -> None:
        self.database_session.rollback()