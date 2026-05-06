import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface AuthState {
  token: string | null;
  role: string | null;
  clinicCode: string | null;
  clinicId: string | null;
}

interface AuthContextType extends AuthState {
  login: (data: AuthState) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'vt_auth';
const empty: AuthState = { token: null, role: null, clinicCode: null, clinicId: null };

function loadStored(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : empty;
  } catch {
    return empty;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadStored);

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      api.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      delete api.defaults.headers.common['Authorization'];
    }
  }, [auth]);

  const login = (data: AuthState) => setAuth(data);
  const logout = () => setAuth(empty);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
