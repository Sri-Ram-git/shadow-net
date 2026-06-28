# ShadowNet Architecture

## System Architecture

### High-Level Design

```
                         ┌─────────────────────────────┐
                         │      Emergency Responders     │
                         │         (Laptops/WiFi)        │
                         └──────────┬──────────────────┘
                                    │
                         ┌──────────▼──────────────────┐
                         │       ShadowNet Edge Cloud   │
                         │                              │
                         │  ┌────────────────────────┐  │
                         │  │     K3s Cluster         │  │
                         │  │  ┌─────┐ ┌─────┐ ┌───┐ │  │
                         │  │  │ CP  │ │ WK1 │ │WK2│ │  │
                         │  │  └─────┘ └─────┘ └───┘ │  │
                         │  └────────────────────────┘  │
                         │                              │
                         │  ┌────────────────────────┐  │
                         │  │     Local Services      │  │
                         │  │  FastAPI │ SQLite │Ollama│  │
                         │  └────────────────────────┘  │
                         └──────────────────────────────┘
                                    │
                         ┌──────────▼──────────────────┐
                         │       Cloud (when online)    │
                         │    Sync Engine → Cloud API   │
                         └─────────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Dashboard  │ │ Incidents  │ │ Cluster    │ │ AI Triage    │ │
│  │ Page       │ │ Page       │ │ Health     │ │ Page         │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
│         │              │              │               │          │
│         └──────────────┴──────────────┴───────────────┘          │
│                            │                                      │
│                    ┌───────▼───────┐                             │
│                    │  API Client   │                             │
│                    │  + WebSocket  │                             │
│                    └───────┬───────┘                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTP/WS
┌────────────────────────────┼─────────────────────────────────────┐
│                     Backend (FastAPI)                             │
│  ┌─────────────────────────▼─────────────────────────────┐      │
│  │                    API Layer                            │      │
│  │  /incidents  /triage  /cluster  /sync  /dashboard     │      │
│  └─────────────────────────┬─────────────────────────────┘      │
│                            │                                      │
│  ┌─────────────────────────▼─────────────────────────────┐      │
│  │                 Service Layer                           │      │
│  │  IncidentService │ TriageService │ SyncService        │      │
│  └─────────────────────────┬─────────────────────────────┘      │
│                            │                                      │
│  ┌─────────────────────────▼─────────────────────────────┐      │
│  │               Repository Layer                          │      │
│  │  IncidentRepo │ TriageRepo │ SyncRepo │ AuditRepo     │      │
│  └─────────────────────────┬─────────────────────────────┘      │
│                            │                                      │
│  ┌─────────────────────────▼─────────────────────────────┐      │
│  │              SQLite Database (aiosqlite)               │      │
│  │  incidents │ ai_triage │ sync_queue │ audit_logs      │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │              Ollama Service (HTTP client)                │      │
│  │              → http://ollama:11434/api/generate          │      │
│  └─────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Incident Creation Flow
1. User submits incident via Dashboard form
2. Frontend sends POST /api/incidents with FormData
3. IncidentService creates Incident record in SQLite
4. Sync queue entry added for future cloud sync
5. Audit log entry created
6. WebSocket broadcasts incident_update
7. Dashboard receives real-time update

### AI Triage Flow
1. User clicks "Run Triage" on an incident
2. Backend sends incident details to Ollama API
3. Ollama processes with Phi-3-mini and returns JSON
4. TriageService stores AI analysis in ai_triage table
5. Incident severity/status updated
6. Sync queue entry created
7. WebSocket broadcasts triage_update

### Sync Flow
1. All data written locally first (offline-first)
2. Sync queue tracks unsynchronized changes
3. When internet available, sync is triggered
4. SyncService processes queue items sequentially
5. Items marked synced on success
6. Audit trail maintained

## Self-Healing Architecture

- Kubernetes liveness/readiness probes detect failures
- Deployments use RollingUpdate strategy
- HPA auto-scales based on CPU/memory
- Pods automatically rescheduled on node failure
- Persistent volumes preserve data across restarts
- Multiple replicas ensure high availability

## Offline-First Design

- SQLite provides local persistence
- No cloud dependency for core operations
- All APIs function without internet
- Sync queue enables eventual consistency
- Ollama runs locally for AI inference
- Frontend fully functional offline
