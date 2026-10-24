"""SOLID Access Policy & Resource Ownership Layer.

Interface Segregation & Single Responsibility:
- Readable, Writable, Deletable: granular policy interfaces
- ResourcePolicy: unified base policy contract
- Specific policies for Conversation, Document, Audit, User
- Deny by default: unhandled permissions return False
- Returns 404 (NotFoundError) on unauthorized object access to prevent ID probing / enumeration
"""
from abc import ABC, abstractmethod
from typing import Any, Optional, Protocol, runtime_checkable, List
from app.modules.identity.models import User
from app.core.errors import NotFoundError, ForbiddenError


@runtime_checkable
class Readable(Protocol):
    def can_read(self, user: User, resource: Any) -> bool:
        ...


@runtime_checkable
class Writable(Protocol):
    def can_write(self, user: User, resource: Any) -> bool:
        ...


@runtime_checkable
class Deletable(Protocol):
    def can_delete(self, user: User, resource: Any) -> bool:
        ...


class ResourcePolicy(ABC):
    """Abstract Base Policy enforcing Deny-By-Default."""

    @abstractmethod
    def can_read(self, user: User, resource: Any) -> bool:
        return False

    @abstractmethod
    def can_write(self, user: User, resource: Any) -> bool:
        return False

    @abstractmethod
    def can_delete(self, user: User, resource: Any) -> bool:
        return False

    def authorize_read(self, user: User, resource: Any, resource_name: str = "Resource") -> None:
        """Denies access by raising NotFoundError (404) to prevent ID probing."""
        if not self.can_read(user, resource):
            raise NotFoundError(f"{resource_name} not found.")

    def authorize_write(self, user: User, resource: Any, resource_name: str = "Resource") -> None:
        if not self.can_write(user, resource):
            raise NotFoundError(f"{resource_name} not found.")

    def authorize_delete(self, user: User, resource: Any, resource_name: str = "Resource") -> None:
        if not self.can_delete(user, resource):
            raise NotFoundError(f"{resource_name} not found.")


def _get_user_roles(user: User) -> List[str]:
    return [r.code for r in getattr(user, "roles", [])]


def _get_user_dept_ids(user: User) -> List[str]:
    depts = []
    if getattr(user, "primary_department_id", None):
        depts.append(user.primary_department_id)
    if hasattr(user, "memberships"):
        for m in user.memberships:
            if m.department_id not in depts:
                depts.append(m.department_id)
    return depts


class ConversationPolicy(ResourcePolicy):
    """
    Policy for Chat Threads and Messages.
    Rules:
    - Private: Owner only.
    - Admin DOES NOT read private user chat content (only owner can read).
    - Returns 404 on access by non-owner to prevent thread ID probing.
    """

    def can_read(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        owner_id = getattr(resource, "owner_id", None) or getattr(resource, "user_id", None)
        visibility = getattr(resource, "visibility", "private")

        # Owner has full read access
        if owner_id == user.id:
            return True

        # If explicitly marked public
        if visibility == "public":
            return True

        # If department-shared, user must be a member of that department
        if visibility == "department":
            res_dept = getattr(resource, "department_id", None)
            if res_dept and res_dept in _get_user_dept_ids(user):
                return True

        # Sensitive chats: Admin cannot read private chat messages of another user
        return False

    def can_write(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        owner_id = getattr(resource, "owner_id", None) or getattr(resource, "user_id", None)
        return owner_id == user.id

    def can_delete(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        owner_id = getattr(resource, "owner_id", None) or getattr(resource, "user_id", None)
        return owner_id == user.id


class DocumentPolicy(ResourcePolicy):
    """
    Policy for Institutional Documents and Chunks.
    Rules:
    - Public: any authenticated user can read.
    - Department: members of the same department or platform_admin can read.
    - Private: owner or platform_admin.
    - Write / Delete: uploader/owner, department admin (for department docs), or platform_admin.
    """

    def can_read(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        roles = _get_user_roles(user)
        if "platform_admin" in roles:
            return True

        visibility = getattr(resource, "visibility", "department")
        owner_id = getattr(resource, "owner_id", None) or getattr(resource, "uploader_id", None)

        if owner_id == user.id:
            return True

        if visibility == "public":
            return True

        if visibility == "department":
            doc_dept = getattr(resource, "department_id", None)
            return doc_dept in _get_user_dept_ids(user)

        return False

    def can_write(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        roles = _get_user_roles(user)
        if "platform_admin" in roles:
            return True

        owner_id = getattr(resource, "owner_id", None) or getattr(resource, "uploader_id", None)
        if owner_id == user.id:
            return True

        if "dept_admin" in roles:
            doc_dept = getattr(resource, "department_id", None)
            return doc_dept in _get_user_dept_ids(user)

        return False

    def can_delete(self, user: User, resource: Any) -> bool:
        return self.can_write(user, resource)


class AuditLogPolicy(ResourcePolicy):
    """
    Policy for Security Audit Records.
    Rules:
    - Platform admin only. Sensitive security logs are never exposed to lower roles.
    """

    def can_read(self, user: User, resource: Any = None) -> bool:
        roles = _get_user_roles(user)
        return "platform_admin" in roles

    def can_write(self, user: User, resource: Any = None) -> bool:
        return False  # Audit logs are append-only by the system

    def can_delete(self, user: User, resource: Any = None) -> bool:
        return False  # Immutable ledger


class UserProfilePolicy(ResourcePolicy):
    """
    Policy for User accounts & profiles.
    Rules:
    - Self: can read own profile.
    - Platform admin: can list and inspect any user profile.
    - Lower roles: listing returns only self or is blocked with 404/empty.
    """

    def can_read(self, user: User, resource: Any) -> bool:
        if not resource:
            return False
        roles = _get_user_roles(user)
        if "platform_admin" in roles:
            return True
        target_id = getattr(resource, "id", None)
        return target_id == user.id

    def can_write(self, user: User, resource: Any) -> bool:
        roles = _get_user_roles(user)
        return "platform_admin" in roles

    def can_delete(self, user: User, resource: Any) -> bool:
        roles = _get_user_roles(user)
        return "platform_admin" in roles


# Dependency Injection Singletons
conversation_policy = ConversationPolicy()
document_policy = DocumentPolicy()
audit_policy = AuditLogPolicy()
user_policy = UserProfilePolicy()


def get_conversation_policy() -> ConversationPolicy:
    return conversation_policy


def get_document_policy() -> DocumentPolicy:
    return document_policy


def get_audit_policy() -> AuditLogPolicy:
    return audit_policy


def get_user_policy() -> UserProfilePolicy:
    return user_policy
