from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
import enum


class Severity(str, enum.Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class IncidentCategory(str, enum.Enum):
    FIRE = "fire"
    MEDICAL = "medical"
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    INFRASTRUCTURE = "infrastructure"
    HAZARD = "hazard"
    OTHER = "other"


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    TRIAGING = "triaging"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    location: str = Field(..., min_length=1, max_length=300)
    category: IncidentCategory = IncidentCategory.OTHER


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    location: str
    category: str
    severity: str
    status: str
    image_url: Optional[str] = None
    timestamp: datetime
    synced: bool

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    items: list[IncidentResponse]
    total: int
