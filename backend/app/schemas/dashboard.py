from pydantic import BaseModel
from typing import Optional
from app.schemas.incident import IncidentResponse


class DashboardStats(BaseModel):
    total_incidents: int = 0
    critical_incidents: int = 0
    available_nodes: int = 0
    total_nodes: int = 3
    cluster_health: float = 100.0
    storage_usage: float = 0.0
    sync_pending: int = 0
    sync_total: int = 0


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
