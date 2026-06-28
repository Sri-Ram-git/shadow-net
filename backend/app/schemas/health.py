from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    uptime: float = 0.0
    database: Optional[str] = None
    ai_mode: Optional[str] = None
    storage: Optional[str] = None


class ReadinessResponse(BaseModel):
    status: str = "ready"
    database: str = "connected"
    storage: str = "available"
    checks: dict[str, str] = {}


class LivenessResponse(BaseModel):
    status: str = "alive"
    uptime: float = 0.0
