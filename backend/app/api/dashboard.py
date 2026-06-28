from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)
from app.services.incident_service import IncidentService
from app.schemas.dashboard import DashboardResponse
from app.schemas.incident import IncidentResponse

router = APIRouter()


def get_incident_service(db: AsyncSession = Depends(get_db)) -> IncidentService:
    return IncidentService(
        incident_repo=IncidentRepository(db),
        triage_repo=TriageRepository(db),
        sync_repo=SyncRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("", response_model=DashboardResponse)
async def get_dashboard(service: IncidentService = Depends(get_incident_service)):
    stats = await service.get_dashboard_stats()
    stats["recent_incidents"] = [
        IncidentResponse.model_validate(i) for i in stats["recent_incidents"]
    ]
    return DashboardResponse(**stats)
