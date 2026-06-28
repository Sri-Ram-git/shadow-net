import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { wsService } from './services/websocket';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemConfigProvider } from './contexts/SystemConfig';
import { Dashboard } from './pages/Dashboard';
import { LiveIncidents } from './pages/LiveIncidents';
import { CreateIncident } from './pages/CreateIncident';
import { ClusterHealth } from './pages/ClusterHealth';
import { AITriage } from './pages/AITriage';
import { SyncStatus } from './pages/SyncStatus';
import { Settings } from './pages/Settings';
import { Statistics } from './pages/Statistics';
import { NotFound } from './pages/NotFound';

export function App() {
  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <SystemConfigProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<LiveIncidents />} />
          <Route path="/incidents/create" element={<CreateIncident />} />
          <Route path="/cluster" element={<ClusterHealth />} />
          <Route path="/triage" element={<AITriage />} />
          <Route path="/sync" element={<SyncStatus />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </SystemConfigProvider>
    </ErrorBoundary>
  );
}
