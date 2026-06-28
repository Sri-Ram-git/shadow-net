import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { SyncQueueItem } from '../types';
import {
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SyncStatus() {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await apiService.getSyncQueue();
      setQueue(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    const unsub = wsService.onMessage((msg) => {
      if (msg.type === 'sync_update') fetchQueue();
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [fetchQueue]);

  const handleSync = async () => {
    if (!online) {
      toast.error('No internet connection');
      return;
    }
    setSyncing(true);
    try {
      const result = await apiService.triggerSync();
      toast.success(`Synced ${result.synced} items`);
      fetchQueue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const pending = queue.filter((i) => i.status === 'pending').length;
  const synced = queue.filter((i) => i.status === 'synced').length;
  const failed = queue.filter((i) => i.status === 'failed').length;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'syncing': return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
      case 'failed': return <XCircle className="w-4 h-4 text-danger" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Sync Status</h1>
          <p className="text-sm text-gray-500 mt-1">Offline-first data synchronization engine</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || !online || pending === 0}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Connection Status */}
      <div className={`card flex items-center gap-3 ${
        online ? 'border-success/30' : 'border-warning/30'
      }`}>
        {online ? (
          <Wifi className="w-5 h-5 text-success" />
        ) : (
          <WifiOff className="w-5 h-5 text-warning" />
        )}
        <div>
          <p className={`font-medium ${online ? 'text-success' : 'text-warning'}`}>
            {online ? 'Internet Connected' : 'Internet Unavailable'}
          </p>
          <p className="text-xs text-gray-500">
            {online
              ? 'Data will sync automatically to cloud'
              : 'All data stored locally — sync when connection returns'
            }
          </p>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <span className="stat-label">Total Items</span>
          <div className="stat-value text-gray-200">{queue.length}</div>
        </div>
        <div className="card">
          <span className="stat-label">Pending</span>
          <div className="stat-value text-warning">{pending}</div>
        </div>
        <div className="card">
          <span className="stat-label">Synced</span>
          <div className="stat-value text-success">{synced}</div>
        </div>
        <div className="card">
          <span className="stat-label">Failed</span>
          <div className="stat-value text-danger">{failed}</div>
        </div>
      </div>

      {/* Queue List */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Sync Queue</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Queue is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50"
              >
                <div className="flex items-center gap-3">
                  {statusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {item.entity_type} — {item.action}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      ID: {item.entity_id.substring(0, 12)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.retry_count > 0 && (
                    <span className="text-xs text-gray-500">Retry #{item.retry_count}</span>
                  )}
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(item.created_at).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                  {item.status === 'synced' && item.synced_at && (
                    <span className="text-xs text-success font-mono">
                      {new Date(item.synced_at).toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
