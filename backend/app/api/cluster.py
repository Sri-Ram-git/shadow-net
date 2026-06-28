from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)
from app.services.cluster_service import ClusterService
from app.schemas.cluster import ClusterMetricsResponse

router = APIRouter()


def get_cluster_service(db: AsyncSession = Depends(get_db)) -> ClusterService:
    return ClusterService(
        incident_repo=IncidentRepository(db),
        triage_repo=TriageRepository(db),
        sync_repo=SyncRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("", response_model=ClusterMetricsResponse)
async def get_cluster_metrics(service: ClusterService = Depends(get_cluster_service)):
    metrics = service.get_metrics()
    return ClusterMetricsResponse(**metrics)
