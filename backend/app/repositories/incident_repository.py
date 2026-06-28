from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.incident import Incident


class IncidentRepository(BaseRepository):
    async def create(self, incident: Incident) -> Incident:
        self._session.add(incident)
        await self._session.commit()
        await self._session.refresh(incident)
        return incident

    async def get_by_id(self, incident_id: str) -> Incident | None:
        result = await self._session.execute(
            select(Incident).where(Incident.id == incident_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[Incident]:
        result = await self._session.execute(
            select(Incident).order_by(Incident.timestamp.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 10) -> list[Incident]:
        result = await self._session.execute(
            select(Incident).order_by(Incident.timestamp.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, incident: Incident) -> Incident:
        await self._session.commit()
        await self._session.refresh(incident)
        return incident

    async def count(self) -> int:
        result = await self._session.execute(select(func.count(Incident.id)))
        return result.scalar() or 0

    async def count_by_severity(self) -> dict[str, int]:
        result = await self._session.execute(
            select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
        )
        return {row.severity: row.count for row in result}

    async def count_by_category(self) -> dict[str, int]:
        result = await self._session.execute(
            select(Incident.category, func.count(Incident.id)).group_by(Incident.category)
        )
        return {row.category: row.count for row in result}

    async def count_critical(self) -> int:
        result = await self._session.execute(
            select(func.count(Incident.id)).where(Incident.severity == "P1")
        )
        return result.scalar() or 0

    async def get_unsynced(self) -> list[Incident]:
        result = await self._session.execute(
            select(Incident).where(Incident.synced == False)
        )
        return list(result.scalars().all())

    async def mark_synced(self, incident_id: str) -> None:
        await self._session.execute(
            Incident.__table__.update()
            .where(Incident.id == incident_id)
            .values(synced=True)
        )
        await self._session.commit()
