"""Base repository pattern for owned resources enforcing data isolation queries."""
from typing import Generic, TypeVar, Type, List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.identity.models import User
from app.core.access.policy import ResourcePolicy, _get_user_dept_ids, _get_user_roles
from app.core.errors import NotFoundError

T = TypeVar("T")


class OwnedResourceRepository(Generic[T]):
    """
    Base repository providing tenant- and user-isolated query filters.
    Encapsulates database isolation logic away from route handlers and services.
    """

    def __init__(self, model_class: Type[T], policy: ResourcePolicy):
        self.model_class = model_class
        self.policy = policy

    async def get_by_id(
        self,
        db: AsyncSession,
        resource_id: str,
        current_user: User,
        resource_name: str = "Resource"
    ) -> T:
        """Retrieves resource by ID and enforces policy authorization, returning 404 on violation."""
        stmt = select(self.model_class).where(getattr(self.model_class, "id") == resource_id)
        res = await db.execute(stmt)
        instance = res.scalar_one_or_none()
        if not instance:
            raise NotFoundError(f"{resource_name} not found.")

        # Authorize through policy (raises NotFoundError on failure)
        self.policy.authorize_read(current_user, instance, resource_name=resource_name)
        return instance

    async def list_owned(
        self,
        db: AsyncSession,
        current_user: User,
        limit: int = 50,
        offset: int = 0
    ) -> List[T]:
        """Lists resources strictly owned by current user."""
        owner_col = getattr(self.model_class, "owner_id", None) or getattr(self.model_class, "user_id")
        stmt = (
            select(self.model_class)
            .where(owner_col == current_user.id)
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())
