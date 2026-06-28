import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';

interface SystemConfigContextValue {
  settings: Record<string, string>;
  get: (key: string, fallback?: string) => string;
  getBool: (key: string, fallback?: boolean) => boolean;
  set: (key: string, value: string) => Promise<boolean>;
  setBatch: (items: Record<string, string>) => Promise<boolean>;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  loading: boolean;
}

const SystemConfigContext = createContext<SystemConfigContextValue | null>(null);

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    apiService.getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return wsService.onMessage((msg) => {
      if (msg.type === 'settings_changed' && msg.data) {
        const d = msg.data as { key?: string; value?: string; settings?: Record<string, string> };
        if (d.settings) {
          setSettings((prev) => ({ ...prev, ...d.settings }));
        } else if (d.key !== undefined && d.value !== undefined) {
          setSettings((prev) => ({ ...prev, [d.key!]: d.value! }));
        }
      }
    });
  }, []);

  const get = useCallback((key: string, fallback = '') => settings[key] ?? fallback, [settings]);

  const getBool = useCallback((key: string, fallback = false) => {
    const v = settings[key];
    if (v === undefined) return fallback;
    return v === 'true';
  }, [settings]);

  const set = useCallback(async (key: string, value: string): Promise<boolean> => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveState('saving');
    if (timers.current[key]) clearTimeout(timers.current[key]);
    const result = await apiService.updateSetting(key, value);
    if (result.ok) {
      setSaveState('saved');
      timers.current[key] = setTimeout(() => setSaveState('idle'), 2000);
      return true;
    }
    setSaveState('error');
    timers.current[key] = setTimeout(() => setSaveState('idle'), 3000);
    return false;
  }, []);

  const setBatch = useCallback(async (items: Record<string, string>): Promise<boolean> => {
    setSettings((prev) => ({ ...prev, ...items }));
    setSaveState('saving');
    const result = await apiService.batchUpdateSettings(items);
    if (result.ok) {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      return true;
    }
    setSaveState('error');
    setTimeout(() => setSaveState('idle'), 3000);
    return false;
  }, []);

  return (
    <SystemConfigContext.Provider value={{ settings, get, getBool, set, setBatch, saveState, loading }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const ctx = useContext(SystemConfigContext);
  if (!ctx) throw new Error('useSystemConfig must be used within SystemConfigProvider');
  return ctx;
}
