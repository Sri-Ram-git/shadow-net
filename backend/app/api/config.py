from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("")
async def get_config():
    return {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
    }
