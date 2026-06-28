from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)
from app.services.sync_service import SyncService
from app.schemas.sync import SyncQueueResponse, SyncTriggerResponse

router = APIRouter()


def get_sync_service(db: AsyncSession = Depends(get_db)) -> SyncService:
    return SyncService(
        incident_repo=IncidentRepository(db),
        triage_repo=TriageRepository(db),
        sync_repo=SyncRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("", response_model=list[SyncQueueResponse])
async def get_sync_queue(service: SyncService = Depends(get_sync_service)):
    queue = await service.get_queue()
    return [SyncQueueResponse.model_validate(item) for item in queue]


@router.post("", response_model=SyncTriggerResponse)
async def trigger_sync(service: SyncService = Depends(get_sync_service)):
    return await service.trigger_sync()
