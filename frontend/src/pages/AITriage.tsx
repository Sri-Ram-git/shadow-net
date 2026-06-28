import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { useLocation } from 'react-router-dom';
import type { Incident, AITriage as AITriageType } from '../types';
import {
  Brain,
  AlertTriangle,
  RefreshCw,
  Zap,
  Clock,
  MapPin,
  Users,
  Activity,
  Loader2,
} from 'lucide-react';

const severityColors: Record<string, string> = {
  P1: '#ff4757', P2: '#ffa502', P3: '#00d4ff', P4: '#2ed573',
};

export function AITriage() {
  const location = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { incidentId?: string })?.incidentId || null
  );
  const [triage, setTriage] = useState<AITriageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await apiService.getIncidents();
      setIncidents(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchTriage = useCallback(async (id: string) => {
    try {
      const data = await apiService.getTriage(id);
      setTriage(data);
    } catch {
      setTriage(null);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const unsub = wsService.onMessage((msg) => {
      if (msg.type === 'triage_update') fetchIncidents();
    });
    return () => unsub();
  }, [fetchIncidents]);

  useEffect(() => {
    if (selectedId) fetchTriage(selectedId);
  }, [selectedId, fetchTriage]);

  const handleRunTriage = async () => {
    if (!selectedId) return;
    setTriaging(true);
    try {
      const result = await apiService.runTriage(selectedId);
      setTriage(result);
    } catch (err) {
      console.error('Triage failed:', err);
    } finally {
      setTriaging(false);
    }
  };

  const selectedIncident = incidents.find((i) => i.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold gradient-text">AI Triage</h1>
        <p className="text-sm text-gray-500 mt-1">Automated emergency analysis with local LLM</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="card lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Incidents</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No incidents</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {incidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => setSelectedId(incident.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedId === incident.id
                      ? 'bg-accent/10 border border-accent/20'
                      : 'bg-dark-700/50 border border-transparent hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: severityColors[incident.severity] }}
                    />
                    <span className="text-sm font-medium text-gray-200 truncate">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    {incident.status !== 'triaging' && (
                      <span className="text-warning">Not triaged</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Triage Details */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedId ? (
            <div className="card text-center py-16">
              <Brain className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 font-medium">Select an Incident</p>
              <p className="text-sm text-gray-500 mt-1">Choose an incident to run AI triage analysis</p>
            </div>
          ) : (
            <>
              {/* Incident Summary */}
              {selectedIncident && (
                <div className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-200">{selectedIncident.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{selectedIncident.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedIncident.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(selectedIncident.timestamp).toLocaleString('en-US', { hour12: false })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRunTriage}
                      disabled={triaging}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      {triaging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {triaging ? 'Analyzing...' : 'Run Triage'}
                    </button>
                  </div>
                </div>
              )}

              {/* AI Analysis Results */}
              {triaging ? (
                <div className="card text-center py-12">
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-300 font-medium">AI Analyzing Incident</p>
                  <p className="text-sm text-gray-500 mt-1">Running local LLM inference via Ollama</p>
                </div>
              ) : triage ? (
                <div className="card space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-gray-200">AI Triage Results</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Severity</p>
                      <p className="text-lg font-bold font-mono mt-1" style={{ color: severityColors[triage.severity] }}>
                        {triage.severity}
                      </p>
                    </div>
                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-200 mt-1">{triage.department}</p>
                    </div>
                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Injured</p>
                      <p className="text-lg font-bold font-mono mt-1 text-warning">{triage.injured}</p>
                    </div>
                    <div className="bg-dark-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Critical</p>
                      <p className="text-lg font-bold font-mono mt-1 text-danger">{triage.critical}</p>
                    </div>
                  </div>

                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="text-sm text-gray-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {triage.location}
                    </p>
                  </div>

                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Summary</p>
                    <p className="text-sm text-gray-200">{triage.summary}</p>
                  </div>

                  <div className="text-xs text-gray-500 font-mono">
                    Analyzed at: {new Date(triage.created_at).toLocaleString('en-US', { hour12: false })}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 font-medium">No Analysis Yet</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Run Triage" to analyze with local AI</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
