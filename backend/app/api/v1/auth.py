from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.errors import ForbiddenError
from app.modules.identity.models import User
from app.modules.identity.schemas import LoginRequest, DemoLoginRequest, TokenResponse, UserResponse
from app.modules.identity.service import IdentityService
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])


@router.post("/login", response_model=TokenResponse, summary="User Password Login")
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticates a user with email and password and returns a JWT token."""
    token_response = await IdentityService.authenticate_user(db, payload.email, payload.password)
    
    # Audit successful login
    await AuditService.log_event(
        db,
        AuditEventCreate(
            user_id=token_response.user.id,
            action="AUTH_LOGIN_SUCCESS",
            resource_type="user",
            resource_id=token_response.user.id,
            details={"email": payload.email},
            ip_address=request.client.host if request.client else None,
            request_id=request.headers.get("x-request-id"),
        )
    )
    return token_response


@router.post("/demo-login", response_model=TokenResponse, summary="Development Demo Fast Login")
async def demo_login(payload: DemoLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Allows one-click demo login as specific institutional roles in development mode."""
    if not settings.DEMO_MODE_ENABLED:
        raise ForbiddenError(message="Demo mode login is disabled in this environment")

    token_response = await IdentityService.demo_login_by_role(db, payload.role_code)
    
    # Audit demo login
    await AuditService.log_event(
        db,
        AuditEventCreate(
            user_id=token_response.user.id,
            action="AUTH_DEMO_LOGIN",
            resource_type="user",
            resource_id=token_response.user.id,
            details={"role": payload.role_code, "email": token_response.user.email},
            ip_address=request.client.host if request.client else None,
            request_id=request.headers.get("x-request-id"),
        )
    )
    return token_response


@router.get("/me", response_model=UserResponse, summary="Get Current Authenticated User")
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user identity profile, roles, and granted permissions."""
    return current_user
