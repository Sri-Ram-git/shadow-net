import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = Column(String(100), nullable=False, index=True)
    resource: Mapped[str | None] = Column(String(100), nullable=True)
    resource_id: Mapped[str | None] = Column(String(36), nullable=True)
    entity_type: Mapped[str | None] = Column(String(50), nullable=True)
    entity_id: Mapped[str | None] = Column(String(36), nullable=True)
    details: Mapped[str | None] = Column(Text, nullable=True)
    ip_address: Mapped[str | None] = Column(String(45), nullable=True)
    user_agent: Mapped[str | None] = Column(Text, nullable=True)
    metadata_json: Mapped[str | None] = Column(Text, nullable=True)
    synced: Mapped[bool] = Column(Boolean, default=False)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
