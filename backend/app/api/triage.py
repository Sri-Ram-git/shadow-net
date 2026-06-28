from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)
from app.services.triage_service import TriageService
from app.schemas.triage import TriageResponse

router = APIRouter()


def get_triage_service(db: AsyncSession = Depends(get_db)) -> TriageService:
    return TriageService(
        incident_repo=IncidentRepository(db),
        triage_repo=TriageRepository(db),
        sync_repo=SyncRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("/{incident_id}", response_model=TriageResponse)
async def get_triage(
    incident_id: str,
    service: TriageService = Depends(get_triage_service),
):
    triage = await service.get_triage(incident_id)
    if not triage:
        raise HTTPException(status_code=404, detail="No triage found for this incident")
    return TriageResponse.model_validate(triage)


@router.post("/{incident_id}", response_model=TriageResponse)
async def run_triage(
    incident_id: str,
    service: TriageService = Depends(get_triage_service),
):
    try:
        triage = await service.run_triage(incident_id)
        return TriageResponse.model_validate(triage)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
