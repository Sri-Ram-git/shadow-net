from datetime import datetime, timezone
from sqlalchemy import select, and_
from app.repositories.base import BaseRepository
from app.models.auth.refresh_token import RefreshToken


class RefreshTokenRepository(BaseRepository):
    async def create(self, token: RefreshToken) -> RefreshToken:
        self._session.add(token)
        await self._session.commit()
        await self._session.refresh(token)
        return token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, token_id: str) -> None:
        await self._session.execute(
            RefreshToken.__table__.update()
            .where(RefreshToken.id == token_id)
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await self._session.commit()

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self._session.execute(
            RefreshToken.__table__.update()
            .where(and_(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False))
            .values(is_revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await self._session.commit()
