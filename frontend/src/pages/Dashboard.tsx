import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, getApiError } from '../services/api';
import { wsService } from '../services/websocket';
import { MetricCell } from '../components/MetricCell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { DashboardStats } from '../types';

const defaultStats: DashboardStats = {
  total_incidents: 0, critical_incidents: 0, available_nodes: 0, total_nodes: 3,
  cluster_health: 100, storage_usage: 0, sync_pending: 0, sync_total: 0,
  recent_incidents: [], incidents_by_severity: {}, incidents_by_category: {},
};

const severityMap: Record<string, { label: string; cls: string }> = {
  P1: { label: 'CRIT', cls: 'tag-critical' },
  P2: { label: 'HIGH', cls: 'tag-high' },
  P3: { label: 'MED', cls: 'tag-medium' },
  P4: { label: 'LOW', cls: 'tag-low' },
};

export function Dashboard() {
  useDocumentTitle('Command Center');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { setStats(await apiService.getDashboard()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 10000);
    const u = wsService.onMessage((m) => { if (['incident_update','cluster_update','sync_update'].includes(m.type)) fetch(); });
    return () => { clearInterval(i); u(); };
  }, [fetch]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="metrics-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="metric-cell">
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
          <div className="lg:col-span-2 bg-surface-100 p-6 space-y-4">
            <div className="skeleton h-4 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
          <div className="bg-surface-100 p-6 space-y-4">
            <div className="skeleton h-4 w-20" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Command Center</h1>
        <p className="page-subtitle">Operational overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Metrics bar */}
      <div className="metrics-grid">
        <MetricCell value={stats.total_incidents} label="Incidents" />
        <MetricCell value={stats.critical_incidents} label="Critical" valueClass="text-critical" />
        <MetricCell value={`${stats.available_nodes}/${stats.total_nodes}`} label="Nodes" />
        <MetricCell value={`${stats.cluster_health}%`} label="Health" valueClass={stats.cluster_health >= 80 ? 'text-safe' : stats.cluster_health >= 50 ? 'text-warning' : 'text-critical'} />
        <MetricCell value={`${stats.storage_usage}%`} label="Storage" />
        <MetricCell value={stats.sync_pending > 0 ? `${stats.sync_pending}` : '0'} label="Pending Sync" valueClass={stats.sync_pending > 0 ? 'text-warning' : ''} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
        {/* Left column — Timeline */}
        <div className="lg:col-span-2 bg-surface-100">
          <div className="p-6 border-b border-border">
            <p className="section-title">Recent Activity</p>
          </div>
          {stats.recent_incidents.length === 0 ? (
            <div className="empty-state py-16">
              <pre className="empty-state-icon">{'{  }'}</pre>
              <p className="empty-state-title">{getApiError() ? 'Backend unreachable' : 'No incidents recorded'}</p>
              <p className="empty-state-text">{getApiError() ? 'Check that the backend is running at shadownet-api-production-bdf0.up.railway.app' : 'Reports will appear here as they are submitted.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border-dark">
              {stats.recent_incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => navigate('/incidents')}
                  className="w-full text-left px-6 py-4 hover:bg-surface-200/50 transition-colors flex items-start gap-4"
                >
                  <span className={`status-dot mt-1.5 ${inc.severity === 'P1' ? 'status-dot-offline' : inc.severity === 'P2' ? 'status-dot-unknown' : 'status-dot-idle'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink">{inc.title}</span>
                      <span className={severityMap[inc.severity]?.cls || 'tag-medium'}>{inc.severity}</span>
                    </div>
                    <p className="text-[13px] text-ink-400 mt-0.5 line-clamp-1">{inc.location}</p>
                  </div>
                  <span className="text-[11px] font-mono text-ink-500 shrink-0">
                    {new Date(inc.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column — Severity distribution + quick actions */}
        <div className="bg-surface-100">
          <div className="p-6 border-b border-border">
            <p className="section-title">Severity</p>
          </div>
          <div className="p-6 space-y-3">
            {['P1', 'P2', 'P3', 'P4'].map((sev) => {
              const count = stats.incidents_by_severity[sev] || 0;
              const total = Object.values(stats.incidents_by_severity).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={sev} className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-ink-500 w-6">{sev}</span>
                  <div className="flex-1 h-1 bg-surface-400 relative">
                    <div className="absolute inset-y-0 left-0 bg-ink/20 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-ink-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-6 space-y-2">
            <p className="section-title mb-3">Actions</p>
            <button onClick={() => navigate('/incidents/create')} className="btn-primary w-full text-sm justify-center">
              Report Incident
            </button>
            <button onClick={() => navigate('/cluster')} className="btn-secondary w-full text-sm justify-center">
              Cluster Status
            </button>
          </div>
        </div>
      </div>

      {/* Node health mini view */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Nodes</span>
          <span className="text-[11px] font-mono text-ink-500">{stats.available_nodes} / {stats.total_nodes} online</span>
        </div>
        <div className="flex items-center gap-6">
          {Array.from({ length: stats.total_nodes }).map((_, i) => {
            const online = i < stats.available_nodes;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`status-dot ${online ? 'status-dot-online' : 'status-dot-offline'}`} />
                <span className="font-mono text-ink-300">node-{i + 1}</span>
                <span className="text-[11px] font-mono text-ink-500">{online ? 'ready' : 'offline'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


