import { useState, useEffect, useCallback } from 'react';
import { apiService, getApiError } from '../services/api';
import { wsService } from '../services/websocket';
import { MetricCell } from '../components/MetricCell';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { ClusterMetrics, ClusterNode } from '../types';

export function ClusterHealth() {
  useDocumentTitle('Cluster');
  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { setMetrics(await apiService.getClusterMetrics()); }
    catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 5000);
    const u = wsService.onMessage((m) => { if (m.type === 'cluster_update') fetch(); });
    return () => { clearInterval(i); u(); };
  }, [fetch]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="skeleton h-7 w-32 mb-2" />
          <div className="skeleton h-4 w-56" />
        </div>
        <div className="metrics-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="metric-cell">
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-3 w-20 mt-2" />
            </div>
          ))}
        </div>
        <div className="panel space-y-4">
          <div className="skeleton h-4 w-16" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const cpu = metrics ? Math.round((metrics.used_cpu / metrics.total_cpu) * 100) : 0;
  const mem = metrics ? Math.round((metrics.used_memory / metrics.total_memory) * 100) : 0;
  const nw = metrics?.network_health ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Cluster</h1>
        <p className="page-subtitle">Infrastructure status and node monitoring</p>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <MetricCell value={metrics ? `${metrics.healthy_pods}/${metrics.total_pods}` : '—'} label="Pods" />
        <MetricCell value={`${cpu}%`} label="CPU" />
        <MetricCell value={`${mem}%`} label="Memory" />
        <MetricCell value={`${nw}%`} label="Network" valueClass={nw >= 80 ? 'text-safe' : nw >= 50 ? 'text-warning' : 'text-critical'} />
        <MetricCell value={metrics?.nodes.length ?? 0} label="Nodes" />
        <MetricCell value={metrics?.nodes.filter(n => n.status === 'Ready').length ?? 0} label="Ready" valueClass="text-safe" />
      </div>

      {/* Nodes */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Nodes</span>
        </div>
        {(!metrics || metrics.nodes.length === 0) ? (
          <div className="empty-state py-12">
            <pre className="empty-state-icon">{'[ ]'}</pre>
            <p className="empty-state-title">{getApiError() ? 'Backend unreachable' : 'No nodes discovered'}</p>
            <p className="empty-state-text">{getApiError() ? 'Check that the backend is running and VITE_API_URL is set correctly.' : 'Nodes appear here once the cluster connects.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-border-dark">
            {metrics.nodes.map((node) => (
              <NodeRow key={node.name} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Topology */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Topology</span>
        </div>
        {metrics && metrics.nodes.length > 0 ? (
          <div className="flex items-center justify-center py-8 gap-0">
            {metrics.nodes.map((node, idx) => (
              <div key={node.name} className="flex items-center">
                <div className={`node-card min-w-[140px] ${node.status !== 'Ready' ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`status-dot ${node.status === 'Ready' ? 'status-dot-online' : node.status === 'NotReady' ? 'status-dot-offline' : 'status-dot-unknown'}`} />
                    <span className="node-name">{node.name}</span>
                    <span className="text-[10px] font-mono text-ink-500 uppercase ml-auto">{node.role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div><span className="node-stat-label">CPU</span><p className="node-stat">{node.cpu_usage.toFixed(1)}%</p></div>
                    <div><span className="node-stat-label">Mem</span><p className="node-stat">{node.memory_usage.toFixed(1)}%</p></div>
                    <div><span className="node-stat-label">Pods</span><p className="node-stat">{node.pod_count}</p></div>
                    <div><span className="node-stat-label">Restarts</span><p className="node-stat">{node.restart_count}</p></div>
                  </div>
                </div>
                {idx < metrics.nodes.length - 1 && (
                  <div className="w-10 flex items-center justify-center">
                    <div className="w-full h-px bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state py-12">
            <pre className="empty-state-icon">{'[ no topology ]'}</pre>
            <p className="empty-state-title">{getApiError() ? 'Backend unreachable' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeRow({ node }: { node: ClusterNode }) {
  const isReady = node.status === 'Ready';
  return (
    <div className="flex items-center justify-between py-3 px-1 hover:bg-surface-200/30 transition-colors">
      <div className="flex items-center gap-3">
        <span className={`status-dot ${isReady ? 'status-dot-online' : 'status-dot-offline'}`} />
        <div>
          <span className="text-sm text-ink">{node.name}</span>
          <span className="text-[11px] font-mono text-ink-500 ml-3">{node.ip_address}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[11px] font-mono text-ink-500">{node.role}</span>
        <span className={`text-[11px] font-mono ${isReady ? 'text-safe' : 'text-critical'}`}>{node.status}</span>
      </div>
    </div>
  );
}
