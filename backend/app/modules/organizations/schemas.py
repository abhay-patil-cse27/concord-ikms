from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
