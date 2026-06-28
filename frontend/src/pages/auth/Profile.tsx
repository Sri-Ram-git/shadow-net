import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { motion } from 'framer-motion';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loginLogs, setLoginLogs] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    apiService.getProfile().then(setProfile).catch(() => {});
    apiService.getLoginLogs().then(setLoginLogs).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiService.updateProfile({ full_name: fullName, organization });
      setSaveMsg('Profile updated');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="page max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="panel space-y-6">
        <div>
          <div className="mono-label">Full Name</div>
          <input
            className="input mt-1.5"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <div className="mono-label">Email</div>
          <div className="text-sm text-ink-300 mt-1.5">{profile?.email}</div>
        </div>

        <div>
          <div className="mono-label">Username</div>
          <div className="text-sm text-ink-300 mt-1.5">{profile?.username}</div>
        </div>

        <div>
          <div className="mono-label">Organization</div>
          <input
            className="input mt-1.5"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>

        {saveMsg && (
          <div className={`text-xs ${saveMsg === 'Profile updated' ? 'text-safe' : 'text-critical'}`}>
            {saveMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button onClick={handleLogout} className="btn-ghost text-sm">Sign out</button>
        </div>
      </div>

      {/* Login History */}
      {loginLogs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel">
          <div className="panel-header">
            <div className="panel-title">Login History</div>
          </div>
          <div className="space-y-3">
            {loginLogs.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-ink-300">
                <span className="font-mono">
                  {new Date(log.created_at || log.timestamp).toLocaleString()}
                </span>
                <span className="text-ink-500">{log.ip_address}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
