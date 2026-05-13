import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { verifySession } from '../api/auth';

interface AuthState {
  clinicId: string | null;
  clinicCode: string | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  initializing: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ clinicId: null, clinicCode: null });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setInitializing(true);
      if (!user || !user.emailVerified) {
        setState({ clinicId: null, clinicCode: null });
        setInitializing(false);
        return;
      }
      try {
        const session = await verifySession();
        setState({ clinicId: session.clinicId, clinicCode: session.clinicCode });
      } catch {
        setState({ clinicId: null, clinicCode: null });
      } finally {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setState({ clinicId: null, clinicCode: null });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      isAuthenticated: !!state.clinicId,
      initializing,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
