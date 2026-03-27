import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredUser, signOut as authSignOut, DBUser } from '../services/authService';
import { authApi } from '../services/api';
import { ApiUser } from '../services/api';

interface AuthContextType {
  user: DBUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On app start: restore session from stored JWT
  useEffect(() => {
    getStoredUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await authSignOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await getStoredUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
