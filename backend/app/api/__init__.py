from fastapi import APIRouter
from app.api.incidents import router as incidents_router
from app.api.triage import router as triage_router
from app.api.cluster import router as cluster_router
from app.api.sync import router as sync_router
from app.api.dashboard import router as dashboard_router
from app.api.health import router as health_router

router = APIRouter(prefix="/api")
router.include_router(incidents_router, prefix="/incidents", tags=["Incidents"])
router.include_router(triage_router, prefix="/triage", tags=["Triage"])
router.include_router(cluster_router, prefix="/cluster", tags=["Cluster"])
router.include_router(sync_router, prefix="/sync", tags=["Sync"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(health_router, prefix="/health", tags=["Health"])
