from app.core.exceptions import ApplicationError


class KnowledgeBaseNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Knowledge base was not found.",
            status_code=404,
            error_code="KNOWLEDGE_BASE_NOT_FOUND",
        )


class KnowledgeBaseConflictError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "A knowledge base with this name already exists.",
            status_code=409,
            error_code="KNOWLEDGE_BASE_CONFLICT",
        )