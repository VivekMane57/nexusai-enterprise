from fastapi import APIRouter

router = APIRouter(
    prefix="/api/v1/model-providers",
    tags=["Model Providers"],
)


@router.get(
    "",
    summary="List model providers",
)
async def list_model_providers():
    return [
        {
            "id": "azure-openai",
            "name": "Azure OpenAI",
            "provider": "Azure",
            "enabled": True,
            "default": True,
        },
        {
            "id": "openai",
            "name": "OpenAI",
            "provider": "OpenAI",
            "enabled": False,
            "default": False,
        },
        {
            "id": "ollama",
            "name": "Ollama",
            "provider": "Local",
            "enabled": False,
            "default": False,
        },
    ]