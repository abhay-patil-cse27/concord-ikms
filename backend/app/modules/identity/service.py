from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, ConflictError, UnauthorizedError
from app.core.security import get_password_hash, verify_password, create_access_token
from app.modules.identity.models import User, Role, Permission, UserRole
from app.modules.identity.schemas import UserCreate, UserUpdate, TokenResponse, UserResponse


class IdentityService:
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> User:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(message=f"User with ID '{user_id}' not found")
        return user

    @staticmethod
    async def get_users(db: AsyncSession, limit: int = 100) -> List[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .order_by(User.full_name)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_user(db: AsyncSession, data: UserCreate) -> User:
        existing = await IdentityService.get_user_by_email(db, data.email)
        if existing:
            raise ConflictError(message=f"User with email '{data.email}' already exists")

        hashed_password = get_password_hash(data.password)
        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hashed_password,
            primary_department_id=data.primary_department_id,
            is_active=data.is_active,
            is_verified=True,
        )
        db.add(user)
        await db.flush()

        # Assign roles
        if data.role_codes:
            for code in data.role_codes:
                role_res = await db.execute(select(Role).where(Role.code == code))
                role = role_res.scalar_one_or_none()
                if role:
                    user_role = UserRole(user_id=user.id, role_id=role.id)
                    db.add(user_role)

        await db.commit()
        return await IdentityService.get_user_by_id(db, user.id)

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> TokenResponse:
        user = await IdentityService.get_user_by_email(db, email)
        if not user:
            raise UnauthorizedError(message="Invalid email or password")
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedError(message="Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError(message="Account is inactive")

        roles = [r.code for r in user.roles]
        token_data = {
            "sub": user.id,
            "email": user.email,
            "roles": roles,
            "department_id": user.primary_department_id,
        }
        access_token = create_access_token(token_data)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    async def demo_login_by_role(db: AsyncSession, role_code: str) -> TokenResponse:
        # Find first active user with this role
        result = await db.execute(
            select(User)
            .join(User.roles)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(Role.code == role_code)
            .where(User.is_active == True)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(message=f"No active demo account found for role '{role_code}'")

        roles = [r.code for r in user.roles]
        token_data = {
            "sub": user.id,
            "email": user.email,
            "roles": roles,
            "department_id": user.primary_department_id,
        }
        access_token = create_access_token(token_data)
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
