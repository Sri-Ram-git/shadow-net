import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.core.config import settings
from app.core.database import init_db, async_session
from app.repositories import IncidentRepository, TriageRepository, SyncRepository, AuditRepository, SettingsRepository
from app.services.settings_service import DEFAULT_SETTINGS
from app.models.incident import Incident
from app.services.ollama_service import DEMO_RESPONSES
from app.api import router
import json


logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def seed_data():
    """Seed sample incidents and default settings if database is empty."""
    async with async_session() as session:
        repo = IncidentRepository(session)

        existing = await repo.get_all()
        if existing:
            logger.info("Database already contains incidents, skipping seed")
            return

        logger.info("Database empty — seeding sample incidents...")

        samples = [
            Incident(
                title="Wildfire near Bannerghatta Forest",
                description="A rapidly spreading wildfire has been reported in the Bannerghatta forest area. Multiple fire crews have been dispatched but the fire is spreading due to high winds. Nearby residential areas may need evacuation. Thick smoke is affecting visibility on the main road.",
                location="Bannerghatta Forest Reserve, Bangalore, Karnataka",
                category="fire",
                severity="P1",
                status="triaging",
                latitude=12.8000,
                longitude=77.5800,
                city="Bangalore",
                state="Karnataka",
                country="India",
            ),
            Incident(
                title="Major Road Accident on Hosur Road",
                description="Multi-vehicle collision involving a bus and two cars on Hosur Road near Electronic City. Multiple injuries reported. Traffic completely blocked in both directions. Emergency services requested at scene.",
                location="Hosur Road, Electronic City, Bangalore",
                category="medical,infrastructure",
                severity="P2",
                status="open",
                latitude=12.8450,
                longitude=77.6700,
                city="Bangalore",
                state="Karnataka",
                country="India",
            ),
            Incident(
                title="Transformer Explosion in Whitefield",
                description="Electrical transformer explosion at Whitefield power substation. Localized power outage affecting approximately 500 households. Fire contained but infrastructure damage significant. Repair crews en route.",
                location="Whitefield Power Substation, Bangalore",
                category="infrastructure,fire",
                severity="P3",
                status="open",
                latitude=12.9700,
                longitude=77.7500,
                city="Bangalore",
                state="Karnataka",
                country="India",
            ),
        ]

        for incident in samples:
            session.add(incident)

        # Seed default settings
        settings_repo = SettingsRepository(session)
        for key, value in DEFAULT_SETTINGS.items():
            await settings_repo.set(key, value, "system")

        await session.commit()
        logger.info(f"Seeded {len(samples)} sample incidents")
        logger.info(f"Seeded {len(DEFAULT_SETTINGS)} default settings")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ShadowNet backend...")

    os.makedirs(settings.data_dir, exist_ok=True)
    os.makedirs(settings.upload_dir, exist_ok=True)
    await init_db()
    await seed_data()
    logger.info(f"ShadowNet backend ready — data: {settings.data_dir}, uploads: {settings.upload_dir}")
    yield
    logger.info("Shutting down ShadowNet backend...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Chaos-Resilient Edge Infrastructure for Emergency Response",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store"
    return response

API_PREFIX_PATHS = {"dashboard", "incidents", "cluster", "settings", "sync", "triage", "health", "config"}

_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
}

@app.middleware("http")
async def api_prefix_redirect(request: Request, call_next):
    path = request.url.path.lstrip("/")
    if not path.startswith("api/") and not path.startswith("uploads/") and not path.startswith("assets/"):
        first_segment = path.split("/")[0]
        if first_segment in API_PREFIX_PATHS:
            if request.method == "OPTIONS":
                return Response(status_code=200, headers=dict(_CORS_HEADERS))
            new_path = "/api/" + path
            return RedirectResponse(url=new_path, status_code=307)
    return await call_next(request)

app.include_router(router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc) if settings.debug else "An unexpected error occurred"},
    )

try:
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
except RuntimeError:
    pass

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path, media_type="text/html")
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/") or full_path.startswith("assets/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path, media_type="text/html")
        return JSONResponse({"detail": "Not Found"}, status_code=404)
