import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  organization?: string;
  role?: string;
  status: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    organization?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiService.getProfile()
        .then(setUser)
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await apiService.login(email, password);
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    organization?: string;
  }) => {
    setError(null);
    try {
      await apiService.register(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
