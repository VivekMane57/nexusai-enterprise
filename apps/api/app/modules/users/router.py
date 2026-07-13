from fastapi import APIRouter

from app.modules.auth.dependencies import CurrentUser
from app.modules.users.schemas import UserResponse


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
def get_current_user_profile(
    current_user: CurrentUser,
) -> UserResponse:
    return UserResponse.model_validate(current_user)