import { useState } from 'react';
import toast from 'react-hot-toast';

export function Settings() {
  const [s, set] = useState({
    ollamaEndpoint: 'http://ollama:11434',
    syncInterval: 60,
    autoSync: true,
    logLevel: 'info',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Settings saved');
    setSaving(false);
  };

  const update = (k: string, v: unknown) => set((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="page max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration</p>
      </div>

      <div className="panel space-y-6">
        <div>
          <p className="section-title mb-3">AI Service</p>
          <label className="mono-label mb-1 block">Ollama Endpoint</label>
          <input type="text" value={s.ollamaEndpoint} onChange={(e) => update('ollamaEndpoint', e.target.value)} className="input font-mono text-[13px]" />
        </div>

        <div className="hr" />

        <div>
          <p className="section-title mb-3">Sync</p>
          <div className="space-y-4">
            <div>
              <label className="mono-label mb-1 block">Interval (seconds)</label>
              <input type="number" value={s.syncInterval} onChange={(e) => update('syncInterval', parseInt(e.target.value))} className="input w-28" min={10} max={3600} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={s.autoSync} onChange={(e) => update('autoSync', e.target.checked)}
                className="w-3.5 h-3.5 border border-border bg-surface-100 accent-ink" />
              <span className="text-sm text-ink-300">Auto-sync when connected</span>
            </label>
          </div>
        </div>

        <div className="hr" />

        <div>
          <p className="section-title mb-3">System</p>
          <div className="space-y-4">
            <div>
              <label className="mono-label mb-1 block">Log Level</label>
              <select value={s.logLevel} onChange={(e) => update('logLevel', e.target.value)} className="select w-28">
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="text-[11px] font-mono text-ink-500 space-y-0.5">
              <p>Version: 1.0.0</p>
              <p>Mode: Offline-First Edge</p>
              <p>Database: SQLite</p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm mt-6">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
