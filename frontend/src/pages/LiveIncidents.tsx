import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Incident } from '../types';
import { Plus } from 'lucide-react';
import { SearchInput } from '../components/SearchInput';

const severityMap: Record<string, { label: string; cls: string }> = {
  P1: { label: 'CRIT', cls: 'tag-critical' },
  P2: { label: 'HIGH', cls: 'tag-high' },
  P3: { label: 'MED', cls: 'tag-medium' },
  P4: { label: 'LOW', cls: 'tag-low' },
};

const statusLabels: Record<string, string> = {
  open: 'open',
  triaging: 'triaging',
  dispatched: 'dispatched',
  resolved: 'resolved',
};

export function LiveIncidents() {
  useDocumentTitle('Incidents');
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    try { setIncidents(await apiService.getIncidents()); }
    catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const u = wsService.onMessage((m) => { if (m.type === 'incident_update') fetch(); });
    return () => u();
  }, [fetch]);

  const filtered = incidents.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Incidents</h1>
            <p className="page-subtitle">{incidents.length} total</p>
          </div>
          <button onClick={() => navigate('/incidents/create')} className="btn-primary text-sm">
            <Plus className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search incidents…"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Title</th>
              <th>Location</th>
              <th>Status</th>
              <th>Time</th>
              <th>Sync</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4"><div className="skeleton h-5 w-full" /></td>
                  </tr>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <pre className="text-ink-500 font-mono text-xs mb-2">{'{ }'}</pre>
                  <p className="text-sm text-ink-400">{incidents.length === 0 ? 'No incidents recorded' : 'No matches'}</p>
                </td>
              </tr>
            ) : (
              filtered.map((inc) => (
                <tr
                  key={inc.id}
                  className="cursor-pointer"
                  onClick={() => navigate('/triage', { state: { incidentId: inc.id } })}
                >
                  <td><span className={severityMap[inc.severity]?.cls || 'tag-medium'}>{inc.severity}</span></td>
                  <td className="font-medium text-ink">{inc.title}</td>
                  <td className="text-ink-400">{inc.location}</td>
                  <td><span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">{statusLabels[inc.status] || inc.status}</span></td>
                  <td className="font-mono text-[13px] text-ink-500">
                    {new Date(inc.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={`text-[11px] font-mono ${inc.synced ? 'text-safe' : 'text-warning'}`}>
                      {inc.synced ? 'synced' : 'pending'}
                    </span>
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
