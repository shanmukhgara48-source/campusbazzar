/**
 * Transaction service — Cloudflare Worker API (replaces Firestore).
 * Hook interface preserved so TransactionScreen/MeetupScreen need no changes.
 */
import { useEffect, useState, useCallback } from 'react';
import { transactionsApi, ApiTransaction } from './api';

export type TxStatus =
  | 'pending'
  | 'accepted'
  | 'meetup_set'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type { ApiTransaction as FSTransaction };

/** Payload encoded inside the delivery QR code */
export interface QRPayload {
  v: 1;
  txId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
}

export type CreateTransactionData = Omit<ApiTransaction,
  'id' | 'status' | 'createdAt' | 'buyerConfirmed' | 'sellerConfirmed' | 'isDelivered' | 'deliveredAt'
>;

export async function createTransaction(data: CreateTransactionData): Promise<string> {
  const { transactionId } = await transactionsApi.create(data as any);
  return transactionId;
}

export async function updateTransactionStatus(
  id: string,
  status: TxStatus,
  extra?: Record<string, unknown>,
): Promise<void> {
  await transactionsApi.update(id, { status, ...extra } as any);
}

export async function confirmHandoff(id: string, role: 'buyer' | 'seller'): Promise<void> {
  const field = role === 'buyer' ? 'buyerConfirmed' : 'sellerConfirmed';
  await transactionsApi.update(id, { [field]: true } as any);
}

/**
 * Verify QR code at meetup — marks transaction completed if valid.
 */
export async function verifyQRCode(
  scannedData: string,
): Promise<{ ok: boolean; txId?: string; error?: string }> {
  let payload: QRPayload;
  try {
    payload = JSON.parse(scannedData) as QRPayload;
  } catch {
    return { ok: false, error: 'Invalid QR code format' };
  }
  if (payload.v !== 1 || !payload.txId) return { ok: false, error: 'Unrecognised QR code' };

  try {
    await transactionsApi.verifyQR(payload.txId, scannedData);
    return { ok: true, txId: payload.txId };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Verification failed' };
  }
}

/**
 * OTP fallback — seller enters buyer's 4-digit OTP manually.
 */
export async function verifyDeliveryOtp(id: string, enteredOtp: string): Promise<boolean> {
  const { matched } = await transactionsApi.verifyOTP(id, enteredOtp);
  return matched;
}

// ─── Real-time hooks (polling replaces onSnapshot) ────────────────────────────

export function useTransaction(transactionId: string | undefined) {
  const [transaction, setTransaction] = useState<ApiTransaction | null>(null);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!transactionId) { setLoading(false); return; }
    try {
      const { transaction: tx } = await transactionsApi.get(transactionId);
      setTransaction(tx);
    } catch {
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    load();
    // Poll every 5s so status updates (e.g. seller confirming) reflect quickly
    const timer = setInterval(load, 5_000);
    return () => clearInterval(timer);
  }, [load]);

  return { transaction, loading };
}

export function useBuyerTransactions(buyerId: string) {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!buyerId) return;
    transactionsApi.byBuyer(buyerId)
      .then(({ transactions: data }) => setTransactions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buyerId]);

  return { transactions, loading };
}

export function useSellerTransactions(sellerId: string) {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    transactionsApi.bySeller(sellerId)
      .then(({ transactions: data }) => setTransactions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sellerId]);

  return { transactions, loading };
}
