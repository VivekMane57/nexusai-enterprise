from fastapi import APIRouter

from app.modules.auth.router import (
    router as auth_router,
)
from app.modules.chat.history_router import (
    conversations_router,
    knowledge_base_conversations_router,
)
from app.modules.chat.router import (
    router as chat_router,
)
from app.modules.chat.stream_router import (
    router as stream_router,
)
from app.modules.documents.router import (
    documents_router,
    knowledge_base_documents_router,
)
from app.modules.knowledge_bases.router import (
    knowledge_bases_router,
    project_knowledge_bases_router,
)
from app.modules.organizations.router import (
    router as organizations_router,
)
from app.modules.projects.router import (
    organization_projects_router,
    projects_router,
)
from app.modules.retrieval.router import (
    router as retrieval_router,
)
from app.modules.users.router import (
    router as users_router,
)


api_v1_router = APIRouter()


# =========================================================
# Authentication and users
# =========================================================
api_v1_router.include_router(
    auth_router
)

api_v1_router.include_router(
    users_router
)


# =========================================================
# Organizations and memberships
# =========================================================
api_v1_router.include_router(
    organizations_router
)


# =========================================================
# Projects
# =========================================================
api_v1_router.include_router(
    organization_projects_router
)

api_v1_router.include_router(
    projects_router
)


# =========================================================
# Knowledge bases
# =========================================================
api_v1_router.include_router(
    project_knowledge_bases_router
)

api_v1_router.include_router(
    knowledge_bases_router
)


# =========================================================
# Documents
# =========================================================
api_v1_router.include_router(
    knowledge_base_documents_router
)

api_v1_router.include_router(
    documents_router
)


# =========================================================
# Retrieval
# =========================================================
api_v1_router.include_router(
    retrieval_router
)


# =========================================================
# Grounded RAG Chat
# =========================================================
api_v1_router.include_router(
    chat_router
)


# =========================================================
# Persistent Conversations
# =========================================================
api_v1_router.include_router(
    knowledge_base_conversations_router
)

api_v1_router.include_router(
    conversations_router
)


# =========================================================
# Streaming Chat (Server Sent Events)
# =========================================================
api_v1_router.include_router(
    stream_router
)


# =========================================================
# Platform Status
# =========================================================
@api_v1_router.get(
    "/status",
    tags=["Platform"],
    summary="API v1 status",
)
async def api_status() -> dict[str, str]:
    """
    Return the current API version and availability status.
    """

    return {
        "api_version": "v1",
        "status": "available",
    }