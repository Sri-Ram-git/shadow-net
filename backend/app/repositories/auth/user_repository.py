from datetime import datetime, timezone
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.auth.user import User, UserStatus


class UserRepository(BaseRepository):
    async def create(self, user: User) -> User:
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_reset_token(self, token: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.reset_token == token)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        result = await self._session.execute(
            select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def update(self, user: User) -> User:
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def update_last_login(self, user_id: str) -> None:
        now = datetime.now(timezone.utc)
        await self._session.execute(
            User.__table__.update()
            .where(User.id == user_id)
            .values(last_login=now)
        )
        await self._session.commit()

    async def update_status(self, user_id: str, status: UserStatus) -> None:
        await self._session.execute(
            User.__table__.update()
            .where(User.id == user_id)
            .values(status=status.value)
        )
        await self._session.commit()

    async def count(self) -> int:
        result = await self._session.execute(select(func.count(User.id)))
        return result.scalar() or 0

    async def count_active(self) -> int:
        result = await self._session.execute(
            select(func.count(User.id)).where(User.status == UserStatus.ACTIVE.value)
        )
        return result.scalar() or 0

    async def search(self, query: str, limit: int = 20) -> list[User]:
        q = f"%{query}%"
        result = await self._session.execute(
            select(User)
            .where(
                (User.full_name.ilike(q)) |
                (User.email.ilike(q)) |
                (User.username.ilike(q))
            )
            .limit(limit)
        )
        return list(result.scalars().all())
