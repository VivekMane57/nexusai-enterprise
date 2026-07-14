from collections.abc import Generator, Sequence
from dataclasses import dataclass
from functools import lru_cache

from openai import AzureOpenAI

from app.core.config import settings


class AzureOpenAIConfigurationError(RuntimeError):
    """
    Raised when required Azure OpenAI settings are missing.
    """


class AzureOpenAIResponseError(RuntimeError):
    """
    Raised when Azure OpenAI returns an unusable response.
    """


@dataclass(frozen=True)
class ChatMessage:
    role: str
    content: str


@dataclass(frozen=True)
class ChatGenerationResult:
    content: str
    model: str | None
    finish_reason: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None


@dataclass(frozen=True)
class ChatStreamChunk:
    """
    One normalized Azure OpenAI streaming event.
    """

    content: str | None = None
    finish_reason: str | None = None
    model: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class AzureOpenAIChatService:
    """
    Azure OpenAI chat-completion gateway.
    """

    def __init__(self) -> None:
        endpoint = (
            settings.azure_openai_endpoint
            or ""
        ).strip()

        deployment = (
            settings.azure_openai_chat_deployment
            or ""
        ).strip()

        api_version = (
            settings.azure_openai_api_version
            or ""
        ).strip()

        secret = settings.azure_openai_api_key

        api_key = (
            secret.get_secret_value().strip()
            if secret is not None
            else ""
        )

        missing: list[str] = []

        if not endpoint:
            missing.append(
                "AZURE_OPENAI_ENDPOINT"
            )

        if not api_key:
            missing.append(
                "AZURE_OPENAI_API_KEY"
            )

        if not deployment:
            missing.append(
                "AZURE_OPENAI_CHAT_DEPLOYMENT"
            )

        if not api_version:
            missing.append(
                "AZURE_OPENAI_API_VERSION"
            )

        if missing:
            raise AzureOpenAIConfigurationError(
                "Missing Azure OpenAI configuration: "
                + ", ".join(
                    dict.fromkeys(missing)
                )
            )

        self.deployment = deployment

        self.client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            timeout=60.0,
            max_retries=2,
        )

    def generate(
        self,
        *,
        messages: Sequence[ChatMessage],
        temperature: float = 0.1,
        max_tokens: int = 800,
    ) -> ChatGenerationResult:
        normalized_messages = (
            self._normalize_messages(
                messages
            )
        )

        self._validate_generation_options(
            temperature=temperature,
            max_tokens=max_tokens,
        )

        response = (
            self.client.chat.completions.create(
                model=self.deployment,
                messages=normalized_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        )

        if not response.choices:
            raise AzureOpenAIResponseError(
                "Azure OpenAI returned no completion choices."
            )

        choice = response.choices[0]

        content = (
            choice.message.content
            or ""
        ).strip()

        if not content:
            raise AzureOpenAIResponseError(
                "Azure OpenAI returned an empty response."
            )

        usage = response.usage

        return ChatGenerationResult(
            content=content,
            model=response.model,
            finish_reason=choice.finish_reason,
            prompt_tokens=(
                usage.prompt_tokens
                if usage is not None
                else None
            ),
            completion_tokens=(
                usage.completion_tokens
                if usage is not None
                else None
            ),
            total_tokens=(
                usage.total_tokens
                if usage is not None
                else None
            ),
        )

    def stream_generate(
        self,
        *,
        messages: Sequence[ChatMessage],
        temperature: float = 0.1,
        max_tokens: int = 800,
    ) -> Generator[ChatStreamChunk, None, None]:
        """
        Stream generated content token-by-token.
        """

        normalized_messages = (
            self._normalize_messages(
                messages
            )
        )

        self._validate_generation_options(
            temperature=temperature,
            max_tokens=max_tokens,
        )

        stream = (
            self.client.chat.completions.create(
                model=self.deployment,
                messages=normalized_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                stream_options={
                    "include_usage": True,
                },
            )
        )

        for chunk in stream:
            usage = chunk.usage

            if not chunk.choices:
                if usage is not None:
                    yield ChatStreamChunk(
                        model=chunk.model,
                        prompt_tokens=(
                            usage.prompt_tokens
                        ),
                        completion_tokens=(
                            usage.completion_tokens
                        ),
                        total_tokens=(
                            usage.total_tokens
                        ),
                    )

                continue

            choice = chunk.choices[0]

            content = (
                choice.delta.content
                or ""
            )

            yield ChatStreamChunk(
                content=content or None,
                finish_reason=(
                    choice.finish_reason
                ),
                model=chunk.model,
                prompt_tokens=(
                    usage.prompt_tokens
                    if usage is not None
                    else None
                ),
                completion_tokens=(
                    usage.completion_tokens
                    if usage is not None
                    else None
                ),
                total_tokens=(
                    usage.total_tokens
                    if usage is not None
                    else None
                ),
            )

    @staticmethod
    def _normalize_messages(
        messages: Sequence[ChatMessage],
    ) -> list[dict[str, str]]:
        if not messages:
            raise ValueError(
                "At least one chat message is required."
            )

        allowed_roles = {
            "system",
            "user",
            "assistant",
        }

        normalized: list[
            dict[str, str]
        ] = []

        for message in messages:
            role = (
                message.role
                .strip()
                .lower()
            )

            content = " ".join(
                message.content.split()
            ).strip()

            if role not in allowed_roles:
                raise ValueError(
                    f"Unsupported chat role: {message.role}"
                )

            if not content:
                raise ValueError(
                    "Chat message content cannot be empty."
                )

            normalized.append(
                {
                    "role": role,
                    "content": content,
                }
            )

        return normalized

    @staticmethod
    def _validate_generation_options(
        *,
        temperature: float,
        max_tokens: int,
    ) -> None:
        if not 0.0 <= temperature <= 2.0:
            raise ValueError(
                "Temperature must be between 0 and 2."
            )

        if max_tokens <= 0:
            raise ValueError(
                "Maximum output tokens must be greater than zero."
            )


@lru_cache(maxsize=1)
def get_azure_openai_chat_service(
) -> AzureOpenAIChatService:
    return AzureOpenAIChatService()