# Multi-stage build for ShadowNet

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Stage 2: Install backend dependencies
FROM python:3.13-slim AS backend-deps
WORKDIR /app
RUN pip install --no-cache-dir poetry
COPY backend/pyproject.toml backend/poetry.lock ./
RUN poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi

# Stage 3: Production image
FROM python:3.13-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-deps /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
ENV SHADOWNET_DATABASE_URL=sqlite+aiosqlite:////data/shadownet.db
ENV SHADOWNET_OLLAMA_ENDPOINT=http://ollama:11434
ENV SHADOWNET_LOG_LEVEL=INFO
ENV SHADOWNET_CORS_ORIGINS=*

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:${PORT:-8000}/api/health/live || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2 --proxy-headers
