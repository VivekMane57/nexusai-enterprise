from app.core.exceptions import ApplicationError


class ProjectNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Project was not found.",
            status_code=404,
            error_code="PROJECT_NOT_FOUND",
        )


class ProjectSlugConflictError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "A project with this name already exists "
            "inside the organization.",
            status_code=409,
            error_code="PROJECT_SLUG_CONFLICT",
        )


class ProjectAccessDeniedError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "You do not have permission to access this project.",
            status_code=403,
            error_code="PROJECT_ACCESS_DENIED",
        )