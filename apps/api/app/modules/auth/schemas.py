from pydantic import BaseModel, EmailStr, Field, field_validator

from app.modules.users.schemas import UserResponse


class RegisterRequest(BaseModel):
    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    password: str = Field(
        min_length=10,
        max_length=128,
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        has_uppercase = any(
            character.isupper()
            for character in value
        )
        has_lowercase = any(
            character.islower()
            for character in value
        )
        has_digit = any(
            character.isdigit()
            for character in value
        )

        if not all(
            (
                has_uppercase,
                has_lowercase,
                has_digit,
            )
        ):
            raise ValueError(
                "Password must contain uppercase, lowercase "
                "and numeric characters."
            )

        return value


class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(
        min_length=20,
    )


class LogoutRequest(BaseModel):
    refresh_token: str = Field(
        min_length=20,
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    message: str