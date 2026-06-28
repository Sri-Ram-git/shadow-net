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
    categories: list[str] = Field(default_factory=lambda: ["other"])
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    place_id: str | None = None
    landmark: str | None = None


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    location: str
    category: str
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    place_id: str | None = None
    landmark: str | None = None
    severity: str
    status: str
    image_url: Optional[str] = None
    timestamp: datetime
    synced: bool

    model_config = {"from_attributes": True}
