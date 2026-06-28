import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import toast from 'react-hot-toast';
import type { Incident, AITriage as AITriageType, TriageAnalysis, HazardCard, OperationalRecommendation, ResourceItem, ReasoningNode, RiskItem } from '../types';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DARK_TILES = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';

const severityColors: Record<string, string> = { P1: '#c42b2b', P2: '#a67c00', P3: '#5a7a9a', P4: '#4a7a5a' };
const severityLabels: Record<string, string> = { P1: 'Critical', P2: 'High', P3: 'Moderate', P4: 'Low' };
const hazardStatusColors: Record<string, string> = { High: '#c42b2b', Medium: '#a67c00', Low: '#4a7a5a' };

const analysisSteps = [
  'Reading Incident Report',
  'Identifying Confirmed Facts',
  'Analysing Hazards & Risks',
  'Formulating Operational Assessment',
  'Generating Intelligence Report',
];

function parseAnalysis(triage: AITriageType): TriageAnalysis {
  try {
    const raw = JSON.parse(triage.raw_response);
    if (!raw || typeof raw !== 'object') return fallbackAnalysis(triage);
    return {
      incident_type: raw.incident_type || 'Unknown',
      priority: raw.priority || 'Medium',
      estimated_severity: raw.estimated_severity || triage.severity,
      confidence: Math.max(0, Math.min(100, raw.confidence ?? 50)),
      source: raw.source || 'Incident Report',
      executive_summary: raw.executive_summary || 'No summary available.',
      confirmed_facts: Array.isArray(raw.confirmed_facts) ? raw.confirmed_facts.filter(Boolean) : [],
      professional_assessment: Array.isArray(raw.professional_assessment) ? raw.professional_assessment.filter(Boolean) : [],
      risk_analysis: (Array.isArray(raw.risk_analysis) ? raw.risk_analysis : []).filter((r: unknown): r is RiskItem => {
        if (!r || typeof r !== 'object') return false;
        const c = r as Record<string, unknown>;
        return typeof c.risk === 'string' && typeof c.percentage === 'number' && typeof c.reason === 'string';
      }),
      hazard_analysis: (Array.isArray(raw.hazard_analysis) ? raw.hazard_analysis : []).filter((h: unknown): h is HazardCard => {
        if (!h || typeof h !== 'object') return false;
        const c = h as Record<string, unknown>;
        return typeof c.hazard === 'string' && typeof c.status === 'string' && typeof c.reason === 'string';
      }),
      operational_recommendations: (Array.isArray(raw.operational_recommendations) ? raw.operational_recommendations : []).filter((r: unknown): r is OperationalRecommendation => {
        if (!r || typeof r !== 'object') return false;
        const c = r as Record<string, unknown>;
        return typeof c.action === 'string' && typeof c.reason === 'string' && typeof c.priority === 'number';
      }).sort((a: OperationalRecommendation, b: OperationalRecommendation) => a.priority - b.priority),
      resource_estimation: (Array.isArray(raw.resource_estimation) ? raw.resource_estimation : []).filter((r: unknown): r is ResourceItem => {
        if (!r || typeof r !== 'object') return false;
        const c = r as Record<string, unknown>;
        return typeof c.resource === 'string' && typeof c.estimated === 'number' && typeof c.reason === 'string';
      }),
      escalation_forecast: {
        next_15_minutes: Array.isArray(raw.escalation_forecast?.next_15_minutes) ? raw.escalation_forecast.next_15_minutes.filter(Boolean) : [],
        next_hour: Array.isArray(raw.escalation_forecast?.next_hour) ? raw.escalation_forecast.next_hour.filter(Boolean) : [],
        next_6_hours: Array.isArray(raw.escalation_forecast?.next_6_hours) ? raw.escalation_forecast.next_6_hours.filter(Boolean) : [],
      },
      reasoning_tree: (Array.isArray(raw.reasoning_tree) ? raw.reasoning_tree : []).filter((n: unknown): n is ReasoningNode => {
        if (!n || typeof n !== 'object') return false;
        const c = n as Record<string, unknown>;
        return typeof c.detected === 'string' && typeof c.inference === 'string' && typeof c.reason === 'string';
      }),
    };
  } catch {
    return fallbackAnalysis(triage);
  }
}

