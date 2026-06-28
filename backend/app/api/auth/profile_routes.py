from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.auth import (
    UserRepository, SessionRepository,
    RefreshTokenRepository, LoginLogRepository,
)
from app.repositories.audit_repository import AuditRepository
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserResponse, ProfileUpdateRequest, ChangePasswordRequest,
    LoginLogResponse, AuditLogResponse,
)
from app.api.auth.dependencies import get_current_user

router = APIRouter(tags=["Profile"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        user_repo=UserRepository(db),
        session_repo=SessionRepository(db),
        refresh_token_repo=RefreshTokenRepository(db),
        login_log_repo=LoginLogRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    profile = await service.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(profile)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    profile = await service.update_profile(
        user_id=user["id"],
        full_name=req.full_name,
        organization=req.organization,
        phone=req.phone,
    )
    return UserResponse.model_validate(profile)


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    try:
        await service.change_password(user["id"], req.current_password, req.new_password)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/login-logs", response_model=list[LoginLogResponse])
async def get_login_logs(
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    logs = await service.get_login_logs(user["id"])
    return [LoginLogResponse.model_validate(l) for l in logs]


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def get_audit_logs(
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    logs = await service.get_audit_logs(user["id"])
    return [AuditLogResponse.model_validate(l) for l in logs]
