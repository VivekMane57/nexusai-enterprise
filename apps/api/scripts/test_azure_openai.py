from app.ai.llm.azure_openai import (
    ChatMessage,
    get_azure_openai_chat_service,
)
from app.core.config import settings


def main() -> None:
    print("=" * 60)
    print("AZURE OPENAI CONNECTION TEST")
    print("=" * 60)

    print(
        "Endpoint:",
        settings.azure_openai_endpoint,
    )
    print(
        "Deployment:",
        settings.azure_openai_chat_deployment,
    )
    print(
        "API version:",
        settings.azure_openai_api_version,
    )
    print(
        "Key configured:",
        settings.azure_openai_api_key is not None,
    )

    service = (
        get_azure_openai_chat_service()
    )

    result = service.generate(
        messages=[
            ChatMessage(
                role="system",
                content=(
                    "You are a concise enterprise "
                    "AI assistant."
                ),
            ),
            ChatMessage(
                role="user",
                content=(
                    "Reply with exactly: "
                    "NexusAI Azure connection successful"
                ),
            ),
        ],
        temperature=0.0,
        max_tokens=50,
    )

    print()
    print("Response:")
    print(result.content)

    print()
    print("Usage:")
    print(
        "Prompt tokens:",
        result.prompt_tokens,
    )
    print(
        "Completion tokens:",
        result.completion_tokens,
    )
    print(
        "Total tokens:",
        result.total_tokens,
    )
    print(
        "Finish reason:",
        result.finish_reason,
    )


if __name__ == "__main__":
    main()