from datetime import datetime, timezone
import json
import logging
from app.services.base import BaseService
from app.models.sync_queue import SyncQueueItem

logger = logging.getLogger(__name__)


class SyncService(BaseService):
    async def get_queue(self) -> list[SyncQueueItem]:
        return await self.sync_repo.get_all()

    async def trigger_sync(self) -> dict:
        pending = await self.sync_repo.get_pending()
        synced_count = 0

        for item in pending:
            try:
                success = await self._sync_item(item)
                if success:
                    await self.sync_repo.update_status(item.id, "synced")
                    synced_count += 1
                else:
                    await self.sync_repo.increment_retry(item.id)
            except Exception as e:
                logger.error(f"Sync failed for {item.id}: {e}")
                await self.sync_repo.increment_retry(item.id)

        await self.audit_repo.log(
            action="sync.triggered",
            entity_type="sync",
            details=f"Synced {synced_count} items, {len(pending) - synced_count} failed",
        )

        return {"message": f"Synced {synced_count} items", "synced": synced_count}

    async def _sync_item(self, item: SyncQueueItem) -> bool:
        """Simulate syncing to cloud. In production, this would call a cloud API."""
        import asyncio
        await asyncio.sleep(0.1)
        logger.info(f"Synced {item.entity_type}:{item.entity_id}")
        return True

    async def enqueue(self, entity_type: str, entity_id: str, action: str, payload: dict | None = None) -> SyncQueueItem:
        item = SyncQueueItem(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload=json.dumps(payload) if payload else None,
        )
        return await self.sync_repo.create(item)
