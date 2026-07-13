from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router


api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)


@api_v1_router.get(
    "/status",
    tags=["Platform"],
    summary="API v1 status",
)
async def api_status() -> dict[str, str]:
    return {
        "api_version": "v1",
        "status": "available",
    }