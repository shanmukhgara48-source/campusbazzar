import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

// Firestore path: transactions/{transactionId}

export type TxStatus =
  | 'pending'
  | 'accepted'
  | 'meetup_set'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface FSTransaction {
  id: string;
  // Listing info (denormalized — avoids extra fetch in TransactionScreen)
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  // Participants
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  // Deal
  amount: number;
  meetupLocation?: string;
  meetupTime?: string;
  paymentMethod?: string;
  // Status
  status: TxStatus;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  createdAt: unknown;
}

export type CreateTransactionData = Omit<
  FSTransaction,
  'id' | 'status' | 'createdAt' | 'buyerConfirmed' | 'sellerConfirmed'
>;

export async function createTransaction(data: CreateTransactionData): Promise<string> {
  const ref = await addDoc(collection(db, 'transactions'), {
    ...data,
    status:          'pending',
    buyerConfirmed:  false,
    sellerConfirmed: false,
    createdAt:       serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransactionStatus(
  id: string,
  status: TxStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, 'transactions', id), { status, ...(extra ?? {}) });
}

export async function confirmHandoff(id: string, role: 'buyer' | 'seller'): Promise<void> {
  const field = role === 'buyer' ? 'buyerConfirmed' : 'sellerConfirmed';
  await updateDoc(doc(db, 'transactions', id), { [field]: true });
}

// ─── Real-time hooks ──────────────────────────────────────────────────────────

/** Single transaction — real-time */
export function useTransaction(transactionId: string | undefined) {
  const [transaction, setTransaction] = useState<FSTransaction | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!transactionId) { setLoading(false); return; }
    const unsub: Unsubscribe = onSnapshot(
      doc(db, 'transactions', transactionId),
      snap => {
        setTransaction(snap.exists() ? ({ id: snap.id, ...snap.data() } as FSTransaction) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [transactionId]);

  return { transaction, loading };
}

export function useBuyerTransactions(buyerId: string) {
  const [transactions, setTransactions] = useState<FSTransaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!buyerId) return;
    const q = query(
      collection(db, 'transactions'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSTransaction)));
      setLoading(false);
    });
    return unsub;
  }, [buyerId]);

  return { transactions, loading };
}

export function useSellerTransactions(sellerId: string) {
  const [transactions, setTransactions] = useState<FSTransaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const q = query(
      collection(db, 'transactions'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSTransaction)));
      setLoading(false);
    });
    return unsub;
  }, [sellerId]);

  return { transactions, loading };
}
