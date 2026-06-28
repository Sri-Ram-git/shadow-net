from datetime import datetime, timezone
from sqlalchemy import select
from app.models.system_setting import SystemSetting
from app.repositories.base import BaseRepository


class SettingsRepository(BaseRepository):
    async def get(self, key: str) -> str | None:
        result = await self._session.execute(select(SystemSetting).where(SystemSetting.key == key))
        row = result.scalar_one_or_none()
        return row.value if row else None

    async def set(self, key: str, value: str, updated_by: str = "system") -> None:
        result = await self._session.execute(select(SystemSetting).where(SystemSetting.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = value
            row.updated_at = datetime.now(timezone.utc)
            row.updated_by = updated_by
        else:
            self._session.add(SystemSetting(key=key, value=value, updated_by=updated_by))

    async def get_all(self) -> dict[str, str]:
        result = await self._session.execute(select(SystemSetting))
        return {row.key: row.value for row in result.scalars().all()}

    async def set_many(self, items: dict[str, str], updated_by: str = "system") -> int:
        count = 0
        for key, value in items.items():
            await self.set(key, value, updated_by)
            count += 1
        return count

    async def delete(self, key: str) -> bool:
        result = await self._session.execute(select(SystemSetting).where(SystemSetting.key == key))
        row = result.scalar_one_or_none()
        if row:
            await self._session.delete(row)
            return True
        return False
