import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class UserSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    access_token: Mapped[str] = Column(Text, nullable=True)
    refresh_token: Mapped[str] = Column(Text, nullable=True)
    ip_address: Mapped[str | None] = Column(String(45), nullable=True)
    user_agent: Mapped[str | None] = Column(Text, nullable=True)
    device_name: Mapped[str | None] = Column(String(100), nullable=True)
    browser: Mapped[str | None] = Column(String(50), nullable=True)
    os: Mapped[str | None] = Column(String(50), nullable=True)
    country: Mapped[str | None] = Column(String(100), nullable=True)
    city: Mapped[str | None] = Column(String(100), nullable=True)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    expires_at: Mapped[datetime] = Column(DateTime, nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_activity: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
