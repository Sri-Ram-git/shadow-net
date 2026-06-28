import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.settings_repository import SettingsRepository
from app.services.settings_service import SettingsService
from app.api.ws import manager

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_settings_service(db: AsyncSession = Depends(get_db)) -> SettingsService:
    return SettingsService(SettingsRepository(db))


@router.get("")
async def get_all_settings(service: SettingsService = Depends(get_settings_service)):
    return await service.get_all()


@router.get("/{key}")
async def get_setting(key: str, service: SettingsService = Depends(get_settings_service)):
    return {"key": key, "value": await service.get(key)}


@router.put("/{key}")
async def update_setting(key: str, body: dict, service: SettingsService = Depends(get_settings_service)):
    value = body.get("value", "")
    updated_by = body.get("updated_by", "operator")
    result = await service.set(key, value, updated_by)
    if result.get("ok"):
        await manager.broadcast({
            "type": "settings_changed",
            "data": {"key": key, "value": value, "updated_by": updated_by},
        })
        return result
    return result


@router.post("/batch")
async def batch_update(body: dict, service: SettingsService = Depends(get_settings_service)):
    items = body.get("settings", {})
    updated_by = body.get("updated_by", "operator")
    result = await service.set_many(items, updated_by)
    if result.get("ok"):
        await manager.broadcast({
            "type": "settings_changed",
            "data": {"settings": items, "updated_by": updated_by},
        })
    return result
