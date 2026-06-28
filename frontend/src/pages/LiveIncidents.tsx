import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { Incident } from '../types';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
} from 'lucide-react';

const severityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
const severityColors: Record<string, string> = {
  P1: '#ff4757', P2: '#ffa502', P3: '#00d4ff', P4: '#2ed573',
};
const categoryLabels: Record<string, string> = {
  fire: 'Fire', medical: 'Medical', flood: 'Flood',
  earthquake: 'Earthquake', infrastructure: 'Infrastructure', hazard: 'Hazard', other: 'Other',
};
const statusColors: Record<string, string> = {
  open: '#ff4757', triaging: '#ffa502', dispatched: '#00d4ff', resolved: '#2ed573',
};

export function LiveIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await apiService.getIncidents();
      setIncidents(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const unsub = wsService.onMessage((msg) => {
      if (msg.type === 'incident_update') fetchIncidents();
    });
    return () => unsub();
  }, [fetchIncidents]);

  const filtered = incidents
    .filter((i) => {
      if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Live Incidents</h1>
          <p className="text-sm text-gray-500 mt-1">{incidents.length} total incidents</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchIncidents} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/incidents/create')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Incident
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Severity</option>
          <option value="P1">P1 - Critical</option>
          <option value="P2">P2 - High</option>
          <option value="P3">P3 - Medium</option>
          <option value="P4">P4 - Low</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="triaging">Triaging</option>
          <option value="dispatched">Dispatched</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Incidents List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading incidents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No incidents found</p>
          <p className="text-sm text-gray-500 mt-1">
            {incidents.length === 0 ? 'Report your first emergency incident' : 'Try adjusting your filters'}
          </p>
          {incidents.length === 0 && (
            <button
              onClick={() => navigate('/incidents/create')}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Incident
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((incident) => (
            <div
              key={incident.id}
              className="card flex items-start gap-4 animate-slide-up hover:border-accent/30 cursor-pointer"
              onClick={() => navigate('/triage', { state: { incidentId: incident.id } })}
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: severityColors[incident.severity] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-200">{incident.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{incident.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${severityColors[incident.severity]}20`,
                        color: severityColors[incident.severity],
                      }}
                    >
                      {incident.severity}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${statusColors[incident.status]}20`,
                        color: statusColors[incident.status],
                      }}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {incident.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.timestamp).toLocaleString('en-US', { hour12: false })}
                  </span>
                  <span>{categoryLabels[incident.category] || incident.category}</span>
                  {!incident.synced && (
                    <span className="text-warning flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                      Pending sync
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
