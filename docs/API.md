# ShadowNet API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
No authentication required for MVP. JWT authentication coming in v2.

## Endpoints

### Health Check
```http
GET /health
```
Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123.45
}
```

### Dashboard
```http
GET /dashboard
```
Response:
```json
{
  "total_incidents": 5,
  "critical_incidents": 2,
  "available_nodes": 3,
  "total_nodes": 3,
  "cluster_health": 100.0,
  "storage_usage": 12.5,
  "sync_pending": 3,
  "sync_total": 10,
  "recent_incidents": [...],
  "incidents_by_severity": {"P1": 2, "P2": 1, "P3": 2},
  "incidents_by_category": {"fire": 2, "medical": 1, "flood": 1, "other": 1}
}
```

### List Incidents
```http
GET /incidents
```
Response: Array of incident objects.

### Create Incident
```http
POST /incidents
Content-Type: multipart/form-data

title: "Transformer Explosion"
description: "Fire reported at main substation"
location: "Sector 12, Main Street"
category: "fire"
image: (optional file)
```

### Get Incident
```http
GET /incidents/{id}
```

### Get AI Triage
```http
GET /triage/{incident_id}
```

### Run AI Triage
```http
POST /triage/{incident_id}
```
Response:
```json
{
  "id": "uuid",
  "incident_id": "uuid",
  "severity": "P1",
  "department": "Fire",
  "injured": 4,
  "critical": 2,
  "location": "Main Street",
  "summary": "Transformer explosion requiring Fire department response",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Cluster Metrics
```http
GET /cluster
```
Response:
```json
{
  "nodes": [
    {
      "name": "shadownet-control-1",
      "role": "control-plane",
      "status": "Ready",
      "cpu_usage": 45.2,
      "memory_usage": 62.1,
      "pod_count": 8,
      "restart_count": 0,
      "ip_address": "10.0.0.1",
      "os_image": "Ubuntu 22.04 LTS",
      "kubelet_version": "v1.28.5",
      "last_heartbeat": "now"
    }
  ],
  "total_pods": 30,
  "healthy_pods": 28,
  "total_cpu": 12.0,
  "used_cpu": 6.5,
  "total_memory": 24.0,
  "used_memory": 14.2,
  "network_health": 98.5
}
```

### Sync Queue
```http
GET /sync
```

### Trigger Sync
```http
POST /sync
```

## WebSocket
```
ws://localhost:8000/api/ws
```
Messages types: `incident_update`, `cluster_update`, `sync_update`, `triage_update`, `notification`
