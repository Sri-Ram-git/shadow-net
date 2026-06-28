from datetime import datetime, timezone
from app.services.base import BaseService
from app.models.incident import Incident, IncidentStatus
from app.models.sync_queue import SyncQueueItem
from app.schemas.incident import IncidentCreate
import json


class IncidentService(BaseService):
    async def create_incident(
        self,
        payload: IncidentCreate,
        image_url: str | None = None,
    ) -> Incident:
        categories_str = ",".join(payload.categories)
        incident = Incident(
            title=payload.title,
            description=payload.description,
            location=payload.location,
            category=categories_str,
            latitude=payload.latitude,
            longitude=payload.longitude,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            postal_code=payload.postal_code,
            place_id=payload.place_id,
            landmark=payload.landmark,
            image_url=image_url,
        )
        incident = await self.incident_repo.create(incident)

        await self.sync_repo.create(SyncQueueItem(
            entity_type="incident",
            entity_id=incident.id,
            action="create",
            payload=json.dumps({
                "title": incident.title,
                "description": incident.description,
                "location": incident.location,
                "category": incident.category,
            }),
        ))

        await self.audit_repo.log(
            action="incident.created",
            entity_type="incident",
            entity_id=incident.id,
            details=f"Incident '{incident.title}' created",
        )

        return incident

    async def get_incident(self, incident_id: str) -> Incident | None:
        return await self.incident_repo.get_by_id(incident_id)

    async def get_all_incidents(self) -> list[Incident]:
        return await self.incident_repo.get_all()

    async def get_dashboard_stats(self) -> dict:
        total = await self.incident_repo.count()
        critical = await self.incident_repo.count_critical()
        recent = await self.incident_repo.get_recent(5)
        by_severity = await self.incident_repo.count_by_severity()
        by_category = await self.incident_repo.count_by_category()
        sync_pending = await self.sync_repo.count_pending()
        sync_total = await self.sync_repo.count_total()

        return {
            "total_incidents": total,
            "critical_incidents": critical,
            "available_nodes": 3,
            "total_nodes": 3,
            "cluster_health": 100.0,
            "storage_usage": 12.5,
            "sync_pending": sync_pending,
            "sync_total": sync_total,
            "recent_incidents": recent,
            "incidents_by_severity": by_severity,
            "incidents_by_category": by_category,
        }
