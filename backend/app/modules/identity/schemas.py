from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class PermissionResponse(BaseModel):
    id: str
    code: str
    description: Optional[str] = None
    module: str

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    primary_department_id: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role_codes: List[str] = []


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    primary_department_id: Optional[str] = None
    is_active: Optional[bool] = None
    role_codes: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    primary_department_id: Optional[str] = None
    is_active: bool
    is_verified: bool
    roles: List[RoleResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DemoLoginRequest(BaseModel):
    role_code: str
