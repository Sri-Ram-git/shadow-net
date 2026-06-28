import json
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any

from app.core.config import settings
from app.auth.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, hash_token, validate_password_strength,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.models.auth.user import User, UserStatus
from app.models.auth.session import UserSession
from app.models.auth.refresh_token import RefreshToken
from app.models.auth.login_log import LoginLog
from app.repositories.auth.user_repository import UserRepository
from app.repositories.auth.session_repository import SessionRepository
from app.repositories.auth.refresh_token_repository import RefreshTokenRepository
from app.repositories.auth.login_log_repository import LoginLogRepository
from app.repositories.audit_repository import AuditRepository


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        session_repo: SessionRepository,
        refresh_token_repo: RefreshTokenRepository,
        login_log_repo: LoginLogRepository,
        audit_repo: AuditRepository,
    ):
        self.user_repo = user_repo
        self.session_repo = session_repo
        self.refresh_token_repo = refresh_token_repo
        self.login_log_repo = login_log_repo
        self.audit_repo = audit_repo

    async def register(
        self,
        full_name: str,
        username: str,
        email: str,
        password: str,
        organization: str | None = None,
        phone: str | None = None,
        ip_address: str | None = None,
    ) -> dict[str, Any]:
        # Validate password
        valid, msg = validate_password_strength(password)
        if not valid:
            raise ValueError(msg)

        # Check existing
        if await self.user_repo.get_by_email(email):
            raise ValueError("Email already registered")
        if await self.user_repo.get_by_username(username):
            raise ValueError("Username already taken")

        user = User(
            full_name=full_name,
            username=username,
            email=email.lower().strip(),
            password_hash=hash_password(password),
            organization=organization,
            phone=phone,
            status=UserStatus.ACTIVE.value,
            email_verified=True,
        )
        user = await self.user_repo.create(user)

        await self.audit_repo.log(
            action="user.registered",
            user_id=user.id,
            resource="user",
            resource_id=user.id,
            ip_address=ip_address,
        )

        return {"id": user.id, "email": user.email, "full_name": user.full_name}

    async def login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        user = await self.user_repo.get_by_email(email)
        if not user:
            await self._log_failed_login(None, email, ip_address, "User not found")
            raise ValueError("Invalid email or password")

        if user.status == UserStatus.DISABLED.value:
            await self._log_failed_login(user.id, email, ip_address, "Account disabled")
            raise ValueError("Account is disabled. Contact administrator.")

        if not verify_password(password, user.password_hash):
            await self._log_failed_login(user.id, email, ip_address, "Invalid password")
            raise ValueError("Invalid email or password")

        # Create session
        now = datetime.now(timezone.utc)
        session = UserSession(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
        session = await self.session_repo.create(session)

        # Create tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id, session.id)

        # Store refresh token hash
        rt = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            session_id=session.id,
            expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.refresh_token_repo.create(rt)

        # Log login
        log = LoginLog(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            login_status="success",
            jwt_id=session.id,
        )
        await self.login_log_repo.create(log)

        await self.user_repo.update_last_login(user.id)
        await self.audit_repo.log(
            action="user.login",
            user_id=user.id,
            resource="session",
            resource_id=session.id,
            ip_address=ip_address,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "username": user.username,
                "organization": user.organization,
                "role": None,
                "status": user.status,
            },
        }

    async def refresh(self, refresh_token_str: str) -> dict[str, Any]:
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
        except Exception:
            raise ValueError("Invalid or expired refresh token")

        token_hash = hash_token(refresh_token_str)
        stored = await self.refresh_token_repo.get_by_hash(token_hash)
        if not stored or stored.is_revoked:
            raise ValueError("Refresh token has been revoked")

        # Rotate: revoke old, issue new
        await self.refresh_token_repo.revoke(stored.id)

        user = await self.user_repo.get_by_id(payload["sub"])
        if not user or user.status == UserStatus.DISABLED.value:
            raise ValueError("Account unavailable")

        new_access = create_access_token(user.id)
        new_refresh = create_refresh_token(user.id, stored.session_id)

        rt = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(new_refresh),
            session_id=stored.session_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await self.refresh_token_repo.create(rt)

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def logout(self, user_id: str, session_id: str | None = None) -> None:
        if session_id:
            await self.session_repo.deactivate(session_id)
            await self.refresh_token_repo.revoke_all_for_user(user_id)
        else:
            await self.session_repo.deactivate_all_for_user(user_id)
            await self.refresh_token_repo.revoke_all_for_user(user_id)

        await self.audit_repo.log(
            action="user.logout",
            user_id=user_id,
            resource="session",
            resource_id=session_id,
        )

    async def get_profile(self, user_id: str) -> User | None:
        return await self.user_repo.get_by_id(user_id)

    async def update_profile(
        self,
        user_id: str,
        full_name: str | None = None,
        organization: str | None = None,
        phone: str | None = None,
    ) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        if full_name is not None:
            user.full_name = full_name
        if organization is not None:
            user.organization = organization
        if phone is not None:
            user.phone = phone
        user = await self.user_repo.update(user)

        await self.audit_repo.log(
            action="user.profile_updated",
            user_id=user_id,
            resource="user",
            resource_id=user_id,
        )
        return user

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        valid, msg = validate_password_strength(new_password)
        if not valid:
            raise ValueError(msg)

        user.password_hash = hash_password(new_password)
        await self.user_repo.update(user)

        await self.session_repo.deactivate_all_for_user(user_id)
        await self.refresh_token_repo.revoke_all_for_user(user_id)

        await self.audit_repo.log(
            action="user.password_changed",
            user_id=user_id,
            resource="password",
            resource_id=user_id,
        )

    async def get_login_logs(self, user_id: str | None = None, limit: int = 50) -> list[LoginLog]:
        if user_id:
            return await self.login_log_repo.get_by_user(user_id, limit)
        return await self.login_log_repo.get_recent(limit)

    async def get_audit_logs(self, user_id: str | None = None, limit: int = 100) -> list:
        if user_id:
            return await self.audit_repo.get_by_user(user_id, limit)
        return await self.audit_repo.get_all(limit=limit)

    async def _log_failed_login(self, user_id: str | None, email: str, ip: str | None, reason: str) -> None:
        log = LoginLog(
            user_id=user_id,
            ip_address=ip,
            login_status="failed",
            failed_reason=reason,
        )
        await self.login_log_repo.create(log)
