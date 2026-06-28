import axios from 'axios';
import type { Incident, AITriage, ClusterMetrics, DashboardStats, SyncQueueItem, CreateIncidentPayload } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refresh_token: refresh });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch { /* refresh failed */ }
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    const message = error.response?.data?.detail || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  // Auth
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  async register(payload: { full_name: string; username: string; email: string; password: string; organization?: string }) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  async logout() {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  },
  async updateProfile(payload: { full_name?: string; organization?: string; phone?: string }) {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  },
  async changePassword(current_password: string, new_password: string) {
    const { data } = await api.post('/auth/change-password', { current_password, new_password });
    return data;
  },
  async getLoginLogs() {
    const { data } = await api.get('/auth/login-logs');
    return data;
  },
  async getAuditLogs() {
    const { data } = await api.get('/auth/audit-logs');
    return data;
  },
  // Admin
  async getAdminUsers(search?: string) {
    const { data } = await api.get('/admin/users', { params: { search } });
    return data;
  },
  async getAdminLoginLogs() {
    const { data } = await api.get('/admin/login-logs');
    return data;
  },
  async getAdminAuditLogs() {
    const { data } = await api.get('/admin/audit-logs');
    return data;
  },
  async disableUser(userId: string) {
    const { data } = await api.post(`/admin/users/${userId}/disable`);
    return data;
  },
  async enableUser(userId: string) {
    const { data } = await api.post(`/admin/users/${userId}/enable`);
    return data;
  },
  // Incidents
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
    if (payload.image) formData.append('image', payload.image);
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
