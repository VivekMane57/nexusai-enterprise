from enum import Enum


class KnowledgeBaseStatus(str, Enum):
    ACTIVE = "active"
    PROCESSING = "processing"
    FAILED = "failed"
    ARCHIVED = "archived"


class ChunkingStrategy(str, Enum):
    RECURSIVE = "recursive"
    SEMANTIC = "semantic"