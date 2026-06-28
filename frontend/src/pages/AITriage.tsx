import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { useLocation } from 'react-router-dom';
import type { Incident, AITriage as AITriageType } from '../types';

const severityColors: Record<string, string> = { P1: '#c42b2b', P2: '#a67c00', P3: '#666666', P4: '#2b7a42' };

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
    try { setIncidents(await apiService.getIncidents()); }
    catch { /* */ }
    finally { setLoading(false); }
  }, []);

  const fetchTriage = useCallback(async (id: string) => {
    try { setTriage(await apiService.getTriage(id)); }
    catch { setTriage(null); }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const u = wsService.onMessage((m) => { if (m.type === 'triage_update') fetchIncidents(); });
    return () => u();
  }, [fetchIncidents]);

  useEffect(() => { if (selectedId) fetchTriage(selectedId); }, [selectedId, fetchTriage]);

  const handleRun = async () => {
    if (!selectedId) return;
    setTriaging(true);
    try { setTriage(await apiService.runTriage(selectedId)); }
    catch { /* */ }
    finally { setTriaging(false); }
  };

  const selected = incidents.find((i) => i.id === selectedId);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">AI Triage</h1>
        <p className="page-subtitle">Automated incident analysis — local LLM inference</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
        {/* Incident list */}
        <div className="bg-surface-100">
          <div className="p-5 border-b border-border">
            <p className="section-title">Incidents</p>
          </div>
          {loading ? (
            <div className="p-6 text-center text-sm text-ink-500">Loading…</div>
          ) : incidents.length === 0 ? (
            <div className="empty-state py-12">
              <pre className="empty-state-icon">{'{ }'}</pre>
              <p className="empty-state-title">No incidents</p>
            </div>
          ) : (
            <div className="divide-y divide-border-dark max-h-[600px] overflow-y-auto">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => setSelectedId(inc.id)}
                  className={`w-full text-left px-5 py-3 transition-colors ${
                    selectedId === inc.id ? 'bg-surface-200' : 'hover:bg-surface-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-[5px] h-[5px] shrink-0" style={{ backgroundColor: severityColors[inc.severity] || '#666' }} />
                    <span className="text-sm text-ink truncate">{inc.title}</span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-500 mt-1 pl-[13px]">
                    {new Date(inc.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    {inc.status !== 'triaging' && <span className="ml-2 text-warning">untriaged</span>}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dossier */}
        <div className="lg:col-span-2 bg-surface-100">
          {!selectedId ? (
            <div className="empty-state py-20">
              <pre className="empty-state-icon">{'[ select incident ]'}</pre>
              <p className="empty-state-title">Choose an incident to analyse</p>
              <p className="empty-state-text">Select from the list to view or run AI triage.</p>
            </div>
          ) : (
            <div className="dossier min-h-[500px]">
              <div className="dossier-header flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-[5px] h-[5px]" style={{ backgroundColor: severityColors[selected?.severity || 'P3'] }} />
                  <span className="text-sm font-medium text-ink">{selected?.title || '—'}</span>
                  {selected && (
                    <span className="text-[11px] font-mono text-ink-500">{selected.location}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {triage && (
                    <span className="text-[11px] font-mono text-ink-500">
                      {new Date(triage.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button onClick={handleRun} disabled={triaging} className="btn-primary btn-sm">
                    {triaging ? 'Analysing…' : 'Run Analysis'}
                  </button>
                </div>
              </div>

              <div className="dossier-body">
                {triaging ? (
                  <div className="empty-state py-12">
                    <pre className="empty-state-icon">{'[ inference in progress... ]'}</pre>
                    <p className="empty-state-title">Running local LLM</p>
                    <p className="empty-state-text">Processing via Ollama — Phi-3-mini</p>
                  </div>
                ) : triage ? (
                  <>
                    <div className="grid grid-cols-4 gap-4">
                      <Field label="Severity" value={triage.severity} valueStyle={{ color: severityColors[triage.severity] }} />
                      <Field label="Department" value={triage.department} />
                      <Field label="Injured" value={String(triage.injured)} />
                      <Field label="Critical" value={String(triage.critical)} />
                    </div>
                    <div className="hr-text my-4">Assessment</div>
                    <div className="dossier-field">
                      <span className="dossier-label">Location</span>
                      <span className="dossier-value">{triage.location}</span>
                    </div>
                    <div className="dossier-field">
                      <span className="dossier-label">Summary</span>
                      <span className="dossier-value">{triage.summary}</span>
                    </div>
                    {triage.raw_response && (
                      <>
                        <div className="hr-text my-4">Source</div>
                        <pre className="bg-surface-200 p-4 text-[12px] font-mono text-ink-400 overflow-x-auto border border-border">
                          {JSON.stringify(JSON.parse(triage.raw_response), null, 2)}
                        </pre>
                      </>
                    )}
                  </>
                ) : (
                  <div className="empty-state py-12">
                    <pre className="empty-state-icon">{'[ no analysis ]'}</pre>
                    <p className="empty-state-title">Not yet analysed</p>
                    <p className="empty-state-text">Run triage to generate an intelligence dossier.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="bg-surface-200 border border-border p-4">
      <p className="mono-label">{label}</p>
      <p className="text-lg font-light text-ink mt-1" style={valueStyle}>{value}</p>
    </div>
  );
}
