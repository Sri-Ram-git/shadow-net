import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped
from app.core.database import Base
import enum


class SyncStatus(str, enum.Enum):
    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"


class SyncQueueItem(Base):
    __tablename__ = "sync_queue"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type: Mapped[str] = Column(String(50), nullable=False)
    entity_id: Mapped[str] = Column(String(36), nullable=False)
    action: Mapped[str] = Column(String(50), nullable=False)
    payload: Mapped[str] = Column(Text, nullable=True)
    status: Mapped[str] = Column(String(20), nullable=False, default=SyncStatus.PENDING.value)
    retry_count: Mapped[int] = Column(Integer, default=0)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced_at: Mapped[datetime | None] = Column(DateTime, nullable=True)
