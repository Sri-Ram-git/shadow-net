from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.sync_queue import SyncQueueItem


class SyncRepository(BaseRepository):
    async def create(self, item: SyncQueueItem) -> SyncQueueItem:
        self._session.add(item)
        await self._session.commit()
        await self._session.refresh(item)
        return item

    async def get_all(self) -> list[SyncQueueItem]:
        result = await self._session.execute(
            select(SyncQueueItem).order_by(SyncQueueItem.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_pending(self) -> list[SyncQueueItem]:
        result = await self._session.execute(
            select(SyncQueueItem).where(SyncQueueItem.status == "pending")
            .order_by(SyncQueueItem.created_at.asc())
        )
        return list(result.scalars().all())

    async def update_status(self, item_id: str, status: str) -> None:
        await self._session.execute(
            SyncQueueItem.__table__.update()
            .where(SyncQueueItem.id == item_id)
            .values(status=status)
        )
        await self._session.commit()

    async def increment_retry(self, item_id: str) -> None:
        await self._session.execute(
            SyncQueueItem.__table__.update()
            .where(SyncQueueItem.id == item_id)
            .values(
                retry_count=SyncQueueItem.retry_count + 1,
                status="failed",
            )
        )
        await self._session.commit()

    async def count_pending(self) -> int:
        result = await self._session.execute(
            select(func.count(SyncQueueItem.id))
            .where(SyncQueueItem.status == "pending")
        )
        return result.scalar() or 0

    async def count_total(self) -> int:
        result = await self._session.execute(select(func.count(SyncQueueItem.id)))
        return result.scalar() or 0
