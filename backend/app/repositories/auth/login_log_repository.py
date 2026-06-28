from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from app.repositories.base import BaseRepository
from app.models.auth.login_log import LoginLog


class LoginLogRepository(BaseRepository):
    async def create(self, log: LoginLog) -> LoginLog:
        self._session.add(log)
        await self._session.commit()
        await self._session.refresh(log)
        return log

    async def get_recent(self, limit: int = 50) -> list[LoginLog]:
        result = await self._session.execute(
            select(LoginLog).order_by(LoginLog.login_time.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: str, limit: int = 50) -> list[LoginLog]:
        result = await self._session.execute(
            select(LoginLog)
            .where(LoginLog.user_id == user_id)
            .order_by(LoginLog.login_time.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_failed_recent(self, limit: int = 20) -> list[LoginLog]:
        result = await self._session.execute(
            select(LoginLog)
            .where(LoginLog.login_status == "failed")
            .order_by(LoginLog.login_time.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_since(self, since: datetime, status: str | None = None) -> int:
        conditions = [LoginLog.login_time >= since]
        if status:
            conditions.append(LoginLog.login_status == status)
        result = await self._session.execute(
            select(func.count(LoginLog.id)).where(and_(*conditions))
        )
        return result.scalar() or 0

    async def logout(self, log_id: str) -> None:
        now = datetime.now(timezone.utc)
        await self._session.execute(
            LoginLog.__table__.update()
            .where(LoginLog.id == log_id)
            .values(logout_time=now)
        )
        await self._session.commit()
