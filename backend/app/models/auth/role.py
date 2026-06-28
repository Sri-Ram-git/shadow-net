import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = Column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = Column(Text, nullable=True)
    is_system: Mapped[bool] = Column(Boolean, default=False)
    permissions: Mapped[str | None] = Column(Text, nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=lambda: datetime.now(timezone.utc))
