from pydantic import BaseModel
from typing import Optional
from app.schemas.incident import IncidentResponse


class DashboardResponse(BaseModel):
    total_incidents: int
    critical_incidents: int
    available_nodes: int
    total_nodes: int
    cluster_health: float
    storage_usage: float
    sync_pending: int
    sync_total: int
    recent_incidents: list[IncidentResponse]
    incidents_by_severity: dict[str, int]
    incidents_by_category: dict[str, int]
