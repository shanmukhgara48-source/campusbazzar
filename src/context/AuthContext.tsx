import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { subscribeToAuthState, signOut } from '../services/authService';
import { DBUser } from '../services/authService';

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

  const loadUserFromDB = async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        console.log('[AuthContext] loaded user from Firestore:', uid);
        setUser(snap.data() as DBUser);
      } else {
        // Doc not yet written (race condition on signup) — create minimal record
        console.log('[AuthContext] doc missing, creating fallback for:', uid);
        const fallback: DBUser = {
          uid,
          email:       firebaseUser.email ?? '',
          name:        firebaseUser.displayName ?? '',
          avatar:      '',
          college:     '',
          rollNumber:  '',
          createdAt:   serverTimestamp(),
        };
        await setDoc(doc(db, 'users', uid), fallback);
        setUser(fallback);
      }
    } catch (e) {
      console.log('[AuthContext] Firestore error, using minimal user:', e);
      // Still authenticate — do NOT block login because of a DB error
      setUser({
        uid,
        email:      firebaseUser.email ?? '',
        name:       firebaseUser.displayName ?? '',
        avatar:     '',
        college:    '',
        rollNumber: '',
        createdAt:  null,
      });
    }
  };

  useEffect(() => {
    const unsub = subscribeToAuthState(async firebaseUser => {
      console.log('[AuthContext] auth state changed, user:', firebaseUser?.uid ?? 'null');
      if (firebaseUser) {
        await loadUserFromDB(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) await loadUserFromDB(firebaseUser);
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
