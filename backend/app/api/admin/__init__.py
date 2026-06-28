from fastapi import APIRouter
from app.api.admin.admin_routes import router as admin_router

router = APIRouter(prefix="/admin")
router.include_router(admin_router)
