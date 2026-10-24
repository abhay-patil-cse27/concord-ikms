from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_permission
from app.modules.identity.models import User
from app.modules.identity.schemas import UserResponse, UserCreate
from app.modules.identity.service import IdentityService
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("", response_model=List[UserResponse], summary="List Institutional Users")
async def list_users(
    limit: int = 50,
    current_user: User = Depends(require_permission("users:read")),
    db: AsyncSession = Depends(get_db)
):
    """Lists institutional users. Platform admins see all users; lower roles see only their own profile."""
    from app.core.access.policy import _get_user_roles
    roles = _get_user_roles(current_user)
    if "platform_admin" in roles:
        return await IdentityService.get_users(db, limit=limit)
    # Non-admin sees only their own profile
    user_res = await IdentityService.get_user_by_id(db, current_user.id)
    return [user_res] if user_res else []


@router.post("", response_model=UserResponse, summary="Create User Account")
async def create_user(
    payload: UserCreate,
    request: Request,
    current_user: User = Depends(require_permission("users:write")),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new institutional user. Requires 'users:write' permission."""
    new_user = await IdentityService.create_user(db, payload)

    await AuditService.log_event(
        db,
        AuditEventCreate(
            user_id=current_user.id,
            action="USER_CREATED",
            resource_type="user",
            resource_id=new_user.id,
            details={"email": new_user.email, "roles": payload.role_codes},
            ip_address=request.client.host if request.client else None,
            request_id=request.headers.get("x-request-id"),
        )
    )
    return new_user
