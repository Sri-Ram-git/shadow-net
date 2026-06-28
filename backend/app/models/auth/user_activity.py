import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class UserActivity(Base):
    __tablename__ = "user_activity"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type: Mapped[str] = Column(String(50), nullable=False)
    page: Mapped[str | None] = Column(String(200), nullable=True)
    api_endpoint: Mapped[str | None] = Column(String(200), nullable=True)
    metadata_json: Mapped[str | None] = Column(Text, nullable=True)
    ip_address: Mapped[str | None] = Column(String(45), nullable=True)
    session_id: Mapped[str | None] = Column(String(36), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
