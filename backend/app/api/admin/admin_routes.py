from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.auth import (
    UserRepository, SessionRepository,
    RefreshTokenRepository, LoginLogRepository,
)
from app.repositories.audit_repository import AuditRepository
from app.api.auth.dependencies import get_current_user
from app.schemas.auth import (
    AdminUserResponse, LoginLogResponse, AuditLogResponse,
)
from app.models.auth.user import UserStatus
from typing import Optional

router = APIRouter(tags=["Admin"])


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = UserRepository(db)
    if search:
        users = await repo.search(search, limit)
    else:
        users = await repo.get_all(skip, limit)
    return [AdminUserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserResponse.model_validate(user)


@router.post("/users/{user_id}/disable")
async def disable_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = UserRepository(db)
    await repo.update_status(user_id, UserStatus.DISABLED)
    audit = AuditRepository(db)
    await audit.log(action="admin.user_disabled", user_id=current_user["id"], resource="user", resource_id=user_id)
    return {"message": "User disabled"}


@router.post("/users/{user_id}/enable")
async def enable_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = UserRepository(db)
    await repo.update_status(user_id, UserStatus.ACTIVE)
    audit = AuditRepository(db)
    await audit.log(action="admin.user_enabled", user_id=current_user["id"], resource="user", resource_id=user_id)
    return {"message": "User enabled"}


@router.post("/users/{user_id}/force-logout")
async def force_logout(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session_repo = SessionRepository(db)
    rt_repo = RefreshTokenRepository(db)
    await session_repo.deactivate_all_for_user(user_id)
    await rt_repo.revoke_all_for_user(user_id)
    audit = AuditRepository(db)
    await audit.log(action="admin.user_force_logout", user_id=current_user["id"], resource="user", resource_id=user_id)
    return {"message": "User logged out"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.update_status(user_id, UserStatus.DISABLED)
    audit = AuditRepository(db)
    await audit.log(action="admin.user_deleted", user_id=current_user["id"], resource="user", resource_id=user_id)
    return {"message": "User deleted"}


@router.get("/login-logs", response_model=list[LoginLogResponse])
async def list_login_logs(
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = LoginLogRepository(db)
    logs = await repo.get_recent(limit)
    return [LoginLogResponse.model_validate(l) for l in logs]


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    repo = AuditRepository(db)
    logs = await repo.get_all(limit=limit)
    return [AuditLogResponse.model_validate(l) for l in logs]
