import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    action: Mapped[str] = Column(String(100), nullable=False)
    entity_type: Mapped[str] = Column(String(50), nullable=False)
    entity_id: Mapped[str] = Column(String(36), nullable=True)
    details: Mapped[str | None] = Column(Text, nullable=True)
    user: Mapped[str] = Column(String(100), default="system")
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced: Mapped[bool] = Column(Boolean, default=False)
