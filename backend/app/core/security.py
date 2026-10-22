from datetime import datetime, timedelta, timezone
from typing import Optional, List, Callable
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.errors import UnauthorizedError, ForbiddenError
from app.modules.identity.models import User

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(message="Authentication token has expired")
    except (jwt.InvalidTokenError, Exception) as exc:
        raise UnauthorizedError(message=f"Invalid authentication token: {str(exc)}")


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        raise UnauthorizedError(message="Authentication credentials were not provided")
    
    payload = decode_access_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise UnauthorizedError(message="Token payload is missing subject claim")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError(message="User associated with this token does not exist")
    if not user.is_active:
        raise ForbiddenError(message="User account is inactive or disabled")

    return user


def require_role(required_role: str) -> Callable:
    """Dependency factory that verifies the current user has the specified role."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.code for r in current_user.roles]
        if "platform_admin" in user_roles:
            return current_user  # Platform admin has superuser capability

        if required_role not in user_roles:
            raise ForbiddenError(
                message=f"User lacks required role '{required_role}'",
                details={"required_role": required_role, "assigned_roles": user_roles}
            )
        return current_user

    return role_checker


def require_permission(required_permission: str) -> Callable:
    """Dependency factory that verifies the current user has the specified permission."""
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # Collect permissions across all assigned roles
        user_roles = [r.code for r in current_user.roles]
        if "platform_admin" in user_roles:
            return current_user  # Superuser bypass for platform administration

        permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                permissions.add(perm.code)

        if required_permission not in permissions:
            raise ForbiddenError(
                message=f"User lacks required permission '{required_permission}'",
                details={"required_permission": required_permission, "granted_permissions": list(permissions)}
            )
        return current_user

    return permission_checker
