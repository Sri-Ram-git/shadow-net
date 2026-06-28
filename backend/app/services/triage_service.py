from datetime import datetime, timezone
from app.services.base import BaseService
from app.models.ai_triage import AITriage
from app.models.incident import Incident, IncidentStatus
from app.models.sync_queue import SyncQueueItem
from app.services.ollama_service import OllamaService
import json


class TriageService(BaseService):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ollama = OllamaService()

    async def run_triage(self, incident_id: str) -> AITriage:
        incident = await self.incident_repo.get_by_id(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        result = await self.ollama.analyze(
            title=incident.title,
            description=incident.description,
            location=incident.location,
            category=incident.category,
        )

        triage = AITriage(
            incident_id=incident.id,
            severity=result.get("severity", "P3"),
            department=result.get("department", "General"),
            injured=result.get("injured", 0),
            critical=result.get("critical", 0),
            location=result.get("location", incident.location),
            summary=result.get("summary", incident.title),
            raw_response=json.dumps(result),
        )
        triage = await self.triage_repo.create(triage)

        incident.severity = triage.severity
        incident.status = IncidentStatus.TRIAGING.value
        await self.incident_repo.update(incident)

        await self.sync_repo.create(SyncQueueItem(
            entity_type="triage",
            entity_id=triage.id,
            action="create",
            payload=json.dumps(result),
        ))

        await self.audit_repo.log(
            action="triage.completed",
            entity_type="triage",
            entity_id=triage.id,
            details=f"AI Triage completed for incident {incident_id}: {triage.severity}",
        )

        return triage

    async def get_triage(self, incident_id: str) -> AITriage | None:
        return await self.triage_repo.get_by_incident_id(incident_id)

    async def close(self):
        await self.ollama.close()
