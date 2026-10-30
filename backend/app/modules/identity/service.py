from typing import List, Optional, Dict, Any
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, ConflictError, UnauthorizedError, ForbiddenError, BadRequestError
from app.core.security import get_password_hash, verify_password, create_access_token
from app.modules.identity.models import User, Role, Permission, UserRole
from app.modules.identity.schemas import (
    UserCreate,
    UserUpdate,
    TokenResponse,
    UserResponse,
    UserRegisterRequest,
    UserDirectProvisionRequest,
)


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
    async def get_users(db: AsyncSession, limit: int = 100, offset: int = 0) -> List[User]:
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .order_by(User.full_name)
            .offset(offset)
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
            status = getattr(user, "approval_status", "inactive")
            if status == "pending_tier1":
                raise UnauthorizedError(message="Registration pending approval from Department Head (HOD).")
            elif status == "pending_tier2":
                raise UnauthorizedError(message="Registration pending approval from Platform Administrator.")
            elif status == "rejected":
                reason = f": {user.rejection_reason}" if user.rejection_reason else "."
                raise UnauthorizedError(message=f"Registration request was rejected{reason}")
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
    async def register_user(db: AsyncSession, data: UserRegisterRequest) -> Dict[str, Any]:
        """
        Public self-registration for students, faculty, and department admins.
        Places accounts into 2-tier approval queue:
        - student/faculty: pending_tier1 (HOD approval)
        - dept_admin: pending_tier2 (Platform Admin approval)
        """
        valid_roles = ["student", "faculty", "dept_admin"]
        if data.role_code not in valid_roles:
            raise BadRequestError(message=f"Invalid registration role. Allowed roles: {', '.join(valid_roles)}")

        if not data.registration_number or not data.registration_number.strip():
            raise BadRequestError(message="Registration number (PRN or Employee ID) is required")

        existing = await IdentityService.get_user_by_email(db, data.email)
        if existing:
            raise ConflictError(message=f"User with email '{data.email}' already exists")

        # Verify department exists
        from app.modules.organizations.models import Department
        dept_res = await db.execute(select(Department).where(Department.id == data.department_id))
        dept = dept_res.scalar_one_or_none()
        if not dept:
            raise NotFoundError(message=f"Department with ID '{data.department_id}' not found")

        # Determine Tier
        if data.role_code == "dept_admin":
            approval_status = "pending_tier2"
        else:
            approval_status = "pending_tier1"

        hashed_password = get_password_hash(data.password)
        new_user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hashed_password,
            primary_department_id=dept.id,
            is_active=False,
            is_verified=True,
            approval_status=approval_status,
            registration_number=data.registration_number.strip(),
        )
        db.add(new_user)
        await db.flush()

        # Assign requested role
        role_res = await db.execute(select(Role).where(Role.code == data.role_code))
        role = role_res.scalar_one_or_none()
        if role:
            user_role = UserRole(user_id=new_user.id, role_id=role.id)
            db.add(user_role)

        await db.commit()
        await db.refresh(new_user)

        return {
            "message": (
                "Registration submitted successfully. "
                "Your account is pending institutional approval before you can sign in."
            ),
            "user_id": new_user.id,
            "email": new_user.email,
            "role": data.role_code,
            "department": dept.name,
            "approval_status": approval_status,
        }

    @staticmethod
    async def get_pending_approvals(db: AsyncSession, current_user: User) -> List[UserResponse]:
        """
        Fetches pending user registration requests:
        - Platform Admin: sees all pending registrations (tier 1 and tier 2)
        - Dept Admin (HOD): sees ONLY tier 1 requests for their primary department
        """
        user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
        is_global_admin = "platform_admin" in user_roles
        is_dept_admin = "dept_admin" in user_roles

        if not is_global_admin and not is_dept_admin:
            raise ForbiddenError(message="You do not have permission to view institutional approval queues")

        stmt = select(User).options(selectinload(User.roles).selectinload(Role.permissions))

        if is_global_admin:
            stmt = stmt.where(User.approval_status.in_(["pending_tier1", "pending_tier2"]))
        else:
            # Strictly scoped to HOD's department and Tier 1
            dept_id = getattr(current_user, "primary_department_id", None)
            stmt = stmt.where(
                User.approval_status == "pending_tier1",
                User.primary_department_id == dept_id
            )

        stmt = stmt.order_by(User.created_at.desc())
        res = await db.execute(stmt)
        users = res.scalars().all()
        return [UserResponse.model_validate(u) for u in users]

    @staticmethod
    async def review_user_approval(
        db: AsyncSession,
        target_user_id: str,
        action: str,
        reason: Optional[str],
        current_user: User
    ) -> Dict[str, Any]:
        """
        Reviews a pending user registration request:
        - HOD approves/rejects Tier 1 applicants in their department
        - Platform Admin approves/rejects Tier 2 (HODs) or Tier 1
        """
        user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
        is_global_admin = "platform_admin" in user_roles
        is_dept_admin = "dept_admin" in user_roles

        if not is_global_admin and not is_dept_admin:
            raise ForbiddenError(message="You do not have permission to review user registrations")

        target_user = await IdentityService.get_user_by_id(db, target_user_id)

        if target_user.approval_status not in ["pending_tier1", "pending_tier2"]:
            raise BadRequestError(message=f"User is not in a pending approval state (current: {target_user.approval_status})")

        # Dept Admin checks: can only review their department and Tier 1
        if not is_global_admin:
            if target_user.approval_status != "pending_tier1":
                raise ForbiddenError(message="Department administrators can only review Tier 1 (department) requests")
            if target_user.primary_department_id != current_user.primary_department_id:
                raise ForbiddenError(message="Cannot review registrations outside of your department")

        if action.lower() == "approve":
            prior_status = target_user.approval_status
            target_user.approval_status = "approved"
            target_user.is_active = True
            if prior_status == "pending_tier1":
                target_user.tier1_approved_by = current_user.id
            else:
                target_user.tier2_approved_by = current_user.id
            target_user.rejection_reason = None
            msg = f"User '{target_user.full_name}' was successfully approved."
        elif action.lower() == "bypass":
            if not is_global_admin:
                raise ForbiddenError(message="Only Platform Administrators can execute administrative break-glass bypass")
            target_user.approval_status = "approved"
            target_user.is_active = True
            target_user.is_bypassed = True
            target_user.bypass_reason = reason or "Administrative Emergency Override"
            target_user.tier1_approved_by = current_user.id
            target_user.rejection_reason = None
            msg = f"User '{target_user.full_name}' was cleared via Administrative Break-Glass Bypass."
        elif action.lower() == "reject":
            target_user.approval_status = "rejected"
            target_user.is_active = False
            target_user.rejection_reason = reason or "Institutional requirements not met"
            msg = f"User '{target_user.full_name}' registration was rejected."
        else:
            raise BadRequestError(message=f"Invalid approval action '{action}'. Must be 'approve', 'reject', or 'bypass'.")

        await db.commit()
        await db.refresh(target_user)

        return {
            "message": msg,
            "user_id": target_user.id,
            "full_name": target_user.full_name,
            "approval_status": target_user.approval_status,
            "is_active": target_user.is_active,
            "is_bypassed": target_user.is_bypassed,
            "bypass_reason": target_user.bypass_reason,
        }

    @staticmethod
    async def direct_provision_user(
        db: AsyncSession,
        req: UserDirectProvisionRequest,
        current_user: User
    ) -> UserResponse:
        """
        Directly provisions a pre-cleared institutional user (skipping registration queue).
        - Platform Admin: can provision any role across any department
        - HOD: can provision Student or Faculty for their own department only
        """
        user_roles = [r.code for r in current_user.roles] if hasattr(current_user, "roles") else []
        is_global_admin = "platform_admin" in user_roles
        is_dept_admin = "dept_admin" in user_roles

        if not is_global_admin and not is_dept_admin:
            raise ForbiddenError(message="You do not have permission to provision users directly")

        target_dept_id = req.department_id
        if not is_global_admin:
            target_dept_id = current_user.primary_department_id
            if req.role_code not in ["student", "faculty"]:
                raise ForbiddenError(message="Department administrators can only provision students and faculty")

        # Validate duplicate email
        existing = await IdentityService.get_user_by_email(db, req.email)
        if existing:
            raise ConflictError(message=f"An account with email '{req.email}' already exists")

        # Resolve role
        role_res = await db.execute(select(Role).where(Role.code == req.role_code))
        target_role = role_res.scalar_one_or_none()
        if not target_role:
            raise NotFoundError(message=f"Role '{req.role_code}' does not exist")

        new_user = User(
            email=req.email.lower().strip(),
            full_name=req.full_name.strip(),
            hashed_password=get_password_hash(req.password),
            primary_department_id=target_dept_id,
            is_active=True,
            is_verified=True,
            approval_status="approved",
            registration_number=req.registration_number.strip() if req.registration_number else None,
            tier1_approved_by=current_user.id,
            is_bypassed=True,
            bypass_reason=req.provision_reason or "Direct Administrative Provisioning"
        )
        db.add(new_user)
        await db.flush()

        user_role = UserRole(user_id=new_user.id, role_id=target_role.id)
        db.add(user_role)
        await db.commit()

        return await IdentityService.get_user_by_id(db, new_user.id)

    @staticmethod
    async def demo_login_by_role(db: AsyncSession, role_code: str) -> TokenResponse:
        # Find canonical first active user with this role
        result = await db.execute(
            select(User)
            .join(User.roles)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(Role.code == role_code)
            .where(User.is_active == True)
            .order_by(User.created_at.asc())
        )
        user = result.scalars().first()
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
