from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.audit.models import AuditEvent
from app.modules.audit.schemas import AuditEventCreate


class AuditService:
    @staticmethod
    async def log_event(db: AsyncSession, data: AuditEventCreate) -> AuditEvent:
        event = AuditEvent(
            user_id=data.user_id,
            action=data.action,
            resource_type=data.resource_type,
            resource_id=data.resource_id,
            status=data.status,
            details=data.details,
            ip_address=data.ip_address,
            request_id=data.request_id,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def get_events(
        db: AsyncSession,
        limit: int = 50,
        action: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> List[AuditEvent]:
        query = select(AuditEvent)
        if action:
            query = query.where(AuditEvent.action == action)
        if user_id:
            query = query.where(AuditEvent.user_id == user_id)
        
        result = await db.execute(query.order_by(desc(AuditEvent.created_at)).limit(limit))
        return list(result.scalars().all())
