from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from app.repositories.base import BaseRepository
from app.models.audit_log import AuditLog


class AuditRepository(BaseRepository):
    async def log(
        self,
        action: str,
        user_id: str | None = None,
        resource: str | None = None,
        resource_id: str | None = None,
        entity_type: str | None = None,
        entity_id: str | None = None,
        details: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata_json: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata_json,
        )
        self._session.add(entry)
        await self._session.commit()
        return entry

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[AuditLog]:
        result = await self._session.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: str, limit: int = 50) -> list[AuditLog]:
        result = await self._session.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_unsynced(self) -> list[AuditLog]:
        result = await self._session.execute(
            select(AuditLog).where(AuditLog.synced == False)
        )
        return list(result.scalars().all())

    async def count_since(self, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count(AuditLog.id)).where(AuditLog.created_at >= since)
        )
        return result.scalar() or 0

    async def mark_synced(self, log_id: str) -> None:
        await self._session.execute(
            AuditLog.__table__.update()
            .where(AuditLog.id == log_id)
            .values(synced=True)
        )
        await self._session.commit()
