import time
import os
import logging
from fastapi import APIRouter
from app.schemas.health import HealthResponse, ReadinessResponse, LivenessResponse
from app.core.config import settings
from app.core.database import check_db_health

logger = logging.getLogger(__name__)
router = APIRouter()
_start_time = time.time()


@router.get("", response_model=HealthResponse)
async def health_check():
    db_ok = await check_db_health()
    ai_mode = "demo" if settings.demo_mode else "ollama"
    storage = "available" if os.path.isdir(settings.upload_dir) else "unavailable"
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        version=settings.app_version,
        uptime=round(time.time() - _start_time, 2),
        database="connected" if db_ok else "disconnected",
        ai_mode=ai_mode,
        storage=storage,
    )


@router.get("/ready", response_model=ReadinessResponse)
async def ready_check():
    db_ok = await check_db_health()
    storage_ok = os.path.isdir(settings.upload_dir)
    checks = {
        "database": "connected" if db_ok else "disconnected",
        "storage": "available" if storage_ok else "unavailable",
        "config": "loaded",
    }
    status = "ready" if db_ok and storage_ok else "not_ready"
    return ReadinessResponse(
        status=status,
        database="connected" if db_ok else "disconnected",
        storage="available" if storage_ok else "unavailable",
        checks=checks,
    )


@router.get("/live", response_model=LivenessResponse)
async def live_check():
    return LivenessResponse(
        status="alive",
        uptime=round(time.time() - _start_time, 2),
    )
