from app.core.exceptions import ApplicationError


class EmailAlreadyRegisteredError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "An account with this email already exists.",
            status_code=409,
            error_code="EMAIL_ALREADY_REGISTERED",
        )


class InvalidCredentialsError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Invalid email or password.",
            status_code=401,
            error_code="INVALID_CREDENTIALS",
        )


class InactiveUserError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "This user account is inactive.",
            status_code=403,
            error_code="USER_INACTIVE",
        )


class InvalidRefreshTokenError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "The refresh token is invalid, expired or revoked.",
            status_code=401,
            error_code="INVALID_REFRESH_TOKEN",
        )