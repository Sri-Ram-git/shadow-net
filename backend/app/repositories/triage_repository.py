from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.ai_triage import AITriage


class TriageRepository(BaseRepository):
    async def create(self, triage: AITriage) -> AITriage:
        self._session.add(triage)
        await self._session.commit()
        await self._session.refresh(triage)
        return triage

    async def get_by_id(self, triage_id: str) -> AITriage | None:
        result = await self._session.execute(
            select(AITriage).where(AITriage.id == triage_id)
        )
        return result.scalar_one_or_none()

    async def get_by_incident_id(self, incident_id: str) -> AITriage | None:
        result = await self._session.execute(
            select(AITriage)
            .where(AITriage.incident_id == incident_id)
            .order_by(AITriage.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[AITriage]:
        result = await self._session.execute(
            select(AITriage).order_by(AITriage.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_unsynced(self) -> list[AITriage]:
        result = await self._session.execute(
            select(AITriage).where(AITriage.synced == False)
        )
        return list(result.scalars().all())

    async def mark_synced(self, triage_id: str) -> None:
        await self._session.execute(
            AITriage.__table__.update()
            .where(AITriage.id == triage_id)
            .values(synced=True)
        )
        await self._session.commit()
