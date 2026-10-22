from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_permission
from app.modules.identity.models import User
from app.modules.organizations.schemas import DepartmentResponse, DepartmentCreate
from app.modules.organizations.service import OrganizationService
from app.modules.audit.service import AuditService
from app.modules.audit.schemas import AuditEventCreate

router = APIRouter(prefix="/organizations", tags=["Organizations & Departments"])


@router.get("/departments", response_model=List[DepartmentResponse], summary="List Departments")
async def list_departments(
    active_only: bool = False,
    current_user: User = Depends(require_permission("departments:read")),
    db: AsyncSession = Depends(get_db)
):
    """Lists institutional departments. Requires 'departments:read' permission."""
    return await OrganizationService.get_departments(db, active_only=active_only)


@router.post("/departments", response_model=DepartmentResponse, summary="Create Department")
async def create_department(
    payload: DepartmentCreate,
    request: Request,
    current_user: User = Depends(require_permission("departments:write")),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new institutional department. Requires 'departments:write' permission."""
    dept = await OrganizationService.create_department(db, payload)

    await AuditService.log_event(
        db,
        AuditEventCreate(
            user_id=current_user.id,
            action="DEPARTMENT_CREATED",
            resource_type="department",
            resource_id=dept.id,
            details={"code": dept.code, "name": dept.name},
            ip_address=request.client.host if request.client else None,
            request_id=request.headers.get("x-request-id"),
        )
    )
    return dept
