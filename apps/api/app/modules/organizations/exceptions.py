from app.core.exceptions import ApplicationError


class OrganizationNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Organization was not found.",
            status_code=404,
            error_code="ORGANIZATION_NOT_FOUND",
        )


class OrganizationAccessDeniedError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "You do not have permission to perform this action.",
            status_code=403,
            error_code="ORGANIZATION_ACCESS_DENIED",
        )


class OrganizationSlugConflictError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "An organization with this name already exists.",
            status_code=409,
            error_code="ORGANIZATION_SLUG_CONFLICT",
        )


class MemberAlreadyExistsError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "The user is already a member of this organization.",
            status_code=409,
            error_code="MEMBER_ALREADY_EXISTS",
        )


class OrganizationMemberNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "Organization member was not found.",
            status_code=404,
            error_code="ORGANIZATION_MEMBER_NOT_FOUND",
        )


class MemberUserNotFoundError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "No registered user exists with this email.",
            status_code=404,
            error_code="MEMBER_USER_NOT_FOUND",
        )


class OwnerMembershipModificationError(ApplicationError):
    def __init__(self) -> None:
        super().__init__(
            "The organization owner's membership cannot be modified.",
            status_code=400,
            error_code="OWNER_MEMBERSHIP_PROTECTED",
        )