function fallbackAnalysis(triage: AITriageType): TriageAnalysis {
  return {
    incident_type: triage.severity + ' Incident',
    priority: 'Medium',
    estimated_severity: triage.severity,
    confidence: 0,
    source: 'Incident Report',
    executive_summary: 'Analysis unavailable.',
    confirmed_facts: [],
    professional_assessment: [],
    hazard_analysis: [],
    risk_analysis: [],
    operational_recommendations: [],
    resource_estimation: [],
    escalation_forecast: { next_15_minutes: [], next_hour: [], next_6_hours: [] },
    reasoning_tree: [],
  };
}

function HazardCard({ card }: { card: HazardCard }) {
  return (
    <div className="intel-hazard-card">
      <div className="flex items-center justify-between mb-2">
        <span className="intel-hazard-name">{card.hazard}</span>
        <span className="intel-hazard-status" style={{ color: hazardStatusColors[card.status], borderColor: hazardStatusColors[card.status] + '40' }}>
          {card.status}
        </span>
      </div>
      <p className="intel-hazard-reason">{card.reason}</p>
    </div>
  );
}

function RecCard({ rec }: { rec: OperationalRecommendation }) {
  return (
    <div className="intel-rec-card">
      <span className="intel-rec-priority">P{rec.priority}</span>
      <div>
        <p className="intel-rec-action">{rec.action}</p>
        <p className="intel-rec-reason">{rec.reason}</p>
      </div>
    </div>
  );
}

function ResourceCard({ item }: { item: ResourceItem }) {
  return (
    <div className="intel-resource-card">
      <div className="flex items-center justify-between mb-1">
        <span className="intel-resource-name">{item.resource}</span>
        <span className="intel-resource-value">{item.estimated}</span>
      </div>
      <p className="intel-resource-reason">{item.reason}</p>
    </div>
  );
}

const riskColors = ['#c42b2b', '#a67c00', '#5a7a9a', '#4a7a5a', '#7a4a5a', '#5a5a7a', '#7a6a4a', '#4a6a7a'];
const riskBgColors = ['#1a0808', '#1a1400', '#0a141a', '#081a0e', '#1a0e14', '#0e0e1a', '#1a1408', '#08141a'];

function RiskBarCard({ item, index }: { item: RiskItem; index: number }) {
  const color = riskColors[index % riskColors.length];
  const bgColor = riskBgColors[index % riskBgColors.length];
  return (
    <div className="bg-surface-200 border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink">{item.risk}</span>
        <span className="text-lg font-light font-mono" style={{ color }}>{item.percentage}%</span>
      </div>
      <div className="h-2 bg-surface-400 relative mb-2">
        <div className="absolute inset-y-0 left-0 transition-all duration-700" style={{ width: `${item.percentage}%`, backgroundColor: color }} />
      </div>
      <p className="text-[11px] text-ink-500 leading-relaxed">{item.reason}</p>
    </div>
  );
}

function ReasoningNodeCard({ node }: { node: ReasoningNode }) {
  return (
    <div className="intel-reasoning-node">
      <div className="intel-reasoning-detect">
        <span className="intel-reasoning-label">Detected</span>
        <span className="intel-reasoning-value">{node.detected}</span>
      </div>
      <div className="intel-reasoning-arrow">↓</div>
      <div className="intel-reasoning-infer">
        <span className="intel-reasoning-label">Inference</span>
        <span className="intel-reasoning-value">{node.inference}</span>
      </div>
      <div className="intel-reasoning-arrow">↓</div>
      <div className="intel-reasoning-why">
        <span className="intel-reasoning-label">Reason</span>
        <span className="intel-reasoning-value">{node.reason}</span>
      </div>
    </div>
  );
}

