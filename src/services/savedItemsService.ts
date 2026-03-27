/**
 * Saved items service — uses favourites API (replaces Firestore subcollections).
 */
import { useEffect, useState } from 'react';
import { getToken } from './api';
import { ApiListing } from './api';

const BASE = process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL ?? '';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return res.json() as Promise<T>;
}

export async function saveItem(userId: string, listingId: string): Promise<void> {
  await apiFetch(`/favourites`, { method: 'POST', body: JSON.stringify({ listingId }) });
}

export async function unsaveItem(userId: string, listingId: string): Promise<void> {
  await apiFetch(`/favourites/${listingId}`, { method: 'DELETE' });
}

export function useSavedItems(userId: string | undefined) {
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    apiFetch<{ favourites: { listingId: string }[] }>(`/favourites/user/${userId}`)
      .then(({ favourites }) => setSavedItems(favourites.map(f => f.listingId)))
      .catch(() => setSavedItems([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return { savedItems, loading };
}
