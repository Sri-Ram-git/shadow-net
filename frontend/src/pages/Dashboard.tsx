import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { DashboardStats } from '../types';
import {
  AlertTriangle,
  Server,
  HardDrive,
  RefreshCw,
  Activity,
  Shield,
  ArrowUp,
  ArrowDown,
  Wifi,
  WifiOff,
} from 'lucide-react';

const defaultStats: DashboardStats = {
  total_incidents: 0,
  critical_incidents: 0,
  available_nodes: 0,
  total_nodes: 3,
  cluster_health: 100,
  storage_usage: 0,
  sync_pending: 0,
  sync_total: 0,
  recent_incidents: [],
  incidents_by_severity: {},
  incidents_by_category: {},
};

const severityColors: Record<string, string> = {
  P1: '#ff4757',
  P2: '#ffa502',
  P3: '#00d4ff',
  P4: '#2ed573',
};

const categoryIcons: Record<string, string> = {
  fire: '🔥',
  medical: '🏥',
  flood: '🌊',
  earthquake: '🏚️',
  infrastructure: '🏗️',
  hazard: '☣️',
  other: '📋',
};

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiService.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const unsub = wsService.onMessage((msg) => {
      if (['incident_update', 'cluster_update', 'sync_update'].includes(msg.type)) {
        fetchStats();
      }
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [fetchStats]);

  const healthColor = stats.cluster_health >= 80 ? '#2ed573' : stats.cluster_health >= 50 ? '#ffa502' : '#ff4757';
  const nodeRatio = `${stats.available_nodes}/${stats.total_nodes}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time emergency response overview</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Total Incidents</span>
            <AlertTriangle className="w-5 h-5 text-accent" />
          </div>
          <div className="stat-value text-accent">{stats.total_incidents}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-danger">{stats.critical_incidents} critical</span>
          </div>
        </div>

        <div className="card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Available Nodes</span>
            <Server className="w-5 h-5 text-success" />
          </div>
          <div className="stat-value text-success">{nodeRatio}</div>
          <div className="flex items-center gap-1 mt-1">
            <Activity className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-400">Cluster active</span>
          </div>
        </div>

        <div className="card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Cluster Health</span>
            <Shield className="w-5 h-5" style={{ color: healthColor }} />
          </div>
          <div className="stat-value" style={{ color: healthColor }}>{stats.cluster_health}%</div>
          <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.cluster_health}%`, backgroundColor: healthColor }}
            />
          </div>
        </div>

        <div className="card-glow">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Storage</span>
            <HardDrive className="w-5 h-5 text-warning" />
          </div>
          <div className="stat-value text-warning">{stats.storage_usage}%</div>
          <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full bg-warning transition-all duration-500"
              style={{ width: `${stats.storage_usage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sync Status & Incidents by Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Sync Status</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Queue</span>
                <span className="text-xs font-mono">
                  {stats.sync_pending} / {stats.sync_total}
                </span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-accent transition-all duration-500"
                  style={{
                    width: stats.sync_total > 0
                      ? `${((stats.sync_total - stats.sync_pending) / stats.sync_total) * 100}%`
                      : '100%',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {stats.sync_pending > 0 ? (
                <WifiOff className="w-4 h-4 text-warning" />
              ) : (
                <Wifi className="w-4 h-4 text-success" />
              )}
              <span className={stats.sync_pending > 0 ? 'text-warning' : 'text-success'}>
                {stats.sync_pending > 0 ? 'Pending' : 'Synced'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Incidents by Severity</h3>
          <div className="space-y-2">
            {['P1', 'P2', 'P3', 'P4'].map((sev) => {
              const count = stats.incidents_by_severity[sev] || 0;
              const total = Object.values(stats.incidents_by_severity).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={sev} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-6" style={{ color: severityColors[sev] }}>
                    {sev}
                  </span>
                  <div className="flex-1 bg-dark-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(count / total) * 100}%`, backgroundColor: severityColors[sev] }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Recent Incidents</h3>
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-accent hover:text-accent-400 transition-colors"
          >
            View All
          </button>
        </div>
        {stats.recent_incidents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No incidents reported</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recent_incidents.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors cursor-pointer"
                onClick={() => navigate('/incidents')}
              >
                <div className="flex items-center gap-3">
                  <span>{categoryIcons[incident.category] || '📋'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{incident.title}</p>
                    <p className="text-xs text-gray-500">{incident.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{
                      backgroundColor: `${severityColors[incident.severity]}20`,
                      color: severityColors[incident.severity],
                    }}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(incident.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/incidents/create')}
          className="card flex items-center gap-3 hover:border-accent/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <AlertTriangle className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Report Incident</p>
            <p className="text-xs text-gray-500">Submit new emergency</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/cluster')}
          className="card flex items-center gap-3 hover:border-success/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
            <Server className="w-5 h-5 text-success" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Cluster Status</p>
            <p className="text-xs text-gray-500">View node health</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/sync')}
          className="card flex items-center gap-3 hover:border-warning/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
            <RefreshCw className="w-5 h-5 text-warning" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-200">Sync Queue</p>
            <p className="text-xs text-gray-500">Check pending syncs</p>
          </div>
        </button>
      </div>
    </div>
  );
}
