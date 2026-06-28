from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.audit_log import AuditLog


class AuditRepository(BaseRepository):
    async def log(self, action: str, entity_type: str, entity_id: str | None = None, details: str | None = None, user: str = "system") -> AuditLog:
        entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            user=user,
        )
        self._session.add(entry)
        await self._session.commit()
        await self._session.refresh(entry)
        return entry

    async def get_all(self, limit: int = 100) -> list[AuditLog]:
        result = await self._session.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_unsynced(self) -> list[AuditLog]:
        result = await self._session.execute(
            select(AuditLog).where(AuditLog.synced == False)
        )
        return list(result.scalars().all())

    async def mark_synced(self, log_id: str) -> None:
        await self._session.execute(
            AuditLog.__table__.update()
            .where(AuditLog.id == log_id)
            .values(synced=True)
        )
        await self._session.commit()
