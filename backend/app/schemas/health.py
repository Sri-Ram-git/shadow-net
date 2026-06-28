from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    uptime: float = 0.0
