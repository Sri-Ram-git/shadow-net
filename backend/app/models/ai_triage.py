import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class AITriage(Base):
    __tablename__ = "ai_triage"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = Column(String(36), ForeignKey("incidents.id"), nullable=False)
    severity: Mapped[str] = Column(String(2), nullable=False)
    department: Mapped[str] = Column(String(100), nullable=False)
    injured: Mapped[int] = Column(Integer, default=0)
    critical: Mapped[int] = Column(Integer, default=0)
    location: Mapped[str] = Column(String(300), nullable=False)
    summary: Mapped[str] = Column(Text, nullable=False)
    raw_response: Mapped[str | None] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced: Mapped[bool] = Column(Boolean, default=False)
