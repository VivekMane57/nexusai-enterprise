import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings


logger = logging.getLogger(__name__)


class ApplicationError(Exception):
    """
    Base exception for expected application-level failures.
    """

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        error_code: str = "APPLICATION_ERROR",
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details


def create_error_response(
    *,
    request: Request,
    status_code: int,
    error_code: str,
    message: str,
    details: Any | None = None,
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": details,
            },
            "request_id": request_id,
        },
    )


async def application_error_handler(
    request: Request,
    exc: ApplicationError,
) -> JSONResponse:
    return create_error_response(
        request=request,
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    return create_error_response(
        request=request,
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        message=str(exc.detail),
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return create_error_response(
        request=request,
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Request validation failed.",
        details=exc.errors(),
    )


async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception(
        "Unhandled application exception",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "path": request.url.path,
            "method": request.method,
        },
    )

    message = (
        str(exc)
        if settings.is_development
        else "An unexpected internal server error occurred."
    )

    return create_error_response(
        request=request,
        status_code=500,
        error_code="INTERNAL_SERVER_ERROR",
        message=message,
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        ApplicationError,
        application_error_handler,
    )
    app.add_exception_handler(
        StarletteHTTPException,
        http_exception_handler,
    )
    app.add_exception_handler(
        RequestValidationError,
        validation_exception_handler,
    )
    app.add_exception_handler(
        Exception,
        unhandled_exception_handler,
    )