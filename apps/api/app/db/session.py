from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


engine: Engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides one database session per request.
    """

    database_session = SessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()


def check_database_connection() -> bool:
    """
    Execute a lightweight query to verify PostgreSQL connectivity.
    """

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar_one() == 1


def close_database_engine() -> None:
    """
    Dispose all pooled database connections during shutdown.
    """

    engine.dispose()