function MapPreview({ location, title, incident }: { location: string; title: string; incident: Incident | undefined }) {
  const hasCoords = Boolean(incident?.latitude && incident?.longitude);
  const center: [number, number] = hasCoords ? [incident!.latitude!, incident!.longitude!] : [12.9716, 77.5946];

  return (
    <div>
      <div className="h-48 border border-border">
        <MapContainer center={center} zoom={14} className="h-full w-full" zoomControl={true} scrollWheelZoom={false}>
          <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
          {hasCoords && <Marker position={center} />}
        </MapContainer>
      </div>
      <div className="bg-surface-300 px-4 py-3 border-x border-b border-border">
        <div className="flex items-start gap-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400 mt-0.5 shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <p className="text-sm text-ink-300">{title}</p>
            <p className="text-[12px] font-mono text-ink-500 mt-0.5">{location}</p>
            {hasCoords && (
              <p className="text-[10px] font-mono text-ink-500 mt-1">
                {incident!.latitude!.toFixed(6)}, {incident!.longitude!.toFixed(6)}
              </p>
            )}
            {incident?.city && <p className="text-[10px] font-mono text-ink-500">{incident.city}{incident?.state ? `, ${incident.state}` : ''}{incident?.country ? `, ${incident.country}` : ''}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AITriage() {
  useDocumentTitle('Intelligence Report');
  const location = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { incidentId?: string })?.incidentId || null
  );
  const [triage, setTriage] = useState<AITriageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [showJson, setShowJson] = useState(false);

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
    setProgressStep(0);
    setTriage(null);
    const interval = setInterval(() => setProgressStep((p) => (p < analysisSteps.length - 1 ? p + 1 : p)), 1000);
    try {
      const result = await apiService.runTriage(selectedId);
      setTriage(result);
      toast.success('Intelligence report generated');
    } catch {
      toast.error('Analysis failed — check backend connection');
    } finally {
      clearInterval(interval);
      setProgressStep(analysisSteps.length);
      setTriaging(false);
    }
  };

  const handleDownloadJson = () => {
    if (!triage) return;
    const blob = new Blob([triage.raw_response], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intelligence-report-${selectedId?.slice(0, 8) || 'unknown'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON report downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  const selected = incidents.find((i) => i.id === selectedId);
  const analysis = triage ? parseAnalysis(triage) : null;

  return (
    <div className="intel-report-page">
      {/* ── Top Header ──────────────────────────────── */}
      <div className="intel-header">
        <div className="intel-header-top">
          <div className="intel-header-main">
            <span className="intel-badge">EMERGENCY INTELLIGENCE REPORT</span>
            <div className="flex items-center gap-3">
              <h1 className="intel-title">{selected?.title || '—'}</h1>
              {analysis?.source?.includes('Demo') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border border-warning/40 text-warning bg-warning-bg">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" /><path d="M18 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2" /></svg>
                  DEMO AI
                </span>
              )}
            </div>
            <div className="intel-meta">
              <span className="intel-meta-item">
                <span className="intel-meta-label">ID</span>
                <span className="intel-meta-value">{selected?.id?.slice(0, 8)?.toUpperCase() || '—'}</span>
              </span>
              <span className="intel-meta-item">
                <span className="intel-meta-label">Time</span>
                <span className="intel-meta-value">
                  {selected ? new Date(selected.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                </span>
              </span>
              <span className="intel-meta-item">
                <span className="intel-meta-label">Operator</span>
                <span className="intel-meta-value">—</span>
              </span>
              <span className="intel-meta-item">
                <span className="intel-meta-label">Location</span>
                <span className="intel-meta-value">{selected?.location || '—'}</span>
              </span>
              <span className="intel-meta-item">
                <span className="intel-meta-label">Status</span>
                <span className={`intel-meta-value ${selected?.status === 'open' ? 'text-warning' : selected?.status === 'triaging' ? 'text-ink' : selected?.status === 'dispatched' ? 'text-safe' : ''}`}>
                  {(selected?.status || '—').toUpperCase()}
                </span>
              </span>
            </div>
          </div>
          <div className="intel-header-actions">
            <button onClick={handleRun} disabled={triaging} className="btn-primary btn-sm">
              {triaging ? 'Generating…' : 'Run Analysis'}
            </button>
            {triage && (
              <>
                <button onClick={handleDownloadJson} className="btn-secondary btn-sm">Download JSON</button>
                <button onClick={handlePrint} className="btn-secondary btn-sm">Export PDF</button>
                <button className="btn-secondary btn-sm">Approve</button>
                <button className="btn-secondary btn-sm">Escalate</button>
                <button className="btn-primary btn-sm">Dispatch</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="intel-content">
        {/* ── Incident Selector ──────────────────────── */}
        <div className="intel-sidebar">
          <p className="section-title mb-3">Incidents</p>
          {loading ? (
            <div className="divide-y divide-border-dark">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-ink-500">No incidents</p>
            </div>
          ) : (
            <div className="divide-y divide-border-dark max-h-[500px] overflow-y-auto">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => { setSelectedId(inc.id); }}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedId === inc.id ? 'bg-surface-200' : 'hover:bg-surface-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-[5px] h-[5px] shrink-0" style={{ backgroundColor: severityColors[inc.severity] || '#666' }} />
                    <span className="text-sm text-ink truncate">{inc.title}</span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-500 mt-1 pl-[13px]">
                    {new Date(inc.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    {inc.status === 'open' && <span className="ml-2 text-warning">untriaged</span>}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Report ──────────────────────────── */}
        <div className="intel-report">
          {!selectedId ? (
            <div className="empty-state py-20">
              <pre className="empty-state-icon">{'[ select incident ]'}</pre>
              <p className="empty-state-title">Select an incident</p>
              <p className="empty-state-text">Choose from the list to generate an intelligence report.</p>
            </div>
          ) : triaging ? (
            <div className="intel-progress">
              <div className="intel-progress-header">
                <span className="intel-badge">GENERATING INTELLIGENCE REPORT</span>
                <p className="text-sm text-ink-400 mt-2">AI is analysing the incident report</p>
              </div>
              <div className="analysis-steps">
                {analysisSteps.map((step, i) => (
                  <div key={step} className={`progress-step ${i < progressStep ? 'done' : i === progressStep ? 'running' : 'pending'}`}>
                    <span className="step-badge">{i < progressStep ? '✓' : i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !triage || !analysis ? (
            <div className="empty-state py-12">
              <pre className="empty-state-icon">{'[ no report ]'}</pre>
              <p className="empty-state-title">No intelligence report</p>
              <p className="empty-state-text">Run analysis to generate an intelligence report for this incident.</p>
            </div>
          ) : (
            <div className="intel-report-body">
              {/* ── Section 1: Executive Summary ──────── */}
              <section className="intel-section">
                <div className="intel-section-header">
                  <span className="intel-section-number">01</span>
                  <h2 className="intel-section-title">Executive Summary</h2>
                </div>
                <div className="intel-exec-summary">
                  {analysis.executive_summary}
                </div>
              </section>

              {/* ── Section 2: Incident Overview ──────── */}
              <section className="intel-section">
                <div className="intel-section-header">
                  <span className="intel-section-number">02</span>
                  <h2 className="intel-section-title">Incident Overview</h2>
                </div>
                <div className="intel-overview-grid">
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Incident Type</span>
                    <span className="intel-overview-value">{analysis.incident_type}</span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Status</span>
                    <span className="intel-overview-value">{(selected?.status || '').toUpperCase()}</span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Priority</span>
                    <span className="intel-overview-value">{analysis.priority}</span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Severity</span>
                    <span className="intel-overview-value" style={{ color: severityColors[analysis.estimated_severity] }}>
                      {analysis.estimated_severity} — {severityLabels[analysis.estimated_severity]}
                    </span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Confidence</span>
                    <span className="intel-overview-value">{analysis.confidence}%</span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Source</span>
                    <span className="intel-overview-value">{analysis.source}</span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Time Reported</span>
                    <span className="intel-overview-value">
                      {selected ? new Date(selected.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                    </span>
                  </div>
                  <div className="intel-overview-item">
                    <span className="intel-overview-label">Location</span>
                    <span className="intel-overview-value">{selected?.location || '—'}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <MapPreview location={selected?.location || ''} title={selected?.title || ''} incident={selected} />
                </div>
              </section>

              {/* ── Section 3: Confirmed Facts ────────── */}
              {analysis.confirmed_facts.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">03</span>
                    <h2 className="intel-section-title">Confirmed Facts</h2>
                  </div>
                  <div className="intel-facts-list">
                    {analysis.confirmed_facts.map((fact, i) => (
                      <div key={i} className="intel-fact-item">
                        <span className="intel-fact-check">✓</span>
                        <span>{fact}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 4: Professional Assessment ── */}
              {analysis.professional_assessment.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">04</span>
                    <h2 className="intel-section-title">AI Professional Assessment</h2>
                  </div>
                  <div className="intel-assessment-list">
                    {analysis.professional_assessment.map((item, i) => (
                      <div key={i} className="intel-assessment-item">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 5: Hazard Analysis ────────── */}
              {analysis.hazard_analysis.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">05</span>
                    <h2 className="intel-section-title">Hazard Analysis</h2>
                  </div>
                  <div className="intel-hazard-grid">
                    {analysis.hazard_analysis.map((card, i) => (
                      <HazardCard key={i} card={card} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 5b: Risk Analysis ──────────── */}
              {analysis.risk_analysis.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">05B</span>
                    <h2 className="intel-section-title">Risk Analysis</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {analysis.risk_analysis.map((item, i) => (
                      <RiskBarCard key={i} item={item} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 6: Operational Recommendations ── */}
              {analysis.operational_recommendations.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">06</span>
                    <h2 className="intel-section-title">Operational Recommendations</h2>
                  </div>
                  <div className="intel-rec-list">
                    {analysis.operational_recommendations.map((rec, i) => (
                      <RecCard key={i} rec={rec} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 7: Resource Estimation ────── */}
              {analysis.resource_estimation.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">07</span>
                    <h2 className="intel-section-title">Resource Estimation</h2>
                  </div>
                  <div className="intel-resource-grid">
                    {analysis.resource_estimation.map((item, i) => (
                      <ResourceCard key={i} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 8: Escalation Forecast ────── */}
              {(analysis.escalation_forecast.next_15_minutes.length > 0 ||
                analysis.escalation_forecast.next_hour.length > 0 ||
                analysis.escalation_forecast.next_6_hours.length > 0) && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">08</span>
                    <h2 className="intel-section-title">Escalation Forecast</h2>
                  </div>
                  <div className="intel-forecast-grid">
                    <div className="intel-forecast-col">
                      <div className="intel-forecast-header">
                        <span className="intel-forecast-icon">15</span>
                        <span className="intel-forecast-label">Next 15 Minutes</span>
                      </div>
                      <ul className="intel-forecast-list">
                        {analysis.escalation_forecast.next_15_minutes.map((item, i) => (
                          <li key={i} className="intel-forecast-item">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="intel-forecast-col">
                      <div className="intel-forecast-header">
                        <span className="intel-forecast-icon">1H</span>
                        <span className="intel-forecast-label">Next Hour</span>
                      </div>
                      <ul className="intel-forecast-list">
                        {analysis.escalation_forecast.next_hour.map((item, i) => (
                          <li key={i} className="intel-forecast-item">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="intel-forecast-col">
                      <div className="intel-forecast-header">
                        <span className="intel-forecast-icon">6H</span>
                        <span className="intel-forecast-label">Next 6 Hours</span>
                      </div>
                      <ul className="intel-forecast-list">
                        {analysis.escalation_forecast.next_6_hours.map((item, i) => (
                          <li key={i} className="intel-forecast-item">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Section 9: AI Reasoning ────────────── */}
              {analysis.reasoning_tree.length > 0 && (
                <section className="intel-section">
                  <div className="intel-section-header">
                    <span className="intel-section-number">09</span>
                    <h2 className="intel-section-title">AI Reasoning</h2>
                  </div>
                  <div className="intel-reasoning-tree">
                    {analysis.reasoning_tree.map((node, i) => (
                      <ReasoningNodeCard key={i} node={node} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Section 10: Structured JSON ──────── */}
              <section className="intel-section">
                <div className="intel-section-header">
                  <span className="intel-section-number">10</span>
                  <h2 className="intel-section-title">Structured Data</h2>
                </div>
                <button onClick={() => setShowJson(!showJson)} className="intel-json-toggle">
                  {showJson ? '▾' : '▸'} Raw AI Output
                </button>
                {showJson && (
                  <div className="intel-json-block">
                    <div className="intel-json-actions">
                      <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(JSON.parse(triage.raw_response), null, 2)); toast.success('Copied to clipboard'); }} className="text-[11px] font-mono text-ink-500 hover:text-ink">
                        Copy
                      </button>
                      <button onClick={handleDownloadJson} className="text-[11px] font-mono text-ink-500 hover:text-ink">
                        Download
                      </button>
                    </div>
                    <pre className="intel-json-pre">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(triage.raw_response), null, 2); }
                        catch { return triage.raw_response; }
                      })()}
                    </pre>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
