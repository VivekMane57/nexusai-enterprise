from app.core.exceptions import ApplicationError


class DocumentNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Document was not found.",
            status_code=404,
            error_code="DOCUMENT_NOT_FOUND",
        )


class UnsupportedDocumentTypeError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Only PDF, DOCX and TXT documents are supported.",
            status_code=415,
            error_code="UNSUPPORTED_DOCUMENT_TYPE",
        )


class DocumentTooLargeError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Document exceeds the maximum allowed size of 20 MB.",
            status_code=413,
            error_code="DOCUMENT_TOO_LARGE",
        )


class EmptyDocumentError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Uploaded document is empty.",
            status_code=400,
            error_code="EMPTY_DOCUMENT",
        )