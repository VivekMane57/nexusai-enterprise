from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


Environment = Literal[
    "development",
    "testing",
    "staging",
    "production",
]


class Settings(BaseSettings):
    """
    Central application configuration for NexusAI Enterprise.

    Configuration values are loaded in this order:
    1. Operating-system environment variables
    2. apps/api/.env
    3. Repository root .env
    4. Defaults defined in this class
    """

    model_config = SettingsConfigDict(
        env_file=(
            ".env",
            "../../.env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    # =====================================================
    # Application
    # =====================================================
    app_name: str = "NexusAI Enterprise"
    app_version: str = "0.1.0"
    app_env: Environment = "development"
    debug: bool = False
    log_level: str = "INFO"

    # =====================================================
    # API
    # =====================================================
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_v1_prefix: str = "/api/v1"

    # =====================================================
    # CORS
    # =====================================================
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # =====================================================
    # PostgreSQL
    # =====================================================
    database_url: str = (
        "postgresql+psycopg2://"
        "nexusai:nexusai_dev_password@127.0.0.1:5433/nexusai"
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout: int = 30

    # =====================================================
    # Redis
    # =====================================================
    redis_url: str = "redis://127.0.0.1:6379/0"
    redis_socket_timeout: int = 5

    # =====================================================
    # Qdrant
    # =====================================================
    qdrant_url: str = "http://127.0.0.1:6333"
    qdrant_api_key: SecretStr | None = None
    qdrant_timeout_seconds: float = 5.0

    # =====================================================
    # Local document storage
    # =====================================================
    local_storage_path: str = "storage"
    documents_storage_path: str = "storage/documents"
    temporary_storage_path: str = "storage/temp"

    max_upload_size_mb: int = 20

    allowed_document_extensions: list[str] = [
        ".pdf",
        ".docx",
        ".txt",
    ]

    allowed_document_mime_types: list[str] = [
        "application/pdf",
        (
            "application/vnd.openxmlformats-officedocument."
            "wordprocessingml.document"
        ),
        "text/plain",
    ]

    # =====================================================
    # Authentication
    # =====================================================
    jwt_secret_key: SecretStr = SecretStr(
        "replace-this-with-a-long-random-secret"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # =====================================================
    # Azure OpenAI
    # =====================================================
    azure_openai_endpoint: str | None = None
    azure_openai_api_key: SecretStr | None = None
    azure_openai_api_version: str = "2024-10-21"
    azure_openai_chat_deployment: str | None = None
    azure_openai_embedding_deployment: str | None = None

    # =====================================================
    # Local AI models
    # =====================================================
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    reranker_model: str = (
        "cross-encoder/ms-marco-MiniLM-L-6-v2"
    )

    embedding_batch_size: int = 16

    # =====================================================
    # RAG defaults
    # =====================================================
    default_chunk_size: int = 800
    default_chunk_overlap: int = 120
    dense_retrieval_top_k: int = 20
    final_context_top_k: int = 6

    # =====================================================
    # Environment helpers
    # =====================================================
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def is_testing(self) -> bool:
        return self.app_env == "testing"

    @property
    def docs_url(self) -> str | None:
        return None if self.is_production else "/docs"

    @property
    def redoc_url(self) -> str | None:
        return None if self.is_production else "/redoc"

    @property
    def openapi_url(self) -> str | None:
        return (
            None
            if self.is_production
            else "/openapi.json"
        )

    # =====================================================
    # Derived values
    # =====================================================
    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return one cached Settings instance per application process.
    """

    return Settings()


settings = get_settings()