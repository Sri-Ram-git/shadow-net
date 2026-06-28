import axios from 'axios';
import type { Incident, AITriage, ClusterMetrics, DashboardStats, SyncQueueItem, CreateIncidentPayload } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
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
    formData.append('category', payload.category);
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
