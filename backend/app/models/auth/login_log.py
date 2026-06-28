import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class LoginLog(Base):
    __tablename__ = "login_logs"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    login_time: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    logout_time: Mapped[datetime | None] = Column(DateTime, nullable=True)
    session_duration: Mapped[float | None] = Column(Float, nullable=True)
    ip_address: Mapped[str | None] = Column(String(45), nullable=True)
    device_name: Mapped[str | None] = Column(String(100), nullable=True)
    browser: Mapped[str | None] = Column(String(50), nullable=True)
    operating_system: Mapped[str | None] = Column(String(50), nullable=True)
    country: Mapped[str | None] = Column(String(100), nullable=True)
    city: Mapped[str | None] = Column(String(100), nullable=True)
    login_status: Mapped[str] = Column(String(30), nullable=False, default="success")
    failed_reason: Mapped[str | None] = Column(Text, nullable=True)
    jwt_id: Mapped[str | None] = Column(String(36), nullable=True)
