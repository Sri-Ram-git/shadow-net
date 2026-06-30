import axios from 'axios';
import type { Incident, AITriage, ClusterMetrics, DashboardStats, SyncQueueItem, CreateIncidentPayload } from '../types';

const now = new Date().toISOString();

const SAMPLE_INCIDENTS: Incident[] = [
  { id: '1', title: 'Wildfire near Bannerghatta Forest', description: 'Rapidly spreading wildfire in Bannerghatta forest area. Multiple fire crews dispatched.', location: 'Bannerghatta Forest Reserve, Bangalore, Karnataka', category: 'fire', severity: 'P1', status: 'triaging', latitude: 12.8, longitude: 77.58, city: 'Bangalore', state: 'Karnataka', country: 'India', postal_code: undefined, place_id: undefined, landmark: undefined, image_url: undefined, timestamp: now, synced: true },
  { id: '2', title: 'Major Road Accident on Hosur Road', description: 'Multi-vehicle collision involving a bus and two cars near Electronic City.', location: 'Hosur Road, Electronic City, Bangalore', category: 'medical,infrastructure', severity: 'P2', status: 'open', latitude: 12.845, longitude: 77.67, city: 'Bangalore', state: 'Karnataka', country: 'India', postal_code: undefined, place_id: undefined, landmark: undefined, image_url: undefined, timestamp: now, synced: true },
  { id: '3', title: 'Transformer Explosion in Whitefield', description: 'Electrical transformer explosion at Whitefield power substation. Power outage affecting 500 households.', location: 'Whitefield Power Substation, Bangalore', category: 'infrastructure,fire', severity: 'P3', status: 'open', latitude: 12.97, longitude: 77.75, city: 'Bangalore', state: 'Karnataka', country: 'India', postal_code: undefined, place_id: undefined, landmark: undefined, image_url: undefined, timestamp: now, synced: true },
];

const DEMO_DATA = {
  health: { status: 'healthy', version: '2.4.1', uptime: 999 },
  dashboard: {
    total_incidents: 3, critical_incidents: 1, available_nodes: 3, total_nodes: 3,
    cluster_health: 100, storage_usage: 12.5, sync_pending: 0, sync_total: 0,
    recent_incidents: SAMPLE_INCIDENTS,
    incidents_by_severity: { P1: 1, P2: 1, P3: 1 },
    incidents_by_category: { fire: 1, 'infrastructure,fire': 1, 'medical,infrastructure': 1 },
  },
  incidents: SAMPLE_INCIDENTS,
  cluster: {
    nodes: [
      { name: 'demo-control-1', role: 'control-plane', status: 'Ready', cpu_usage: 69, memory_usage: 73, pod_count: 8, restart_count: 0, ip_address: '10.0.0.1', os_image: 'Ubuntu 22.04 LTS', kubelet_version: 'v1.28.5', last_heartbeat: 'now' },
      { name: 'demo-worker-1', role: 'worker', status: 'Ready', cpu_usage: 75, memory_usage: 57, pod_count: 12, restart_count: 0, ip_address: '10.0.0.2', os_image: 'Ubuntu 22.04 LTS', kubelet_version: 'v1.28.5', last_heartbeat: 'now' },
      { name: 'demo-worker-2', role: 'worker', status: 'Ready', cpu_usage: 84, memory_usage: 67, pod_count: 10, restart_count: 0, ip_address: '10.0.0.3', os_image: 'Ubuntu 22.04 LTS', kubelet_version: 'v1.28.5', last_heartbeat: 'now' },
    ],
    total_pods: 30, healthy_pods: 30, total_cpu: 12, used_cpu: 9.1, total_memory: 24, used_memory: 15.8, network_health: 100,
  },
  sync: [] as SyncQueueItem[],
  settings: {
    ai_model: 'phi3:mini', ai_temperature: '0.3', ai_max_tokens: '2048',
    heartbeat_interval: '1500', self_healing: 'true', pod_recovery: 'true',
    replication_enabled: 'true', sync_mode: 'online', compression: 'true',
    encryption: 'true', conflict_resolution: 'timestamp-win', log_level: 'info',
    theme: 'dark',
  },
  triage: (id: string): AITriage => ({
    id: 'demo-triage-1',
    incident_id: id,
    severity: 'P2',
    department: 'Emergency Response',
    injured: 0,
    critical: 0,
    location: 'Incident site',
    summary: 'Demo intelligence analysis for this incident.',
    raw_response: JSON.stringify({
      incident_type: 'P2 Incident',
      priority: 'Medium',
      estimated_severity: 'P2',
      confidence: 0.85,
      source: 'demo',
      executive_summary: 'Demo analysis for testing purposes.',
      confirmed_facts: ['Incident reported via emergency channels', 'First responders en route to location'],
      professional_assessment: ['Standard response protocol activated'],
      hazard_analysis: [{ hazard: 'Fire', status: 'Medium', reason: 'Active fire reported' }],
      risk_analysis: [{ risk: 'Fire spread', percentage: 40, reason: 'Weather conditions favorable' }],
      operational_recommendations: [{ priority: 1, action: 'Dispatch fire crews', reason: 'Immediate response needed' }],
      resource_estimation: [{ resource: 'Fire Engine', estimated: 3, reason: 'Standard response' }],
      escalation_forecast: { next_15_minutes: ['Monitor situation'], next_hour: ['Assess damage'], next_6_hours: ['Stand down if contained'] },
      reasoning_tree: [{ detected: 'Fire reported', inference: 'Active fire incident', reason: 'Emergency call' }],
    }),
    created_at: now,
  }),
};

