'use client';

import { setToken, clearToken, adminLoginApi } from './api';

export async function login(email: string, password: string): Promise<void> {
  const { token } = await adminLoginApi(email, password);
  setToken(token);
}

export function logout() {
  clearToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin:token');
}
