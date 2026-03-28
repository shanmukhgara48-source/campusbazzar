/**
 * Review service — Cloudflare Worker API (replaces Firestore).
 */
import { useEffect, useState } from 'react';
import { getToken } from './api';

const BASE = process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL ?? '';

export interface FSReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  sellerId: string;
  rating: number;
  comment: string;
  createdAt: unknown;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
  });
  const data = await res.json() as T;
  return data;
}

export async function addReview(data: Omit<FSReview, 'id' | 'createdAt'>): Promise<string> {
  const res = await apiFetch<{ id: string }>('/reviews', { method: 'POST', body: JSON.stringify(data) });
  return res.id;
}

export function useSellerReviews(sellerId: string | undefined) {
  const [reviews, setReviews] = useState<FSReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    apiFetch<{ reviews: FSReview[] }>(`/reviews/seller/${sellerId}`)
      .then(({ reviews: data }) => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [sellerId]);

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return { reviews, loading, avgRating };
}
