import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/incidents': 'Incidents',
  '/incidents/create': 'Report Incident',
  '/cluster': 'Cluster',
  '/triage': 'AI Triage',
  '/sync': 'Sync',
  '/statistics': 'Analytics',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const online = useOnlineStatus();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const label = pageLabels[location.pathname] || 'ShadowNet';

  return (
    <header className="h-14 bg-surface-50 border-b border-border flex items-center justify-between px-6 shrink-0">
      <span className="text-sm font-medium text-ink-100">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${online ? 'status-dot-online' : 'status-dot-offline'}`} />
          <span className="text-[11px] font-mono text-ink-500 uppercase tracking-[0.06em]">
            {online ? 'connected' : 'offline'}
          </span>
        </div>
        <span className="text-[11px] font-mono text-ink-500">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[11px] font-mono text-ink-500">UTC</span>
      </div>
    </header>
  );
}
