import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum, Float
from sqlalchemy.orm import Mapped
from app.core.database import Base
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


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = Column(String(200), nullable=False)
    description: Mapped[str] = Column(Text, nullable=False)
    location: Mapped[str] = Column(String(300), nullable=False)
    category: Mapped[str] = Column(String(200), nullable=False, default=IncidentCategory.OTHER.value)
    latitude: Mapped[float | None] = Column(Float, nullable=True)
    longitude: Mapped[float | None] = Column(Float, nullable=True)
    city: Mapped[str | None] = Column(String(100), nullable=True)
    state: Mapped[str | None] = Column(String(100), nullable=True)
    country: Mapped[str | None] = Column(String(100), nullable=True)
    postal_code: Mapped[str | None] = Column(String(20), nullable=True)
    place_id: Mapped[str | None] = Column(String(200), nullable=True)
    landmark: Mapped[str | None] = Column(String(200), nullable=True)
    severity: Mapped[str] = Column(String(2), nullable=False, default=Severity.P4.value)
    status: Mapped[str] = Column(String(20), nullable=False, default=IncidentStatus.OPEN.value)
    image_url: Mapped[str | None] = Column(String(500), nullable=True)
    timestamp: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced: Mapped[bool] = Column(Boolean, default=False)
    updated_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
