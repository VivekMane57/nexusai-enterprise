from enum import Enum


class AgentType(str, Enum):
    FINANCIAL_ANALYST = "financial_analyst"
    RISK_ANALYST = "risk_analyst"
    COMPLIANCE_REVIEWER = "compliance_reviewer"
    DOCUMENT_RESEARCHER = "document_researcher"
    EXECUTIVE_SUMMARY = "executive_summary"


class AgentRunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentStepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentStepType(str, Enum):
    PLANNING = "planning"
    RETRIEVAL = "retrieval"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    CITATION = "citation"
    VALIDATION = "validation"