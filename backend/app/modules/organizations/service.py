from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import NotFoundError, ConflictError
from app.modules.organizations.models import Department
from app.modules.organizations.schemas import DepartmentCreate, DepartmentUpdate


class OrganizationService:
    @staticmethod
    async def get_departments(db: AsyncSession, active_only: bool = False) -> List[Department]:
        query = select(Department)
        if active_only:
            query = query.where(Department.is_active == True)
        result = await db.execute(query.order_by(Department.name))
        return list(result.scalars().all())

    @staticmethod
    async def get_department_by_id(db: AsyncSession, department_id: str) -> Department:
        result = await db.execute(select(Department).where(Department.id == department_id))
        dept = result.scalar_one_or_none()
        if not dept:
            raise NotFoundError(message=f"Department with ID '{department_id}' not found")
        return dept

    @staticmethod
    async def get_department_by_code(db: AsyncSession, code: str) -> Optional[Department]:
        result = await db.execute(select(Department).where(Department.code == code))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_department(db: AsyncSession, data: DepartmentCreate) -> Department:
        existing = await OrganizationService.get_department_by_code(db, data.code)
        if existing:
            raise ConflictError(message=f"Department with code '{data.code}' already exists")
        
        dept = Department(
            code=data.code,
            name=data.name,
            description=data.description,
            is_active=data.is_active
        )
        db.add(dept)
        await db.commit()
        await db.refresh(dept)
        return dept