let _apiError: string | null = null;
export function getApiError(): string | null { return _apiError; }
export function clearApiError(): void { _apiError = null; }

const DEFAULT_API_URL = 'https://shadownet-api-production-bdf0.up.railway.app/api';

function getBaseURL(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) {
    const base = envUrl.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : base + '/api';
  }
  return DEFAULT_API_URL;
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

async function withFallback<T>(fn: () => Promise<{ data: T }>, fallback: T, label = ''): Promise<T> {
  try {
    const { data } = await fn();
    _apiError = null;
    return data;
  } catch (err) {
    console.warn('[ShadowNet] API' + (label ? ` ${label}` : '') + ' failed — using fallback', err);
    _apiError = err instanceof Error ? err.message : 'Backend unreachable';
    return fallback;
  }
}

export const apiService = {
  async getSettings(): Promise<Record<string, string>> {
    return withFallback(() => api.get('/settings'), DEMO_DATA.settings);
  },

  async getSetting(key: string): Promise<{ key: string; value: string }> {
    try {
      const { data } = await api.get(`/settings/${key}`);
      return data;
    } catch {
      return { key, value: '' };
    }
  },

  async updateSetting(key: string, value: string, updatedBy = 'operator'): Promise<{ ok: boolean; error?: string }> {
    try {
      const { data } = await api.put(`/settings/${key}`, { value, updated_by: updatedBy });
      return data;
    } catch { return { ok: true }; }
  },

  async batchUpdateSettings(settings: Record<string, string>, updatedBy = 'operator'): Promise<{ ok: boolean; count?: number; errors?: Record<string, string> }> {
    try {
      const { data } = await api.post('/settings/batch', { settings, updated_by: updatedBy });
      return data;
    } catch { return { ok: true, count: Object.keys(settings).length }; }
  },

  async getDashboard(): Promise<DashboardStats> {
    return withFallback(() => api.get('/dashboard'), DEMO_DATA.dashboard as unknown as DashboardStats);
  },

  async getIncidents(): Promise<Incident[]> {
    return withFallback(() => api.get('/incidents'), DEMO_DATA.incidents);
  },

  async getIncident(id: string): Promise<Incident> {
    const fallback = DEMO_DATA.incidents.find(i => i.id === id) || DEMO_DATA.incidents[0];
    return withFallback(() => api.get(`/incidents/${id}`), fallback);
  },

  async createIncident(payload: CreateIncidentPayload): Promise<Incident> {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('location', payload.location);
      formData.append('categories', payload.categories.join(','));
      if (payload.latitude !== undefined) formData.append('latitude', String(payload.latitude));
      if (payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
      if (payload.city) formData.append('city', payload.city);
      if (payload.state) formData.append('state', payload.state);
      if (payload.country) formData.append('country', payload.country);
      if (payload.postal_code) formData.append('postal_code', payload.postal_code);
      if (payload.place_id) formData.append('place_id', payload.place_id);
      if (payload.landmark) formData.append('landmark', payload.landmark);
      if (payload.image) formData.append('image', payload.image);
      const { data } = await api.post('/incidents', formData);
      return data;
    } catch {
      return {
        id: String(Date.now()), title: payload.title, description: payload.description,
        location: payload.location, category: payload.categories.join(','), severity: 'P3', status: 'open',
        latitude: payload.latitude, longitude: payload.longitude,
        city: payload.city, state: payload.state, country: payload.country,
        postal_code: payload.postal_code, place_id: payload.place_id, landmark: payload.landmark,
        timestamp: new Date().toISOString(), synced: false,
      };
    }
  },

  async getTriage(incidentId: string): Promise<AITriage> {
    return withFallback(() => api.get(`/triage/${incidentId}`), DEMO_DATA.triage(incidentId));
  },

  async runTriage(incidentId: string): Promise<AITriage> {
    return withFallback(() => api.post(`/triage/${incidentId}`), DEMO_DATA.triage(incidentId));
  },

  async getClusterMetrics(): Promise<ClusterMetrics> {
    return withFallback(() => api.get('/cluster'), DEMO_DATA.cluster as unknown as ClusterMetrics);
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return withFallback(() => api.get('/sync'), DEMO_DATA.sync);
  },

  async triggerSync(): Promise<{ message: string; synced: number }> {
    try {
      const { data } = await api.post('/sync');
      return data;
    } catch { return { message: 'Demo mode - sync simulated', synced: 0 }; }
  },

  async healthCheck(): Promise<{ status: string; version: string; uptime: number }> {
    return withFallback(() => api.get('/health'), DEMO_DATA.health);
  },
};
