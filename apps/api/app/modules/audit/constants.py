from enum import Enum


class AuditAction(str, Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"

    ORGANIZATION_CREATED = "organization_created"
    ORGANIZATION_UPDATED = "organization_updated"
    MEMBER_ADDED = "member_added"
    MEMBER_UPDATED = "member_updated"
    MEMBER_REMOVED = "member_removed"

    PROJECT_CREATED = "project_created"
    PROJECT_UPDATED = "project_updated"
    PROJECT_DELETED = "project_deleted"

    KNOWLEDGE_BASE_CREATED = "knowledge_base_created"
    KNOWLEDGE_BASE_UPDATED = "knowledge_base_updated"
    KNOWLEDGE_BASE_DELETED = "knowledge_base_deleted"

    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_INDEXED = "document_indexed"
    DOCUMENT_DELETED = "document_deleted"

    CHAT_MESSAGE_SENT = "chat_message_sent"
    CONVERSATION_CREATED = "conversation_created"
    CONVERSATION_DELETED = "conversation_deleted"

    AGENT_RUN_STARTED = "agent_run_started"
    AGENT_RUN_COMPLETED = "agent_run_completed"
    AGENT_RUN_FAILED = "agent_run_failed"
    AGENT_RUN_DELETED = "agent_run_deleted"

    EVALUATION_RUN = "evaluation_run"

    SETTINGS_UPDATED = "settings_updated"
    API_KEY_CREATED = "api_key_created"
    API_KEY_REVOKED = "api_key_revoked"


class AuditResourceType(str, Enum):
    USER = "user"
    ORGANIZATION = "organization"
    MEMBERSHIP = "membership"
    PROJECT = "project"
    KNOWLEDGE_BASE = "knowledge_base"
    DOCUMENT = "document"
    CONVERSATION = "conversation"
    MESSAGE = "message"
    AGENT_RUN = "agent_run"
    EVALUATION = "evaluation"
    SETTINGS = "settings"
    API_KEY = "api_key"
    PLATFORM = "platform"


class AuditEventStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    PENDING = "pending"