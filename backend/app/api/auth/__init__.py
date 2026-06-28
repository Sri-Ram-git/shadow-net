from fastapi import APIRouter
from app.api.auth.auth_routes import router as auth_router
from app.api.auth.profile_routes import router as profile_router

router = APIRouter(prefix="/auth")
router.include_router(auth_router)
router.include_router(profile_router)
