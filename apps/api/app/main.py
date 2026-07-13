import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.db.session import close_database_engine


configure_logging()
logger = logging.getLogger(__name__)
request_logger = logging.getLogger("nexusai.request")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info(
        "NexusAI Enterprise API starting",
        extra={
            "version": settings.app_version,
            "environment": settings.app_env,
        },
    )

    yield

    close_database_engine()

    logger.info(
        "NexusAI Enterprise API stopped",
        extra={
            "version": settings.app_version,
            "environment": settings.app_env,
        },
    )


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Enterprise Agentic AI platform for building, evaluating, "
            "deploying and monitoring trustworthy AI assistants."
        ),
        debug=settings.debug,
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        openapi_url=settings.openapi_url,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    register_exception_handlers(application)

    application.include_router(health_router)
    application.include_router(
        api_v1_router,
        prefix=settings.api_v1_prefix,
    )

    return application


app = create_application()


@app.middleware("http")
async def request_context_middleware(
    request: Request,
    call_next,
) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    request.state.request_id = request_id

    start_time = perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        request_logger.exception(
            "HTTP request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": (
                    request.client.host
                    if request.client is not None
                    else None
                ),
            },
        )
        raise

    latency_ms = round((perf_counter() - start_time) * 1000, 2)

    response.headers["X-Request-ID"] = request_id

    request_logger.info(
        "HTTP request completed",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "client_ip": (
                request.client.host
                if request.client is not None
                else None
            ),
        },
    )

    return response


@app.get(
    "/",
    tags=["Platform"],
    summary="Platform information",
)
async def root() -> dict[str, str]:
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "status": "running",
        "documentation": settings.docs_url or "disabled",
    }