from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class TriageResponse(BaseModel):
    id: str
    incident_id: str
    severity: str
    department: str
    injured: int
    critical: int
    location: str
    summary: str
    raw_response: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
