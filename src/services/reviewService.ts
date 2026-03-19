import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

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

export async function addReview(data: Omit<FSReview, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reviews'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

// ─── Real-time hook ──────────────────────────────────────────────────────────

export function useSellerReviews(sellerId: string) {
  const [reviews, setReviews] = useState<FSReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!sellerId) return;
    const q = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FSReview));
      setReviews(data);
      setAvgRating(
        data.length ? data.reduce((sum, r) => sum + r.rating, 0) / data.length : 0,
      );
      setLoading(false);
    });
    return unsub;
  }, [sellerId]);

  return { reviews, avgRating, loading };
}
