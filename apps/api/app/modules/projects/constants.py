from enum import Enum


class ProjectEnvironment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"