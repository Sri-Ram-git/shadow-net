# ShadowNet 🔮

**Chaos-Resilient Edge Infrastructure for Emergency Response**

ShadowNet instantly transforms available laptops into an autonomous edge cloud during disasters. It operates completely offline, runs AI locally, stores emergency reports, auto-recovers from node failures, and syncs with cloud once internet returns.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ShadowNet Edge Cloud                │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   Node 1     │  │   Node 2     │  │   Node 3     ││
│  │  Control-Plane│  │  Worker      │  │  Worker      ││
│  │  Dashboard   │  │  Ollama AI   │  │  Backup AI   ││
│  │  API Server  │  │  Triage Svc  │  │  Failover    ││
│  │  SQLite DB   │  │  Containers  │  │  Pods        ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│         │                  │               │          │
│         └──────────────────┴───────────────┘          │
│                        │                              │
│               ┌────────┴────────┐                     │
│               │  K3s Cluster   │                     │
│               │  Self-Healing  │                     │
│               └─────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, TailwindCSS, Chart.js |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| AI | Ollama (Phi-3-mini / Llama 3.2) |
| Database | SQLite (offline-first) |
| Orchestration | K3s / Kubernetes |
| Container | Docker, Docker Compose |
| Monitoring | Prometheus, Grafana |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local dev)
- Node.js 18+ (for frontend dev)

### Development
```bash
# Clone and start
git clone https://github.com/Sri-Ram-git/shadow-net.git
cd shadow-net

# Start with Docker Compose
docker compose -f docker-compose.dev.yml up -d

# Or run locally:
# Backend
cd backend
pip install poetry && poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm install && npm run dev
```

### Production (K3s)
```bash
# Deploy to K3s cluster
kubectl apply -k k8s/base

# Monitor
kubectl get pods -n shadownet -w
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Dashboard statistics |
| GET | `/api/incidents` | List all incidents |
| POST | `/api/incidents` | Create incident |
| GET | `/api/incidents/{id}` | Get incident details |
| GET | `/api/triage/{id}` | Get AI triage result |
| POST | `/api/triage/{id}` | Run AI triage |
| GET | `/api/cluster` | Cluster metrics |
| GET | `/api/sync` | Sync queue status |
| POST | `/api/sync` | Trigger sync |

## Demo Scripts

```bash
# Simulate a disaster scenario
./scripts/simulate-disaster.sh

# Simulate node failure
./scripts/simulate-node-failure.sh

# Restore a failed node
./scripts/restore-node.sh

# Sync data to cloud
./scripts/sync-cloud.sh
```

## Project Structure

```
shadownet/
├── frontend/          # React + TypeScript UI
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API & WebSocket clients
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript definitions
│   └── ...
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Data access layer
│   │   └── core/        # Config, database
│   └── ...
├── k8s/               # Kubernetes manifests
│   ├── base/           # Core deployments
│   └── monitoring/     # Prometheus + Grafana
├── docker/            # Docker configs
├── docs/              # Documentation
├── scripts/           # Demo & utility scripts
└── .github/           # CI/CD workflows
```

## License

MIT
