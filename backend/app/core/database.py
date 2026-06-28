import os
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)
os.makedirs(settings.data_dir, exist_ok=True)

# Support both SQLite and PostgreSQL
_database_url = settings.database_url
if _database_url.startswith("postgresql://"):
    _database_url = _database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False} if "sqlite" in _database_url else {},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    from app.models import incident, ai_triage, sync_queue, audit_log, system_setting  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def check_db_health() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False
