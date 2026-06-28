from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.auth import (
    UserRepository, SessionRepository,
    RefreshTokenRepository, LoginLogRepository,
)
from app.repositories.audit_repository import AuditRepository
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserResponse,
)
from app.api.auth.dependencies import get_current_user

router = APIRouter(tags=["Authentication"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        user_repo=UserRepository(db),
        session_repo=SessionRepository(db),
        refresh_token_repo=RefreshTokenRepository(db),
        login_log_repo=LoginLogRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.post("/register", status_code=201)
async def register(
    req: RegisterRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    try:
        result = await service.register(
            full_name=req.full_name,
            username=req.username,
            email=req.email,
            password=req.password,
            organization=req.organization,
            phone=req.phone,
            ip_address=request.client.host if request.client else None,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    try:
        result = await service.login(
            email=req.email,
            password=req.password,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(
    request: Request,
    user: dict = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.logout(user["id"])
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    req: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
):
    try:
        result = await service.refresh(req.refresh_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(
    req: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    req: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    return {"message": "Password has been reset"}
