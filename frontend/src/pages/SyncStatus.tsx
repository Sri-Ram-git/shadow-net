import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { MetricCell } from '../components/MetricCell';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { SyncQueueItem } from '../types';
import toast from 'react-hot-toast';

export function SyncStatus() {
  useDocumentTitle('Sync');
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const online = useOnlineStatus();

  const fetch = useCallback(async () => {
    try { setQueue(await apiService.getSyncQueue()); }
    catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const i = setInterval(fetch, 10000);
    const u = wsService.onMessage((m) => { if (m.type === 'sync_update') fetch(); });
    return () => { clearInterval(i); u(); };
  }, [fetch]);

  const handleSync = async () => {
    if (!online) { toast.error('No connection'); return; }
    setSyncing(true);
    try {
      const r = await apiService.triggerSync();
      toast.success(`Synced ${r.synced} items`);
      fetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally { setSyncing(false); }
  };

  const pending = queue.filter(i => i.status === 'pending').length;
  const synced = queue.filter(i => i.status === 'synced').length;
  const failed = queue.filter(i => i.status === 'failed').length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Sync</h1>
            <p className="page-subtitle">Offline-first data synchronisation</p>
          </div>
          <button onClick={handleSync} disabled={syncing || !online || pending === 0} className="btn-primary btn-sm">
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className={`border p-4 flex items-center gap-3 ${online ? 'border-safe/30 bg-safe-bg' : 'border-warning/30 bg-warning-bg'}`}>
        <span className={`status-dot ${online ? 'status-dot-online' : 'status-dot-offline'}`} />
        <div>
          <p className={`text-sm font-medium ${online ? 'text-safe' : 'text-warning'}`}>
            {online ? 'Connected' : 'Offline'}
          </p>
          <p className="text-[11px] font-mono text-ink-500">
            {online ? 'Data syncs automatically to cloud endpoint' : 'All data stored locally — sync queued'}
          </p>
        </div>
      </div>

      {/* Counts */}
      <div className="metrics-grid">
        <MetricCell value={queue.length} label="Total" />
        <MetricCell value={pending} label="Pending" />
        <MetricCell value={synced} label="Synced" valueClass="text-safe" />
        <MetricCell value={failed} label="Failed" valueClass="text-critical" />
      </div>

      {/* Queue table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Action</th>
              <th>ID</th>
              <th>Status</th>
              <th>Retries</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4"><div className="skeleton h-5 w-full" /></td>
                </tr>
              ))
            ) : queue.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12">
                <pre className="text-ink-500 font-mono text-xs mb-2">{'{ }'}</pre>
                <p className="text-sm text-ink-400">Queue empty</p>
              </td></tr>
            ) : (
              queue.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-[13px]">{item.entity_type}</td>
                  <td className="font-mono text-[13px] text-ink-400">{item.action}</td>
                  <td className="font-mono text-[12px] text-ink-500">{item.entity_id.substring(0, 12)}…</td>
                  <td>
                    <span className={`text-[11px] font-mono ${
                      item.status === 'synced' ? 'text-safe' :
                      item.status === 'failed' ? 'text-critical' :
                      item.status === 'syncing' ? 'text-warning' : 'text-ink-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="font-mono text-[13px] text-ink-500">{item.retry_count}</td>
                  <td className="font-mono text-[12px] text-ink-500">
                    {new Date(item.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


