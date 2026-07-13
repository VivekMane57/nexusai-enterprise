from enum import Enum


class OrganizationRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    AI_ENGINEER = "ai_engineer"
    REVIEWER = "reviewer"
    VIEWER = "viewer"


class OrganizationStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class MembershipStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"