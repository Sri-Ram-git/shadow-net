from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from app.repositories.base import BaseRepository
from app.models.auth.session import UserSession


class SessionRepository(BaseRepository):
    async def create(self, session: UserSession) -> UserSession:
        self._session.add(session)
        await self._session.commit()
        await self._session.refresh(session)
        return session

    async def get_by_id(self, session_id: str) -> UserSession | None:
        result = await self._session.execute(
            select(UserSession).where(UserSession.id == session_id)
        )
        return result.scalar_one_or_none()

    async def get_active_by_user(self, user_id: str) -> list[UserSession]:
        result = await self._session.execute(
            select(UserSession)
            .where(and_(UserSession.user_id == user_id, UserSession.is_active == True))
            .order_by(UserSession.created_at.desc())
        )
        return list(result.scalars().all())

    async def deactivate(self, session_id: str) -> None:
        await self._session.execute(
            UserSession.__table__.update()
            .where(UserSession.id == session_id)
            .values(is_active=False)
        )
        await self._session.commit()

    async def deactivate_all_for_user(self, user_id: str) -> None:
        await self._session.execute(
            UserSession.__table__.update()
            .where(and_(UserSession.user_id == user_id, UserSession.is_active == True))
            .values(is_active=False)
        )
        await self._session.commit()

    async def update_activity(self, session_id: str) -> None:
        await self._session.execute(
            UserSession.__table__.update()
            .where(UserSession.id == session_id)
            .values(last_activity=datetime.now(timezone.utc))
        )
        await self._session.commit()

    async def count_active(self) -> int:
        result = await self._session.execute(
            select(func.count(UserSession.id)).where(UserSession.is_active == True)
        )
        return result.scalar() or 0

    async def count_online_since(self, since: datetime) -> int:
        result = await self._session.execute(
            select(func.count(UserSession.id))
            .where(and_(UserSession.is_active == True, UserSession.last_activity >= since))
        )
        return result.scalar() or 0
