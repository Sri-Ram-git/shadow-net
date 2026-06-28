import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base
import enum


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISABLED = "disabled"
    PENDING_VERIFICATION = "pending_verification"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = Column(String(150), nullable=False)
    username: Mapped[str] = Column(String(80), unique=True, nullable=False)
    email: Mapped[str] = Column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = Column(String(255), nullable=False)
    organization: Mapped[str | None] = Column(String(200), nullable=True)
    role_id: Mapped[str | None] = Column(String(36), ForeignKey("roles.id"), nullable=True)
    profile_image: Mapped[str | None] = Column(String(500), nullable=True)
    phone: Mapped[str | None] = Column(String(30), nullable=True)
    status: Mapped[str] = Column(String(30), default=UserStatus.PENDING_VERIFICATION.value)
    email_verified: Mapped[bool] = Column(Boolean, default=False)
    last_login: Mapped[datetime | None] = Column(DateTime, nullable=True)
    reset_token: Mapped[str | None] = Column(String(255), nullable=True)
    reset_token_expires_at: Mapped[datetime | None] = Column(DateTime, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
