import { useState } from 'react';

// Mock admin credentials — replace with Supabase auth when ready
const MOCK_EMAIL    = 'admin@campusbazaar.com';
const MOCK_PASSWORD = 'admin123';

interface MockUser {
  id: string;
  email: string;
}

interface AuthState {
  user: MockUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<MockUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('cb_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const signIn = async (email: string, password: string) => {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      const u = { id: 'mock-admin-uid', email };
      setUser(u);
      sessionStorage.setItem('cb_admin', JSON.stringify(u));
      return { error: null };
    }
    return { error: 'Invalid email or password.' };
  };

  const signOut = async () => {
    setUser(null);
    sessionStorage.removeItem('cb_admin');
  };

  return { user, isAdmin: !!user, loading: false, signIn, signOut };
}
