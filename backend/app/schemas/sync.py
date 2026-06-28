from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class SyncQueueResponse(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    action: str
    payload: Optional[str] = None
    status: str
    retry_count: int
    created_at: datetime
    synced_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SyncTriggerResponse(BaseModel):
    message: str
    synced: int = 0


class SyncAction(BaseModel):
    action: str = Field(default="sync_all", description="Sync action to perform")
