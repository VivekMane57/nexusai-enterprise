import asyncio
from time import perf_counter
from typing import Any

import httpx
import redis.asyncio as redis
from fastapi import APIRouter, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import check_database_connection


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


class ServiceHealth(BaseModel):
    status: str
    latency_ms: float | None = None


class HealthResponse(BaseModel):
    application: str
    version: str
    environment: str
    status: str
    services: dict[str, ServiceHealth] | None = None


async def check_postgres() -> ServiceHealth:
    start = perf_counter()

    try:
        connected = await run_in_threadpool(check_database_connection)

        return ServiceHealth(
            status="healthy" if connected else "unhealthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )
    except Exception:
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )


async def check_redis() -> ServiceHealth:
    start = perf_counter()
    client: redis.Redis | None = None

    try:
        client = redis.from_url(
            settings.redis_url,
            socket_timeout=settings.redis_socket_timeout,
            decode_responses=True,
        )

        connected = await client.ping()

        return ServiceHealth(
            status="healthy" if connected else "unhealthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )
    except Exception:
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )
    finally:
        if client is not None:
            await client.aclose()


async def check_qdrant() -> ServiceHealth:
    start = perf_counter()

    try:
        headers: dict[str, str] = {}

        if settings.qdrant_api_key is not None:
            api_key = settings.qdrant_api_key.get_secret_value()

            if api_key:
                headers["api-key"] = api_key

        async with httpx.AsyncClient(
            timeout=settings.qdrant_timeout_seconds
        ) as client:
            response = await client.get(
                f"{settings.qdrant_url.rstrip('/')}/healthz",
                headers=headers,
            )
            response.raise_for_status()

        return ServiceHealth(
            status="healthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )
    except Exception:
        return ServiceHealth(
            status="unhealthy",
            latency_ms=round((perf_counter() - start) * 1000, 2),
        )


@router.get(
    "",
    response_model=HealthResponse,
    summary="Application health",
)
async def health() -> HealthResponse:
    return HealthResponse(
        application=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        status="healthy",
    )


@router.get(
    "/live",
    response_model=HealthResponse,
    summary="Application liveness",
)
async def liveness() -> HealthResponse:
    return HealthResponse(
        application=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        status="alive",
    )


@router.get(
    "/ready",
    summary="Application readiness",
)
async def readiness() -> JSONResponse:
    postgres_health, redis_health, qdrant_health = await asyncio.gather(
        check_postgres(),
        check_redis(),
        check_qdrant(),
    )

    services: dict[str, ServiceHealth] = {
        "postgres": postgres_health,
        "redis": redis_health,
        "qdrant": qdrant_health,
    }

    all_healthy = all(
        service.status == "healthy"
        for service in services.values()
    )

    response_status = "ready" if all_healthy else "not_ready"
    status_code = (
        status.HTTP_200_OK
        if all_healthy
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    response_body: dict[str, Any] = {
        "application": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "status": response_status,
        "services": {
            service_name: service.model_dump()
            for service_name, service in services.items()
        },
    }

    return JSONResponse(
        status_code=status_code,
        content=response_body,
    )