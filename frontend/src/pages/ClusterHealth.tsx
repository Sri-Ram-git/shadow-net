import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { ClusterMetrics, ClusterNode } from '../types';
import {
  Server,
  RefreshCw,
  Cpu,
  HardDrive,
  Activity,
  Network,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export function ClusterHealth() {
  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiService.getClusterMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cluster metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    const unsub = wsService.onMessage((msg) => {
      if (msg.type === 'cluster_update') fetchMetrics();
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [fetchMetrics]);

  const cpuPercent = metrics ? Math.round((metrics.used_cpu / metrics.total_cpu) * 100) : 0;
  const memPercent = metrics ? Math.round((metrics.used_memory / metrics.total_memory) * 100) : 0;
  const healthColor = metrics?.network_health !== undefined
    ? metrics.network_health >= 80 ? '#2ed573' : metrics.network_health >= 50 ? '#ffa502' : '#ff4757'
    : '#2ed573';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Cluster Health</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time Kubernetes cluster monitoring</p>
        </div>
        <button onClick={fetchMetrics} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Total Pods</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="stat-value text-accent">
            {metrics?.healthy_pods ?? 0}/{metrics?.total_pods ?? 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Healthy / Total</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">CPU Usage</span>
            <Cpu className="w-4 h-4 text-success" />
          </div>
          <div className="stat-value text-success">{metrics ? `${cpuPercent}%` : '—'}</div>
          <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full bg-success transition-all" style={{ width: `${cpuPercent}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Memory</span>
            <HardDrive className="w-4 h-4 text-warning" />
          </div>
          <div className="stat-value text-warning">{metrics ? `${memPercent}%` : '—'}</div>
          <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full bg-warning transition-all" style={{ width: `${memPercent}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Network Health</span>
            <Network className="w-4 h-4" style={{ color: healthColor }} />
          </div>
          <div className="stat-value" style={{ color: healthColor }}>
            {metrics ? `${metrics.network_health}%` : '—'}
          </div>
          <div className="w-full bg-dark-700 rounded-full h-1.5 mt-2">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${metrics?.network_health ?? 0}%`, backgroundColor: healthColor }} />
          </div>
        </div>
      </div>

      {/* Node List */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Nodes</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !metrics || metrics.nodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No nodes available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.nodes.map((node) => (
              <NodeCard key={node.name} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Topology Visualization */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Network Topology</h3>
        <div className="flex items-center justify-center p-8">
          {metrics && metrics.nodes.length > 0 ? (
            <div className="flex items-center gap-8">
              {metrics.nodes.map((node, idx) => (
                <div key={node.name} className="flex items-center gap-4">
                  <div
                    className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${
                      node.status === 'Ready'
                        ? 'border-success/50 bg-success/5'
                        : node.status === 'NotReady'
                        ? 'border-danger/50 bg-danger/5'
                        : 'border-warning/50 bg-warning/5'
                    }`}
                  >
                    <Server className="w-6 h-6" style={{
                      color: node.status === 'Ready' ? '#2ed573' : node.status === 'NotReady' ? '#ff4757' : '#ffa502',
                    }} />
                    <span className="text-xs font-mono text-gray-300 truncate max-w-[80px] text-center">
                      {node.name}
                    </span>
                    <span className={`text-[10px] font-mono ${
                      node.status === 'Ready' ? 'text-success' : node.status === 'NotReady' ? 'text-danger' : 'text-warning'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  {idx < metrics.nodes.length - 1 && (
                    <div className="flex items-center">
                      <div className="w-8 h-0.5 bg-dark-500" />
                      <div className="w-2 h-2 border-2 border-dark-500 rotate-45 -ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No topology data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: ClusterNode }) {
  const isReady = node.status === 'Ready';
  const isNotReady = node.status === 'NotReady';

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      isReady
        ? 'bg-success/5 border-success/20'
        : isNotReady
        ? 'bg-danger/5 border-danger/20'
        : 'bg-warning/5 border-warning/20'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {isReady ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : isNotReady ? (
            <XCircle className="w-5 h-5 text-danger" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warning" />
          )}
          <div>
            <h4 className="font-medium text-gray-200">{node.name}</h4>
            <p className="text-xs text-gray-500 font-mono">{node.ip_address}</p>
          </div>
        </div>
        <span className={`badge ${
          isReady ? 'badge-low' : isNotReady ? 'badge-critical' : 'badge-high'
        }`}>
          {node.status}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-500">Role</p>
          <p className="text-sm font-mono text-gray-300">{node.role}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CPU</p>
          <p className="text-sm font-mono text-gray-300">{node.cpu_usage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Memory</p>
          <p className="text-sm font-mono text-gray-300">{node.memory_usage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Pods</p>
          <p className="text-sm font-mono text-gray-300">{node.pod_count}</p>
        </div>
      </div>
    </div>
  );
}
