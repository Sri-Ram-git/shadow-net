import { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSystemConfig } from '../contexts/SystemConfig';
import toast from 'react-hot-toast';

/* ─── Toggle ───────────────────────────────────────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}

/* ─── Select ───────────────────────────────────────── */

function Select<T extends string>({ value, onChange, options, className = '' }: { value: T; onChange: (v: T) => void; options: T[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`select text-xs w-auto min-w-[110px] ${className}`}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ─── Progress bar ─────────────────────────────────── */

function ProgressBar({ value, label }: { value: number; label?: string }) {
  const color = value >= 85 ? 'bg-critical' : value >= 60 ? 'bg-warning' : 'bg-safe';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">{label || 'Usage'}</span>
        <span className="text-[11px] font-mono text-ink-400">{value}%</span>
      </div>
      <div className="progress-bar"><div className={`progress-fill ${color}`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

/* ─── Status badge ─────────────────────────────────── */

function StatusBadge({ status, label }: { status: 'healthy' | 'warning' | 'critical' | 'online' | 'offline' | 'running' | 'stopped' | 'active' | 'inactive'; label?: string }) {
  const dotColors: Record<string, string> = {
    healthy: 'bg-safe', warning: 'bg-warning', critical: 'bg-critical',
    online: 'bg-safe', offline: 'bg-ink-500',
    running: 'bg-safe', stopped: 'bg-critical',
    active: 'bg-safe', inactive: 'bg-ink-500',
  };
  const labelColors: Record<string, string> = {
    healthy: 'text-safe', warning: 'text-warning', critical: 'text-critical',
    online: 'text-safe', offline: 'text-ink-500',
    running: 'text-safe', stopped: 'text-critical',
    active: 'text-safe', inactive: 'text-ink-500',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-1.5 h-1.5 ${dotColors[status] || 'bg-ink-500'}`} />
      <span className={`text-[11px] font-mono uppercase tracking-[0.06em] ${labelColors[status] || 'text-ink-400'}`}>{label || status}</span>
    </span>
  );
}

/* ─── Status card ──────────────────────────────────── */

type StatusType = 'healthy' | 'warning' | 'critical' | 'online' | 'offline' | 'running' | 'stopped' | 'active' | 'inactive';

function StatusCard({ label, value, status, sub }: { label: string; value: string; status?: StatusType; sub?: string }) {
  return (
    <div className="bg-surface-200 border border-border px-4 py-3">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-mono text-ink-500 uppercase tracking-[0.08em]">{label}</span>
        {status && <StatusBadge status={status} />}
      </div>
      <span className="text-sm text-ink font-medium">{value}</span>
      {sub && <span className="text-[11px] text-ink-400 block mt-0.5">{sub}</span>}
    </div>
  );
}

/* ─── Action button ────────────────────────────────── */

function ActionBtn({ children, onClick, variant }: { children: string; onClick?: () => void; variant?: 'primary' | 'danger' }) {
  const base = 'px-3 py-1.5 text-[11px] font-mono border transition-colors duration-150 bg-transparent';
  const styles: Record<string, string> = {
    primary: 'border-ink text-ink hover:bg-ink hover:text-surface',
    danger: 'border-critical/40 text-critical-300 hover:border-critical hover:text-critical',
  };
  return <button type="button" onClick={onClick} className={`${base} ${styles[variant || 'primary'] || styles.primary}`}>{children}</button>;
}

/* ─── Collapsible section ──────────────────────────── */

function Section({ icon, title, defaultOpen = false, children, status }: { icon: React.ReactNode; title: string; defaultOpen?: boolean; children: React.ReactNode; status?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-100 border border-border">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-200/50 transition-colors duration-150">
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 text-ink-500 shrink-0">{icon}</span>
          <span className="text-[11px] font-semibold text-ink uppercase tracking-[0.1em]">{title}</span>
          {status && <span className="ml-2">{status}</span>}
        </div>
        <svg className={`w-3.5 h-3.5 text-ink-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-2 border-t border-border">{children}</div>}
    </div>
  );
}

/* ─── Main component ───────────────────────────────── */

export function Settings() {
  useDocumentTitle('System Control');
  const { get, getBool, set, saveState, loading } = useSystemConfig();

  const doAction = (label: string, ms = 600) => {
    toast.promise(new Promise((r) => setTimeout(r, ms)), { loading: `${label}…`, success: `${label} — done`, error: 'Failed' });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-10 animate-fade">
        <div className="border-b border-border pb-6 mb-8">
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-3 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 animate-fade space-y-8">

      {/* Header */}
      <div className="border-b border-border pb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-5 h-5 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <h1 className="text-[1.625rem] font-light tracking-[-0.01em] text-ink">System Control</h1>
          </div>
          <p className="text-sm text-ink-300 font-[350] ml-8">Mission Configuration Console</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-ink-500">Status</span>
          {saveState === 'saving' && <span className="text-warning animate-pulse">Saving…</span>}
          {saveState === 'saved' && <span className="text-safe">Saved</span>}
          {saveState === 'error' && <span className="text-critical">Failed to save</span>}
          {saveState === 'idle' && <span className="text-ink-500">—</span>}
        </div>
      </div>

      {/* ─── Overview (open by default) ──────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="8" height="8" rx="2" /><rect x="14" y="14" width="8" height="8" rx="2" /></svg>
      } title="System Overview" defaultOpen status={
        <span className="inline-flex items-center gap-2">
          <StatusBadge status={get('self_healing') === 'true' ? 'active' : 'inactive'} label="Self-Healing" />
          <StatusBadge status={get('sync_mode') === 'online' ? 'online' : 'offline'} label={get('sync_mode')} />
        </span>
      }>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard label="System Health" value="Operational" status="healthy" sub={`ShadowNet ${get('theme') === 'dark' ? 'Dark' : 'Light'} · Edge Node`} />
          <StatusCard label="AI Engine" value={get('ai_model')} status="running" sub="Responding · 42 ms avg" />
          <StatusCard label="Cluster" value="12 Connected" status="healthy" sub={`${get('heartbeat_interval')}ms heartbeat`} />
          <StatusCard label="Sync" value={get('sync_mode') === 'online' ? 'Online' : 'Offline'} status="online" sub="0 pending · 0 failed" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatusCard label="Database" value="SQLite" status="healthy" sub="24.7 MB · Connected" />
          <StatusCard label="Mode" value={get('self_healing') === 'true' ? 'Auto-Heal' : 'Manual'} status={get('self_healing') === 'true' ? 'active' : 'inactive'} />
          <StatusCard label="Last Sync" value="Just now" sub="2026-06-28 11:48 UTC" />
          <StatusCard label="Node Count" value="12" sub="3 control · 9 worker" />
        </div>
      </Section>

      {/* ─── AI Engine ──────────────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" /><path d="M18 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" /><path d="M8 16v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" /></svg>
      } title="AI Engine">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <StatusBadge status="running" label="Running" />
            <span className="text-[11px] font-mono text-ink-400">{get('ai_model')}</span>
            <span className="text-[11px] font-mono text-ink-500">Temperature: {get('ai_temperature')} · Max Tokens: {get('ai_max_tokens')}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">Model</span>
              <Select value={get('ai_model') as 'phi3:mini' | 'llama3:latest' | 'mistral:latest'} onChange={(v) => set('ai_model', v)} options={['phi3:mini', 'llama3:latest', 'mistral:latest']} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">Temperature</span>
              <input type="number" value={get('ai_temperature')} onChange={(e) => set('ai_temperature', e.target.value)}
                className="input w-20 text-xs text-center" min={0} max={2} step={0.1} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">Max Tokens</span>
              <input type="number" value={get('ai_max_tokens')} onChange={(e) => set('ai_max_tokens', e.target.value)}
                className="input w-24 text-xs text-center" min={128} max={32768} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <ActionBtn onClick={() => doAction('Restart AI')}>Restart AI</ActionBtn>
            <ActionBtn onClick={() => doAction('Reload Model')}>Reload Model</ActionBtn>
            <ActionBtn variant="primary" onClick={() => doAction('AI Diagnostics')}>Run Diagnostics</ActionBtn>
          </div>
        </div>
      </Section>

      {/* ─── Cluster ────────────────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3M4 7v13M4 7H2M22 7h-2M4 11h16M4 15h8M4 19h16" /></svg>
      } title="Cluster">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusCard label="Cluster" value="shadow-net-prod-01" status="healthy" />
            <StatusCard label="Nodes" value="12" sub="3 control · 9 worker" />
            <StatusCard label="Leader" value="sn-edge-03a7f2" />
            <StatusCard label="Heartbeat" value={`${get('heartbeat_interval')} ms`} />
          </div>

          {/* Toggles with explanations */}
          <div className="space-y-3 pt-2">
            <div className="bg-surface-200 border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="setting-row-label">Self-Healing</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">Automatically recreates failed services to maintain operational integrity.</div>
                  <div className="text-[10px] font-mono text-ink-400 mt-1">
                    <span className="text-ink-500">State:</span> {getBool('self_healing') ? 'Enabled' : 'Disabled'}
                    {' · '}
                    <span className="text-ink-500">Impact:</span> {getBool('self_healing') ? 'Automatic recovery on failure' : 'Manual intervention required'}
                  </div>
                </div>
                <Toggle checked={getBool('self_healing')} onChange={(v) => set('self_healing', String(v))} />
              </div>
            </div>
            <div className="bg-surface-200 border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="setting-row-label">Pod Recovery</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">Restart failed pods automatically without operator intervention.</div>
                  <div className="text-[10px] font-mono text-ink-400 mt-1">
                    <span className="text-ink-500">State:</span> {getBool('pod_recovery') ? 'Enabled' : 'Disabled'}
                    {' · '}
                    <span className="text-ink-500">Impact:</span> {getBool('pod_recovery') ? 'Pods restart within 5s of failure' : 'Manual pod recovery required'}
                  </div>
                </div>
                <Toggle checked={getBool('pod_recovery')} onChange={(v) => set('pod_recovery', String(v))} />
              </div>
            </div>
            <div className="bg-surface-200 border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="setting-row-label">Replication</div>
                  <div className="text-[11px] text-ink-500 mt-0.5">Replicate incident data across all cluster nodes for resilience.</div>
                  <div className="text-[10px] font-mono text-ink-400 mt-1">
                    <span className="text-ink-500">State:</span> {getBool('replication_enabled') ? 'Enabled' : 'Disabled'}
                    {' · '}
                    <span className="text-ink-500">Impact:</span> {getBool('replication_enabled') ? 'Data replicated to 9 workers' : 'Single-node data only'}
                  </div>
                </div>
                <Toggle checked={getBool('replication_enabled')} onChange={(v) => set('replication_enabled', String(v))} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <ActionBtn onClick={() => doAction('Cluster Diagnostics')}>Cluster Diagnostics</ActionBtn>
            <ActionBtn onClick={() => doAction('Reconnect Nodes')}>Reconnect Nodes</ActionBtn>
          </div>
        </div>
      </Section>

      {/* ─── Offline Sync ───────────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
      } title="Offline Sync" status={
        <StatusBadge status={get('sync_mode') === 'online' ? 'online' : 'offline'} label={get('sync_mode')} />
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusCard label="Mode" value={get('sync_mode') === 'online' ? 'Online' : 'Offline'} status={get('sync_mode') === 'online' ? 'online' : 'offline'} />
            <StatusCard label="Pending" value="0 items" sub="Queue is empty" />
            <StatusCard label="Last Sync" value="Just now" sub="2026-06-28 11:48 UTC" />
            <StatusCard label="Failed" value="0" status="healthy" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">Mode</span>
            <Select value={get('sync_mode') as 'online' | 'offline'} onChange={(v) => set('sync_mode', v)} options={['online', 'offline']} />
          </div>
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
            <ActionBtn variant="primary" onClick={() => doAction('Sync Now')}>Sync Now</ActionBtn>
            <ActionBtn onClick={() => doAction('Retry Failed')}>Retry Failed</ActionBtn>
          </div>
        </div>
      </Section>

      {/* ─── Diagnostics ────────────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" /></svg>
      } title="Diagnostics">
        <div className="space-y-5">
          <ProgressBar value={34} label="CPU" />
          <ProgressBar value={62} label="RAM" />
          <ProgressBar value={71} label="Disk" />
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
            <StatusCard label="Network" value="Connected" status="online" />
            <StatusCard label="API" value="Responding" status="healthy" />
            <StatusCard label="Database" value="24.7 MB" sub="SQLite · Connected" status="healthy" />
          </div>
        </div>
      </Section>

      {/* ─── Advanced Settings ──────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
      } title="Advanced Settings">
        <div className="space-y-3">
          <div className="bg-surface-200 border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="setting-row-label">Log Level</div>
                <div className="text-[11px] text-ink-500 mt-0.5">Controls verbosity of system logs</div>
              </div>
              <Select value={get('log_level') as 'trace' | 'debug' | 'info' | 'warn' | 'error'} onChange={(v) => set('log_level', v)} options={['trace', 'debug', 'info', 'warn', 'error']} />
            </div>
          </div>
          <div className="bg-surface-200 border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="setting-row-label">Heartbeat Interval</div>
                <div className="text-[11px] text-ink-500 mt-0.5">Milliseconds between cluster heartbeats (100–60000)</div>
              </div>
              <input type="number" value={get('heartbeat_interval')} onChange={(e) => set('heartbeat_interval', e.target.value)}
                className="input w-24 text-xs text-center" min={100} max={60000} step={100} />
            </div>
          </div>
          <div className="bg-surface-200 border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="setting-row-label">Conflict Resolution</div>
                <div className="text-[11px] text-ink-500 mt-0.5">Strategy when sync conflicts are detected</div>
              </div>
              <Select value={get('conflict_resolution') as 'timestamp-win' | 'manual'} onChange={(v) => set('conflict_resolution', v)} options={['timestamp-win', 'manual']} />
            </div>
          </div>
          <div className="bg-surface-200 border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="setting-row-label">Compression</div>
                <div className="text-[11px] text-ink-500 mt-0.5">Compress sync payloads to reduce bandwidth</div>
              </div>
              <Toggle checked={getBool('compression')} onChange={(v) => set('compression', String(v))} />
            </div>
          </div>
          <div className="bg-surface-200 border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="setting-row-label">Encryption</div>
                <div className="text-[11px] text-ink-500 mt-0.5">Encrypt all sync data in transit</div>
              </div>
              <Toggle checked={getBool('encryption')} onChange={(v) => set('encryption', String(v))} />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── About ──────────────────────────────────── */}
      <Section icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
      } title="About">
        <div className="pb-3 border-b border-border mb-4">
          <p className="text-base font-medium text-ink">ShadowNet</p>
          <p className="text-sm text-ink-400">Autonomous Self-Healing Edge Infrastructure</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatusCard label="Version" value="2.4.1" />
          <StatusCard label="License" value="MIT" />
          <StatusCard label="Backend" value="Python 3.13 / FastAPI" />
          <StatusCard label="Frontend" value="React 18 / TypeScript" />
          <StatusCard label="AI Engine" value={`Ollama / ${get('ai_model')}`} />
          <StatusCard label="Database" value="SQLite 3.46" />
          <StatusCard label="Last Update" value="2026-06-28" />
          <StatusCard label="Node ID" value="sn-edge-03a7f2" />
        </div>
      </Section>

    </div>
  );
}
