from app.repositories import (
    IncidentRepository,
    TriageRepository,
    SyncRepository,
    AuditRepository,
)


class BaseService:
    def __init__(
        self,
        incident_repo: IncidentRepository,
        triage_repo: TriageRepository,
        sync_repo: SyncRepository,
        audit_repo: AuditRepository,
    ):
        self.incident_repo = incident_repo
        self.triage_repo = triage_repo
        self.sync_repo = sync_repo
        self.audit_repo = audit_repo
