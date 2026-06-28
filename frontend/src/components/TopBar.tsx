import { useLocation } from 'react-router-dom';
import { Clock, WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/incidents': 'Live Incidents',
  '/incidents/create': 'Create Incident',
  '/cluster': 'Cluster Health',
  '/triage': 'AI Triage',
  '/sync': 'Sync Status',
  '/statistics': 'Statistics',
  '/settings': 'Settings',
};

export function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);

  const title = pageTitles[location.pathname] || 'ShadowNet';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700 flex items-center justify-between px-6 shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          {online ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-warning" />
          )}
          <span className={online ? 'text-success' : 'text-warning'}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="font-mono">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
