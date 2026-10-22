from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditEventCreate(BaseModel):
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    status: str = "SUCCESS"
    details: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    request_id: Optional[str] = None


class AuditEventResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    status: str
    details: Dict[str, Any]
    ip_address: Optional[str]
    request_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
