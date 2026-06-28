import axios from 'axios';
import type { Incident, AITriage, ClusterMetrics, DashboardStats, SyncQueueItem, CreateIncidentPayload } from '../types';

function getBaseURL(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8001/api`;
    }
    return `${protocol}//${hostname}/api`;
  }
  return '/api';
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

export const apiService = {
  async getSettings(): Promise<Record<string, string>> {
    const { data } = await api.get('/settings');
    return data;
  },

  async getSetting(key: string): Promise<{ key: string; value: string }> {
    const { data } = await api.get(`/settings/${key}`);
    return data;
  },

  async updateSetting(key: string, value: string, updatedBy = 'operator'): Promise<{ ok: boolean; error?: string }> {
    const { data } = await api.put(`/settings/${key}`, { value, updated_by: updatedBy });
    return data;
  },

  async batchUpdateSettings(settings: Record<string, string>, updatedBy = 'operator'): Promise<{ ok: boolean; count?: number; errors?: Record<string, string> }> {
    const { data } = await api.post('/settings/batch', { settings, updated_by: updatedBy });
    return data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get('/dashboard');
    return data;
  },

  async getIncidents(): Promise<Incident[]> {
    const { data } = await api.get('/incidents');
    return data;
  },

  async getIncident(id: string): Promise<Incident> {
    const { data } = await api.get(`/incidents/${id}`);
    return data;
  },

  async createIncident(payload: CreateIncidentPayload): Promise<Incident> {
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
    if (payload.image) {
      formData.append('image', payload.image);
    }
    const { data } = await api.post('/incidents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getTriage(incidentId: string): Promise<AITriage> {
    const { data } = await api.get(`/triage/${incidentId}`);
    return data;
  },

  async runTriage(incidentId: string): Promise<AITriage> {
    const { data } = await api.post(`/triage/${incidentId}`);
    return data;
  },

  async getClusterMetrics(): Promise<ClusterMetrics> {
    const { data } = await api.get('/cluster');
    return data;
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const { data } = await api.get('/sync');
    return data;
  },

  async triggerSync(): Promise<{ message: string; synced: number }> {
    const { data } = await api.post('/sync');
    return data;
  },

  async healthCheck(): Promise<{ status: string; version: string; uptime: number }> {
    const { data } = await api.get('/health');
    return data;
  },
};
