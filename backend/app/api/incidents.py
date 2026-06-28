import os
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)
from app.services.incident_service import IncidentService
from app.schemas.incident import IncidentResponse, IncidentCreate, IncidentCategory
from app.core.config import settings

router = APIRouter()


def get_incident_service(db: AsyncSession = Depends(get_db)) -> IncidentService:
    return IncidentService(
        incident_repo=IncidentRepository(db),
        triage_repo=TriageRepository(db),
        sync_repo=SyncRepository(db),
        audit_repo=AuditRepository(db),
    )


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(service: IncidentService = Depends(get_incident_service)):
    incidents = await service.get_all_incidents()
    return [IncidentResponse.model_validate(i) for i in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    service: IncidentService = Depends(get_incident_service),
):
    incident = await service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentResponse.model_validate(incident)


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    category: str = Form("other"),
    image: Optional[UploadFile] = File(None),
    service: IncidentService = Depends(get_incident_service),
):
    if category not in [c.value for c in IncidentCategory]:
        category = "other"

    image_url = None
    if image and image.filename:
        upload_dir = settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        filename = f"inc_{os.urandom(8).hex()}{ext}"
        filepath = os.path.join(upload_dir, filename)
        async with aiofiles.open(filepath, "wb") as f:
            content = await image.read()
            await f.write(content)
        image_url = f"/uploads/{filename}"

    incident = await service.create_incident(
        IncidentCreate(title=title, description=description, location=location, category=IncidentCategory(category)),
        image_url=image_url,
    )
    return IncidentResponse.model_validate(incident)
