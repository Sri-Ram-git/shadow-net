import { useState } from 'react';
import { Save, Server, Bell, Shield, Wifi, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export function Settings() {
  const [settings, setSettings] = useState({
    ollamaEndpoint: 'http://ollama:11434',
    syncInterval: 60,
    autoSync: true,
    notifications: true,
    darkMode: true,
    logLevel: 'info',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Settings saved');
    setSaving(false);
  };

  const update = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure ShadowNet edge infrastructure</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-200">AI Service</h3>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ollama Endpoint</label>
          <input
            type="text"
            value={settings.ollamaEndpoint}
            onChange={(e) => update('ollamaEndpoint', e.target.value)}
            className="input-field font-mono"
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Wifi className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-200">Sync Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Sync Interval (seconds)
            </label>
            <input
              type="number"
              value={settings.syncInterval}
              onChange={(e) => update('syncInterval', parseInt(e.target.value))}
              className="input-field w-32"
              min={10}
              max={3600}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => update('autoSync', e.target.checked)}
              className="w-4 h-4 rounded border-dark-500 bg-dark-700 accent-accent"
            />
            <span className="text-sm text-gray-300">Auto-sync when online</span>
          </label>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-200">Notifications</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => update('notifications', e.target.checked)}
              className="w-4 h-4 rounded border-dark-500 bg-dark-700 accent-accent"
            />
            <span className="text-sm text-gray-300">Enable desktop notifications</span>
          </label>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-200">System</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Log Level</label>
            <select
              value={settings.logLevel}
              onChange={(e) => update('logLevel', e.target.value)}
              className="input-field w-32"
            >
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Version: 1.0.0</p>
            <p>Mode: Offline-First Edge</p>
            <p>Database: SQLite (Local)</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
