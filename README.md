<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShadowNet — Autonomous Self-Healing Edge Infrastructure</title>
<style>
  /* ── Reset & Base ─────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: #050505; color: #e5e5e5; }
  body { font-family: 'Inter', system-ui, -apple-system, 'Helvetica Neue', sans-serif; max-width: 1040px; margin: 0 auto; padding: 3rem 2rem 6rem; line-height: 1.6; }
  a { color: #cccccc; text-decoration: none; border-bottom: 1px solid #2a2a2a; transition: border-color .2s; }
  a:hover { border-color: #666666; }
  h1, h2, h3, h4 { font-weight: 300; letter-spacing: -0.01em; color: #ffffff; line-height: 1.3; }
  h1 { font-size: 2.25rem; margin-bottom: .25rem; }
  h2 { font-size: 1.5rem; margin: 2.5rem 0 1rem; padding-bottom: .5rem; border-bottom: 1px solid #2a2a2a; }
  h3 { font-size: 1.125rem; margin: 1.75rem 0 .75rem; color: #cccccc; }
  h4 { font-size: .9375rem; margin: 1.25rem 0 .5rem; }
  p, li { color: #9a9a9a; }
  p { margin-bottom: .75rem; }
  ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
  li { margin-bottom: .25rem; }
  code { font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: .8125rem; background: #161616; color: #cccccc; padding: .125rem .5rem; border: 1px solid #2a2a2a; }
  pre { background: #101010; border: 1px solid #2a2a2a; padding: 1.25rem; overflow-x: auto; margin: 1rem 0; font-size: .8125rem; line-height: 1.5; }
  pre code { background: none; border: none; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .875rem; }
  th, td { text-align: left; padding: .625rem .75rem; border-bottom: 1px solid #1e1e1e; }
  th { font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: .6875rem; text-transform: uppercase; letter-spacing: .08em; color: #666666; font-weight: 500; background: #101010; }
  td { color: #9a9a9a; }
  tr:nth-child(even) td { background: #0a0a0a; }
  tr:hover td { background: #161616; }
  hr { border: none; border-top: 1px solid #2a2a2a; margin: 2rem 0; }
  img { max-width: 100%; border: 1px solid #2a2a2a; margin: 1rem 0; }
  blockquote { border-left: 2px solid #2a2a2a; padding: .75rem 1rem; margin: 1rem 0; background: #101010; color: #9a9a9a; font-size: .875rem; }

  /* ── Badges ───────────────────────────────────────── */
  .badge { display: inline-block; padding: .1875rem .5rem; font-size: .6875rem; font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; text-transform: uppercase; letter-spacing: .06em; border: 1px solid #2a2a2a; color: #9a9a9a; margin-right: .375rem; margin-bottom: .375rem; white-space: nowrap; }
  .badge-blue { border-color: #2b6ba4; color: #7ab7e0; }
  .badge-green { border-color: #2b7a42; color: #5cb87a; }
  .badge-amber { border-color: #a67c00; color: #d4a92a; }
  .badge-red { border-color: #c42b2b; color: #e06060; }

  /* ── Hero ─────────────────────────────────────────── */
  .hero { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #2a2a2a; }
  .hero h1 { font-size: 2.75rem; font-weight: 250; letter-spacing: -0.015em; margin-bottom: .5rem; }
  .hero .tagline { font-size: 1.125rem; color: #666666; margin-bottom: 1rem; font-weight: 300; }
  .hero .badge-row { margin-top: 1rem; }
  .hero .badge-row .badge { font-size: .625rem; }

  /* ── Feature grid ─────────────────────────────────── */
  .features { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1px; background: #2a2a2a; margin: 1.5rem 0; }
  .feature-card { background: #101010; padding: 1.5rem; }
  .feature-card h4 { font-size: .8125rem; text-transform: uppercase; letter-spacing: .08em; color: #ffffff; margin-bottom: .5rem; font-weight: 500; }
  .feature-card p { font-size: .8125rem; color: #9a9a9a; margin-bottom: 0; }

  /* ── Section headers ──────────────────────────────── */
  .section-label { display: inline-block; font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: .625rem; text-transform: uppercase; letter-spacing: .12em; color: #666666; margin-bottom: .5rem; }

  /* ── Details / Collapsible ────────────────────────── */
  details { background: #101010; border: 1px solid #2a2a2a; margin: .75rem 0; }
  details summary { padding: .75rem 1rem; cursor: pointer; font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: #cccccc; user-select: none; }
  details summary:hover { background: #161616; }
  details .details-body { padding: 1rem; border-top: 1px solid #2a2a2a; }
  details .details-body p:last-child { margin-bottom: 0; }

  /* ── Architecture diagram ─────────────────────────── */
  .arch { font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace; font-size: .75rem; line-height: 1.5; color: #9a9a9a; }
  .arch .box { display: inline-block; border: 1px solid #2a2a2a; padding: .5rem 1rem; text-align: center; min-width: 140px; }
  .arch .box-primary { border-color: #2b6ba4; color: #7ab7e0; }
  .arch .box-secondary { border-color: #2b7a42; color: #5cb87a; }
  .arch .box-tertiary { border-color: #a67c00; color: #d4a92a; }
  .arch .arrow { color: #444444; margin: .25rem 0; }
  .arch .row { display: flex; align-items: center; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin: .5rem 0; }
  .arch .connector { display: flex; flex-direction: column; align-items: center; color: #444444; font-size: .625rem; margin: 0 .5rem; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════ -->
<!--  HERO                                              -->
<!-- ═══════════════════════════════════════════════════ -->
<div class="hero">
  <div class="section-label">v2.4.1</div>
  <h1>ShadowNet</h1>
  <p class="tagline">Autonomous Self-Healing Edge Infrastructure for Emergency Response</p>
  <div class="badge-row">
    <span class="badge badge-blue">React 18</span>
    <span class="badge badge-blue">TypeScript</span>
    <span class="badge badge-blue">Vite</span>
    <span class="badge badge-blue">Tailwind CSS</span>
    <span class="badge badge-green">Python 3.13</span>
    <span class="badge badge-green">FastAPI</span>
    <span class="badge badge-green">SQLAlchemy</span>
    <span class="badge badge-amber">Ollama</span>
    <span class="badge badge-amber">Leaflet</span>
    <span class="badge">PostgreSQL</span>
    <span class="badge">SQLite</span>
    <span class="badge">WebSocket</span>
    <span class="badge badge-red">Demo Mode</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════ -->
<!--  TABLE OF CONTENTS                                 -->
<!-- ═══════════════════════════════════════════════════ -->

<h2>Table of Contents</h2>
<ol>
  <li><a href="#overview">Overview</a></li>
  <li><a href="#features">Key Features</a></li>
  <li><a href="#architecture">Architecture</a></li>
  <li><a href="#stack">Tech Stack</a></li>
  <li><a href="#quickstart">Quick Start</a></li>
  <li><a href="#deploy">Deployment Guide</a></li>
  <li><a href="#env">Environment Variables</a></li>
  <li><a href="#api">API Reference</a></li>
  <li><a href="#structure">Project Structure</a></li>
  <li><a href="#demo">Demo Mode</a></li>
  <li><a href="#ci">CI/CD</a></li>
  <li><a href="#roadmap">Roadmap</a></li>
  <li><a href="#license">License</a></li>
</ol>

<!-- ═══════════════════════════════════════════════════ -->
<!--  1.  OVERVIEW                                       -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="overview">Overview</h2>
<p>
  ShadowNet is a production-ready <strong>Emergency Operations Center (EOC) intelligence platform</strong>
  built with an offline-first edge architecture. It enables emergency response teams to
  triage incidents, analyze threats, manage cluster health, synchronize data across
  edge nodes, and control system behaviour — all through a single, unified console.
</p>
<p>
  Designed for <strong>zero external API dependencies</strong>, ShadowNet replaces Google Maps
  with a fully open-source map stack (OpenStreetMap + Leaflet + Nominatim + Overpass API)
  and supports local AI inference via Ollama with a demonstration mode for environments
  without GPU resources. Deploy to Vercel + Railway with a single push.
</p>

<blockquote>
  <strong>Zero API keys. Zero billing accounts. Fully open infrastructure.</strong>
</blockquote>

<!-- ═══════════════════════════════════════════════════ -->
<!--  2.  KEY FEATURES                                   -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="features">Key Features</h2>

<div class="features">

  <div class="feature-card">
    <h4>Incident Management</h4>
    <p>Create, categorize, and track incidents with severity (P1–P4), location, images, and real-time status updates broadcast via WebSocket.</p>
  </div>

  <div class="feature-card">
    <h4>AI-Powered Triage</h4>
    <p>Intelligence reports with executive summaries, hazard analysis, risk scoring, resource estimation, escalation forecasts, and reasoning trees — powered by Ollama or Demo Mode.</p>
  </div>

  <div class="feature-card">
    <h4>OpenStreetMap Location Picker</h4>
    <p>Full-featured location selection with Nominatim autocomplete, keyboard navigation, highlighted results, draggable marker, reverse geocoding, and Overpass API for nearby amenities.</p>
  </div>

  <div class="feature-card">
    <h4>Mission Control Console</h4>
    <p>11-section settings dashboard with toggle switches, progress bars, status cards, auto-save with inline saving indicators, and real-time WebSocket broadcast across all connected clients.</p>
  </div>

  <div class="feature-card">
    <h4>Real-Time Sync</h4>
    <p>WebSocket-powered synchronization queue with conflict resolution (timestamp-win), compression, encryption, and retry logic for offline-first operation.</p>
  </div>

  <div class="feature-card">
    <h4>Cluster Health Monitoring</h4>
    <p>Node-level metrics (CPU, RAM, pods), topology view with control-plane/worker roles, heartbeat tracking, and self-healing pod recovery automation.</p>
  </div>

  <div class="feature-card">
    <h4>Demo AI Mode</h4>
    <p>When <code>SHADOWNET_DEMO_MODE=true</code>, returns realistic synthetic analyses with a <code>[Demo AI]</code> badge — never shows errors, cycles through 3 operational scenarios.</p>
  </div>

  <div class="feature-card">
    <h4>Dual Database Support</h4>
    <p>SQLite for zero-config local development; auto-detects PostgreSQL via <code>DATABASE_URL</code> for production on Railway. Async drivers via aiosqlite + asyncpg.</p>
  </div>

  <div class="feature-card">
    <h4>System Persistence</h4>
    <p>All 24 settings persisted to a dedicated <code>system_settings</code> table with per-key validation (type/enum/range), audit trail (updated_by/updated_at), and batch update support.</p>
  </div>

  <div class="feature-card">
    <h4>Lazy-Loaded Routes</h4>
    <p>Every page is a separate chunk via <code>React.lazy()</code>. Initial bundle: 237 KB. Leaflet, Chart.js, and each page (3–22 KB) loaded on demand.</p>
  </div>

  <div class="feature-card">
    <h4>Centralized CSS System</h4>
    <p>All input/select/textarea/toggle/progress-bar CSS primitives live in <code>index.css</code> — every input across 10 pages shares identical h-40px height, border, focus animation, and typography.</p>
  </div>

</div>

<!-- ═══════════════════════════════════════════════════ -->
<!--  3.  ARCHITECTURE                                   -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="architecture">Architecture</h2>

<div class="arch">
  <div class="row">
    <div>
      <div class="box box-primary">Vercel<br><span style="font-size:.625rem;color:#666">Frontend</span></div>
      <div style="font-size:.625rem;color:#444;text-align:center;margin-top:.25rem">React 18 · Vite</div>
    </div>
    <div class="connector">
      <span>──→</span>
      <span style="font-size:.5625rem">HTTPS / WSS</span>
    </div>
    <div>
      <div class="box box-secondary">Railway<br><span style="font-size:.625rem;color:#666">Backend</span></div>
      <div style="font-size:.625rem;color:#444;text-align:center;margin-top:.25rem">FastAPI · Python 3.13</div>
    </div>
    <div class="connector">
      <span>──→</span>
      <span style="font-size:.5625rem">asyncpg</span>
    </div>
    <div>
      <div class="box box-tertiary">Railway PG<br><span style="font-size:.625rem;color:#666">Database</span></div>
    </div>
  </div>
  <div class="row" style="margin-top:1rem">
    <div style="color:#444;font-size:.6875rem;text-align:center;width:100%">Optional: <span style="color:#9a9a9a">Ollama</span> (local LLM inference) or <span style="color:#d4a92a">Demo Mode</span> (no GPU required)</div>
  </div>
</div>

<h3>Data Flow</h3>
<ol>
  <li><strong>Frontend</strong> (Vercel) serves the React SPA; all API calls proxy through <code>VITE_API_URL</code> → Railway backend</li>
  <li><strong>Backend</strong> (Railway) runs FastAPI with async SQLAlchemy; auto-detects PostgreSQL or SQLite from <code>DATABASE_URL</code></li>
  <li><strong>WebSocket</strong> connection established on app mount for real-time incident, cluster, sync, and settings updates</li>
  <li><strong>AI inference</strong> via Ollama HTTP API, or returns synthetic analyses when <code>SHADOWNET_DEMO_MODE=true</code></li>
  <li><strong>Settings</strong> stored in <code>system_settings</code> table; changes broadcast via WebSocket to all connected clients</li>
  <li><strong>Static files</strong> served by backend when <code>frontend/dist</code> is present (single-container deployment)</li>
</ol>

<!-- ═══════════════════════════════════════════════════ -->
<!--  4.  TECH STACK                                     -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="stack">Tech Stack</h2>

<table>
  <thead>
    <tr><th>Layer</th><th>Technology</th><th>Version</th><th>Purpose</th></tr>
  </thead>
  <tbody>
    <tr><td>Frontend</td><td>React</td><td>18.3.1</td><td>UI framework</td></tr>
    <tr><td>Frontend</td><td>TypeScript</td><td>5.5.3</td><td>Type safety</td></tr>
    <tr><td>Frontend</td><td>Vite</td><td>5.3.3</td><td>Build tool & dev server</td></tr>
    <tr><td>Frontend</td><td>Tailwind CSS</td><td>3.4.4</td><td>Utility CSS</td></tr>
    <tr><td>Frontend</td><td>React Router</td><td>6.24.1</td><td>Client-side routing</td></tr>
    <tr><td>Frontend</td><td>React Leaflet</td><td>4.2.1</td><td>Map component</td></tr>
    <tr><td>Frontend</td><td>Leaflet</td><td>1.9.4</td><td>Map rendering</td></tr>
    <tr><td>Frontend</td><td>Chart.js</td><td>4.4.3</td><td>Charts & statistics</td></tr>
    <tr><td>Frontend</td><td>Lucide React</td><td>0.395.0</td><td>Icons</td></tr>
    <tr><td>Frontend</td><td>Axios</td><td>1.7.2</td><td>HTTP client</td></tr>
    <tr><td>Frontend</td><td>React Hot Toast</td><td>2.4.1</td><td>Toast notifications</td></tr>
    <tr><td>Backend</td><td>Python</td><td>3.13</td><td>Runtime</td></tr>
    <tr><td>Backend</td><td>FastAPI</td><td>0.111.0</td><td>Web framework</td></tr>
    <tr><td>Backend</td><td>Uvicorn</td><td>0.30.1</td><td>ASGI server</td></tr>
    <tr><td>Backend</td><td>SQLAlchemy</td><td>2.0.31</td><td>ORM</td></tr>
    <tr><td>Backend</td><td>aiosqlite</td><td>0.20.0</td><td>SQLite async driver</td></tr>
    <tr><td>Backend</td><td>asyncpg</td><td>0.29.0</td><td>PostgreSQL async driver</td></tr>
    <tr><td>Backend</td><td>Pydantic</td><td>2.8.2</td><td>Validation</td></tr>
    <tr><td>Backend</td><td>httpx</td><td>0.27.0</td><td>Async HTTP client</td></tr>
    <tr><td>AI</td><td>Ollama</td><td>—</td><td>Local LLM inference</td></tr>
    <tr><td>Maps</td><td>OpenStreetMap / Nominatim</td><td>—</td><td>Geocoding & tiles</td></tr>
    <tr><td>Infra</td><td>Vercel</td><td>—</td><td>Frontend hosting</td></tr>
    <tr><td>Infra</td><td>Railway</td><td>—</td><td>Backend + PostgreSQL</td></tr>
    <tr><td>Infra</td><td>Docker</td><td>—</td><td>Containerization</td></tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════ -->
<!--  5.  QUICK START                                    -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="quickstart">Quick Start</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Node.js 20+</li>
  <li>Python 3.11+</li>
  <li>Poetry (<code>pip install poetry</code>)</li>
  <li><em>Optional:</em> <a href="https://ollama.com">Ollama</a> with a model (e.g. <code>ollama pull phi3:mini</code>)</li>
</ul>

<h3>Frontend</h3>
<pre><code>cd frontend
npm install
npm run dev            # → http://localhost:5173</code></pre>

<h3>Backend</h3>
<pre><code>cd backend
poetry install
poetry run uvicorn app.main:app --port 8001 --reload</code></pre>

<p>The Vite dev server proxies <code>/api</code> → <code>localhost:8001</code>. Open <code>http://localhost:5173</code> to see the app.</p>

<h3>Using Docker Compose (Production-like)</h3>
<pre><code>docker compose up --build</code></pre>
<p>Starts backend (Python 3.13), frontend build, and an optional Ollama container. Backend serves static frontend files at <code>http://localhost:8000</code>.</p>

<details>
  <summary>Development Compose</summary>
  <div class="details-body">
<pre><code>docker compose -f docker-compose.dev.yml up --build</code></pre>
    <p>Starts backend with hot-reload, frontend dev server with Vite HMR, and an Ollama container.</p>
  </div>
</details>

<!-- ═══════════════════════════════════════════════════ -->
<!--  6.  DEPLOYMENT GUIDE                               -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="deploy">Deployment Guide</h2>

<h3>1. Vercel (Frontend)</h3>
<p>Connect the repository to Vercel with these settings:</p>
<table>
  <thead><tr><th>Setting</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Framework</td><td>Vite</td></tr>
    <tr><td>Root Directory</td><td><code>frontend</code></td></tr>
    <tr><td>Build Command</td><td><code>npm run build</code></td></tr>
    <tr><td>Output Directory</td><td><code>dist</code></td></tr>
    <tr><td>Environment</td><td><code>VITE_API_URL=https://your-backend.up.railway.app</code></td></tr>
  </tbody>
</table>
<p>Vercel's SPA rewrites are handled by <code>frontend/vercel.json</code> — all routes redirect to <code>index.html</code>.</p>

<h3>2. Railway (Backend + Database)</h3>
<p>Deploy the repository root to Railway:</p>
<table>
  <thead><tr><th>Setting</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Build Command</td><td><code>cd backend && pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi</code></td></tr>
    <tr><td>Start Command</td><td><code>cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers</code></td></tr>
    <tr><td>Health Check Path</td><td><code>/api/health</code></td></tr>
    <tr><td>Health Check Timeout</td><td>30s</td></tr>
  </tbody>
</table>
<p>Add a <strong>PostgreSQL</strong> plugin from the Railway dashboard — the backend auto-detects <code>DATABASE_URL</code> and switches from SQLite.</p>

<h3>3. Single-Container Deployment</h3>
<p>The Dockerfile builds frontend assets into the backend image. When <code>frontend/dist</code> is present, the backend serves static files at <code>/</code> — no separate frontend hosting needed.</p>

<pre><code>docker build -t shadownet-api .
docker run -p 8000:8000 shadownet-api</code></pre>

<details>
  <summary>Railway Configuration (<code>railway.toml</code>)</summary>
  <div class="details-body">
<pre><code>[build]
builder = "nixpacks"
buildCommand = "cd backend && pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev --no-interaction --no-ansi"

[deploy]
startCommand = "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2 --proxy-headers"
healthcheckPath = "/api/health"
healthcheckTimeout = 30</code></pre>
  </div>
</details>

<!-- ═══════════════════════════════════════════════════ -->
<!--  7.  ENVIRONMENT VARIABLES                          -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="env">Environment Variables</h2>
<p>Configured via <code>.env</code> file (local) or Railway environment dashboard (production).</p>
<table>
  <thead><tr><th>Variable</th><th>Default</th><th>Required</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>SHADOWNET_DATABASE_URL</code></td><td><code>sqlite+aiosqlite:///data/shadownet.db</code></td><td>❌</td><td>Connection string. Auto-detects PostgreSQL via <code>DATABASE_URL</code> on Railway.</td></tr>
    <tr><td><code>SHADOWNET_OLLAMA_ENDPOINT</code></td><td><code>http://ollama:11434</code></td><td>❌</td><td>Ollama server URL. Omit when using Demo Mode.</td></tr>
    <tr><td><code>SHADOWNET_OLLAMA_MODEL</code></td><td><code>phi3:mini</code></td><td>❌</td><td>Ollama model name.</td></tr>
    <tr><td><code>SHADOWNET_DEMO_MODE</code></td><td><code>false</code></td><td>❌</td><td>Set <code>true</code> when no Ollama is available. Returns synthetic AI analyses.</td></tr>
    <tr><td><code>SHADOWNET_CORS_ORIGINS</code></td><td><code>*</code></td><td>❌</td><td>Comma-separated allowed origins for CORS.</td></tr>
    <tr><td><code>SHADOWNET_LOG_LEVEL</code></td><td><code>INFO</code></td><td>❌</td><td><code>DEBUG</code>, <code>INFO</code>, <code>WARN</code>, <code>ERROR</code>.</td></tr>
    <tr><td><code>SHADOWNET_DEBUG</code></td><td><code>false</code></td><td>❌</td><td>Enable debug mode.</td></tr>
    <tr><td><code>SHADOWNET_SYNC_INTERVAL_SECONDS</code></td><td><code>60</code></td><td>❌</td><td>Interval between sync cycles.</td></tr>
    <tr><td><code>SHADOWNET_MAX_SYNC_RETRIES</code></td><td><code>5</code></td><td>❌</td><td>Maximum retry attempts for failed syncs.</td></tr>
    <tr><td><code>SHADOWNET_SECRET_KEY</code></td><td>dev-only</td><td>❌</td><td>Change in production. Used for session security.</td></tr>
    <tr><td><code>VITE_API_URL</code></td><td><em>auto</em></td><td>❌</td><td>Frontend env var. Points to Railway backend URL. Falls back to <code>window.location</code> or <code>localhost:8001</code>.</td></tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════ -->
<!--  8.  API REFERENCE                                  -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="api">API Reference</h2>
<p>All endpoints are prefixed with <code>/api</code>.</p>

<h3>Health</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/health</code></td><td>Health check. Returns status, version, and uptime.</td></tr>
  </tbody>
</table>

<h3>Dashboard</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/dashboard</code></td><td>Aggregated stats: total/critical incidents, cluster health, storage, sync status, recent incidents.</td></tr>
  </tbody>
</table>

<h3>Incidents</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/incidents</code></td><td>List all incidents.</td></tr>
    <tr><td><code>POST</code></td><td><code>/incidents</code></td><td>Create incident (multipart/form-data with optional image).</td></tr>
    <tr><td><code>GET</code></td><td><code>/incidents/{id}</code></td><td>Get incident by ID.</td></tr>
  </tbody>
</table>

<h3>AI Triage</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/triage/{incident_id}</code></td><td>Get existing triage analysis.</td></tr>
    <tr><td><code>POST</code></td><td><code>/triage/{incident_id}</code></td><td>Run new AI triage analysis.</td></tr>
  </tbody>
</table>

<h3>Cluster</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/cluster</code></td><td>Cluster metrics: nodes, pods, CPU/memory, network health.</td></tr>
  </tbody>
</table>

<h3>Sync</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/sync</code></td><td>Sync queue items with status.</td></tr>
    <tr><td><code>POST</code></td><td><code>/sync</code></td><td>Trigger a sync cycle.</td></tr>
  </tbody>
</table>

<h3>Settings</h3>
<table>
  <thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>GET</code></td><td><code>/settings</code></td><td>All settings (keys + values).</td></tr>
    <tr><td><code>GET</code></td><td><code>/settings/{key}</code></td><td>Single setting value.</td></tr>
    <tr><td><code>PUT</code></td><td><code>/settings/{key}</code></td><td>Update setting (validates, persists, broadcasts via WebSocket).</td></tr>
    <tr><td><code>POST</code></td><td><code>/settings/batch</code></td><td>Batch update multiple settings with per-key error reporting.</td></tr>
  </tbody>
</table>

<h3>WebSocket</h3>
<table>
  <thead><tr><th>Path</th><th>Events</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>/api/ws</code></td><td><code>incident_update</code>, <code>cluster_update</code>, <code>sync_update</code>, <code>triage_update</code>, <code>settings_changed</code>, <code>notification</code></td><td>Real-time event stream. Auto-reconnects with 5s backoff.</td></tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════ -->
<!--  9.  PROJECT STRUCTURE                              -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="structure">Project Structure</h2>

<details>
  <summary>Frontend (<code>frontend/</code>)</summary>
  <div class="details-body">
<pre><code>frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx          # Shell with sidebar + topbar
│   │   ├── LocationPicker.tsx  # Leaflet + Nominatim + Overpass
│   │   ├── SearchInput.tsx     # Reusable search input (h-10)
│   │   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   │   └── ...
│   ├── pages/              # Route-level page components
│   │   ├── Dashboard.tsx       # Stats + recent incidents
│   │   ├── LiveIncidents.tsx   # Incident list
│   │   ├── CreateIncident.tsx  # Form with LocationPicker
│   │   ├── AITriage.tsx        # Intelligence report
│   │   ├── ClusterHealth.tsx   # Node topology
│   │   ├── SyncStatus.tsx      # Sync queue
│   │   ├── Settings.tsx        # Mission Control (11 sections)
│   │   ├── Statistics.tsx      # Charts
│   │   └── NotFound.tsx        # 404
│   ├── contexts/
│   │   └── SystemConfig.tsx    # Settings context with WebSocket sync
│   ├── services/
│   │   ├── api.ts              # Axios instance + all API calls
│   │   └── websocket.ts        # WebSocket service with reconnect
│   ├── hooks/              # Custom hooks
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces
│   ├── App.tsx             # Lazy-loaded routes + providers
│   └── index.css           # Tailwind + all CSS primitives
├── vercel.json             # SPA rewrites
├── vite.config.ts          # Dev proxy + build config
├── tailwind.config.js      # Dark theme palette
└── package.json</code></pre>
  </div>
</details>

<details>
  <summary>Backend (<code>backend/</code>)</summary>
  <div class="details-body">
<pre><code>backend/
├── app/
│   ├── main.py                # FastAPI app, lifespan, seed_data()
│   ├── api/
│   │   ├── router.py          # Route registration
│   │   ├── ws.py              # WebSocket connection manager
│   │   ├── dashboard.py       # Dashboard stats endpoint
│   │   ├── incidents.py       # CRUD + upload
│   │   ├── triage.py          # AI analysis endpoint
│   │   ├── cluster.py         # Cluster metrics
│   │   ├── sync.py            # Sync queue
│   │   └── settings.py        # Settings CRUD + batch + broadcast
│   ├── core/
│   │   ├── config.py          # Pydantic Settings (SHADOWNET_*)
│   │   └── database.py        # Async engine + session + auto-detect
│   ├── models/
│   │   ├── incident.py        # Incident SQLAlchemy model
│   │   ├── system_setting.py  # SystemSetting (key/value) model
│   │   └── ...
│   ├── repositories/          # Data access layer
│   │   ├── incident_repository.py
│   │   ├── settings_repository.py
│   │   └── ...
│   └── services/
│       ├── ollama_service.py  # AI engine + Demo Mode + fallback
│       └── settings_service.py # 24 defaults + validation rules
├── data/                      # SQLite DB + uploads (gitignored)
├── pyproject.toml             # Poetry dependencies
└── poetry.lock</code></pre>
  </div>
</details>

<details>
  <summary>Root</summary>
  <div class="details-body">
<pre><code>.github/workflows/ci.yml   # Frontend build + backend syntax + Docker
Dockerfile                   # 3-stage build (Python 3.13)
docker-compose.yml           # Production composition
docker-compose.dev.yml       # Dev composition with hot-reload
railway.toml                 # Railway build/deploy config
.env.example                 # All SHADOWNET_* variables
README.md</code></pre>
  </div>
</details>

<!-- ═══════════════════════════════════════════════════ -->
<!--  10.  DEMO MODE                                     -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="demo">Demo Mode</h2>

<p>
  When <code>SHADOWNET_DEMO_MODE=true</code>, the AI engine returns realistic synthetic analyses without
  contacting any Ollama server. This makes the application fully functional in environments
  without GPU resources or local LLM inference.
</p>

<h3>Behaviour</h3>
<ul>
  <li>Returns one of 3 realistic scenarios: <strong>Wildfire</strong>, <strong>Mass Casualty Traffic Incident</strong>, or <strong>Infrastructure Failure</strong></li>
  <li>Cycles through scenarios on each request (round-robin)</li>
  <li>Source marked as <code>"AI Intelligence Report (Demo)"</code> with a <code>[Demo AI]</code> badge in the UI</li>
  <li>Reasoning tree prepended with a demo-mode disclosure node</li>
  <li>Follows the full JSON schema: executive summary, confirmed facts, professional assessment, hazard/risk analysis, recommendations, resource estimation, escalation forecast, reasoning tree</li>
  <li>Never shows errors — gracefully degrades to structured fallback if anything goes wrong</li>
</ul>

<h3>When to Use</h3>
<ul>
  <li><strong>Hackathons / Demos</strong> — no GPU, no Ollama setup, instant functionality</li>
  <li><strong>CI/CD pipelines</strong> — avoid external service dependencies in tests</li>
  <li><strong>Frontend development</strong> — realistic data without running AI infrastructure</li>
</ul>

<h3>Fallback Chain</h3>
<p>In production mode (<code>DEMO_MODE=false</code>), the AI engine:</p>
<ol>
  <li>Tries Ollama with a structured prompt and 120s timeout</li>
  <li>If Ollama returns valid JSON → validates and returns</li>
  <li>If Ollama returns incomplete data → structured fallback with inferred type</li>
  <li>If Ollama is unreachable → structured fallback with <code>"Incident Report (Fallback)"</code> source</li>
</ol>

<!-- ═══════════════════════════════════════════════════ -->
<!--  11.  CI/CD                                         -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="ci">CI/CD</h2>

<p>GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to <code>main</code>:</p>

<table>
  <thead><tr><th>Job</th><th>Steps</th></tr></thead>
  <tbody>
    <tr><td><strong>Frontend Build</strong></td><td>Node 20 → <code>npm ci</code> → <code>npm run build</code> → uploads <code>frontend/dist</code> artifact</td></tr>
    <tr><td><strong>Backend Build</strong></td><td>Python 3.13 → install Poetry → install deps → syntax check (<code>py_compile</code>)</td></tr>
    <tr><td><strong>Docker Build</strong></td><td>Only on <code>main</code> → <code>docker build -t shadownet-api</code></td></tr>
  </tbody>
</table>

<details>
  <summary>View workflow YAML</summary>
  <div class="details-body">
<pre><code>name: ShadowNet CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4 with: { node-version: 20, cache: npm, cache-dependency-path: frontend/package-lock.json }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4 with: { name: frontend-dist, path: frontend/dist }
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5 with: { python-version: "3.13", cache: pip }
      - run: pip install poetry
      - run: poetry config virtualenvs.create false
      - run: poetry install --no-interaction --no-ansi
      - run: python -m py_compile app/main.py
  docker:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t shadownet-api .</code></pre>
  </div>
</details>

<!-- ═══════════════════════════════════════════════════ -->
<!--  12.  ROADMAP                                       -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="roadmap">Roadmap</h2>

<table>
  <thead><tr><th>Feature</th><th>Status</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Incident CRUD + Image Upload</td><td>✅ Done</td><td>Multipart form with location, categories, severity</td></tr>
    <tr><td>AI-Powered Triage (Ollama)</td><td>✅ Done</td><td>Full JSON schema: summary, hazards, risks, resources, forecast, reasoning tree</td></tr>
    <tr><td>Demo AI Mode</td><td>✅ Done</td><td>3 synthetic scenarios, round-robin, no errors</td></tr>
    <tr><td>OpenStreetMap Location Picker</td><td>✅ Done</td><td>Nominatim autocomplete + reverse, Overpass nearby, keyboard nav, drag</td></tr>
    <tr><td>Mission Control (Settings)</td><td>✅ Done</td><td>11 sections, auto-save, WebSocket broadcast, validation, 24 defaults</td></tr>
    <tr><td>Real-Time WebSocket Sync</td><td>✅ Done</td><td>6 event types, auto-reconnect, conflict resolution</td></tr>
    <tr><td>Cluster Health Dashboard</td><td>✅ Done</td><td>Node topology, CPU/RAM, pod recovery, heartbeat</td></tr>
    <tr><td>Statistics & Charts</td><td>✅ Done</td><td>Chart.js, severity/category breakdowns</td></tr>
    <tr><td>Docker / Railway / Vercel Deploy</td><td>✅ Done</td><td>Single-image or split deployment</td></tr>
    <tr><td>PostgreSQL Support</td><td>✅ Done</td><td>Auto-detected via DATABASE_URL</td></tr>
    <tr><td>CI/CD Pipeline</td><td>✅ Done</td><td>GitHub Actions: frontend build + backend syntax + Docker</td></tr>
    <tr><td>Lazy-Loaded Routes</td><td>✅ Done</td><td>React.lazy(), per-page chunks ~3–22 KB</td></tr>
    <tr><td>Centralized CSS Primitive System</td><td>✅ Done</td><td>All inputs consistent via index.css base layer</td></tr>
    <tr><td>Approve / Escalate / Dispatch</td><td>🔜 Planned</td><td>Action workflow for AITriage page</td></tr>
    <tr><td>Proper PDF Export</td><td>🔜 Planned</td><td>Replace <code>window.print()</code> with jsPDF or similar</td></tr>
    <tr><td>User Authentication</td><td>🔜 Planned</td><td>JWT-based auth with role-based access control</td></tr>
    <tr><td>Edge Node Agent</td><td>🔜 Planned</td><td>Lightweight agent for edge device registration and health reporting</td></tr>
    <tr><td>Unit + Integration Tests</td><td>🔜 Planned</td><td>pytest backend, Vitest frontend</td></tr>
    <tr><td>Web Push Notifications</td><td>🔜 Planned</td><td>Service worker + push API for critical alerts</td></tr>
  </tbody>
</table>

<!-- ═══════════════════════════════════════════════════ -->
<!--  13.  DATABASE SCHEMA                               -->
<!-- ═══════════════════════════════════════════════════ -->
<details>
  <summary>Database Schema Reference</summary>
  <div class="details-body">

<h3>incidents</h3>
<table>
  <thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>id</td><td>UUID</td><td>Primary key</td></tr>
    <tr><td>title</td><td>String</td><td>—</td></tr>
    <tr><td>description</td><td>Text</td><td>—</td></tr>
    <tr><td>location</td><td>String</td><td>Display address</td></tr>
    <tr><td>category</td><td>String</td><td>Comma-separated: fire,medical,flood,earthquake,infrastructure,hazard,other</td></tr>
    <tr><td>severity</td><td>String</td><td>P1–P4</td></tr>
    <tr><td>status</td><td>String</td><td>open, triaging, dispatched, resolved</td></tr>
    <tr><td>latitude / longitude</td><td>Float</td><td>Nullable</td></tr>
    <tr><td>city / state / country / postal_code / place_id / landmark</td><td>String</td><td>Nullable</td></tr>
    <tr><td>image_url</td><td>String</td><td>Nullable</td></tr>
    <tr><td>timestamp</td><td>DateTime</td><td>UTC</td></tr>
    <tr><td>synced</td><td>Boolean</td><td>Offline sync flag</td></tr>
  </tbody>
</table>

<h3>system_settings</h3>
<table>
  <thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>key</td><td>String</td><td>Primary key</td></tr>
    <tr><td>value</td><td>Text</td><td>String-serialized value</td></tr>
    <tr><td>updated_at</td><td>DateTime</td><td>Auto-set on upsert</td></tr>
    <tr><td>updated_by</td><td>String</td><td>Operator or system identifier</td></tr>
  </tbody>
</table>

  </div>
</details>

<!-- ═══════════════════════════════════════════════════ -->
<!--  14.  LICENSE                                       -->
<!-- ═══════════════════════════════════════════════════ -->
<h2 id="license">License</h2>
<p>MIT</p>

<p style="margin-top:3rem;font-size:.75rem;color:#444;border-top:1px solid #2a2a2a;padding-top:1rem">
  ShadowNet v2.4.1 — Built for emergency response. Zero API keys required.
</p>

</body>
</html>
