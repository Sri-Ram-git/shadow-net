import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped
from app.core.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = Column(String(255), nullable=False, unique=True)
    session_id: Mapped[str] = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True)
    expires_at: Mapped[datetime] = Column(DateTime, nullable=False)
    is_revoked: Mapped[bool] = Column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = Column(DateTime, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
