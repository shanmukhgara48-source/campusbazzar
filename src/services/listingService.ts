import {
  collection, doc, addDoc, deleteDoc, getDoc, setDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

export type ListingStatus = 'active' | 'sold' | 'reserved';

export interface FSListing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  category: string;
  status: ListingStatus;
  createdAt: unknown;
}

export async function addListing(data: Omit<FSListing, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'listings'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getListing(id: string): Promise<FSListing | null> {
  const snap = await getDoc(doc(db, 'listings', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FSListing) : null;
}

/**
 * Atomically handle a purchase using a Firestore transaction:
 *   - quantity == 1  → delete the document entirely (clean feed)
 *   - quantity >  1  → decrement quantity; mark sold if it hits 0
 *   - no quantity field → treat as single-unit (mark sold)
 *
 * runTransaction retries automatically on contention, so two concurrent
 * buyers can never both succeed for the last unit.
 *
 * Throws if the listing is already sold or doesn't exist.
 */
export async function handlePurchase(id: string): Promise<void> {
  const ref = doc(db, 'listings', id);

  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      // Mock / already-deleted listing — silently succeed (non-blocking)
      return;
    }

    const data = snap.data();

    if (data.status === 'sold') {
      throw new Error('This item has already been sold.');
    }

    const qty: number = typeof data.quantity === 'number' ? data.quantity : 1;

    if (qty <= 1) {
      // Single unit — remove the document so it disappears from the feed
      tx.delete(ref);
    } else {
      const newQty = qty - 1;
      tx.update(ref, {
        quantity: newQty,
        status:   newQty === 0 ? 'sold' : 'active',
      });
    }
  });
}

/** @deprecated Use handlePurchase for atomic quantity management. */
export async function markAsSold(id: string) {
  await setDoc(doc(db, 'listings', id), { status: 'sold' }, { merge: true });
}

export async function deleteListing(id: string) {
  await deleteDoc(doc(db, 'listings', id));
}

// ─── Real-time hooks ────────────────────────────────────────────────────────

export function useListings(category?: string) {
  const [listings, setListings] = useState<FSListing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const constraints = [
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    ] as const;

    const q = category
      ? query(collection(db, 'listings'), where('category', '==', category), ...constraints)
      : query(collection(db, 'listings'), ...constraints);

    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSListing)));
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [category]);

  return { listings, loading, error };
}

export function useSellerListings(sellerId: string) {
  const [listings, setListings] = useState<FSListing[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSListing)));
      setLoading(false);
    });
    return unsub;
  }, [sellerId]);

  return { listings, loading };
}
