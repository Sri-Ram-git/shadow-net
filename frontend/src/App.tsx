import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Profile } from './pages/auth/Profile';
import { Dashboard } from './pages/Dashboard';
import { LiveIncidents } from './pages/LiveIncidents';
import { CreateIncident } from './pages/CreateIncident';
import { ClusterHealth } from './pages/ClusterHealth';
import { AITriage } from './pages/AITriage';
import { SyncStatus } from './pages/SyncStatus';
import { Settings } from './pages/Settings';
import { Statistics } from './pages/Statistics';

export function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
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
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
