import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { wsService } from './services/websocket';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemConfigProvider } from './contexts/SystemConfig';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const LiveIncidents = lazy(() => import('./pages/LiveIncidents').then(m => ({ default: m.LiveIncidents })));
const CreateIncident = lazy(() => import('./pages/CreateIncident').then(m => ({ default: m.CreateIncident })));
const ClusterHealth = lazy(() => import('./pages/ClusterHealth').then(m => ({ default: m.ClusterHealth })));
const AITriage = lazy(() => import('./pages/AITriage').then(m => ({ default: m.AITriage })));
const SyncStatus = lazy(() => import('./pages/SyncStatus').then(m => ({ default: m.SyncStatus })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-3 text-center">
        <div className="w-6 h-6 border border-ink-400 animate-spin mx-auto" />
        <p className="text-xs font-mono text-ink-500 uppercase tracking-[0.1em]">Loading…</p>
      </div>
    </div>
  );
}

export function App() {
  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <SystemConfigProvider>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </SystemConfigProvider>
    </ErrorBoundary>
  );
}
