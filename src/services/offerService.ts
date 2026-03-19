import {
  collection, doc, addDoc, updateDoc, getDocs, writeBatch,
  query, where, orderBy, onSnapshot, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { createTransaction } from './transactionService';
import { handlePurchase } from './listingService';
import { createNotification } from './notificationsService';

// Firestore path: offers/{offerId}

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface FSOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  offerPrice: number;
  askingPrice: number;
  message: string;
  status: OfferStatus;
  createdAt: unknown;
}

export type CreateOfferData = Omit<FSOffer, 'id' | 'status' | 'createdAt'>;

export async function createOffer(data: CreateOfferData): Promise<string> {
  const ref = await addDoc(collection(db, 'offers'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOfferStatus(offerId: string, status: OfferStatus): Promise<void> {
  await updateDoc(doc(db, 'offers', offerId), { status });
}

/** Seller-side: all offers on this seller's listings */
export function useSellerOffers(sellerId: string | undefined) {
  const [offers, setOffers]   = useState<FSOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    const q = query(
      collection(db, 'offers'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSOffer)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [sellerId]);

  return { offers, loading };
}

/**
 * Full accept flow (called by seller):
 *  1. Mark this offer as 'accepted'
 *  2. Create a transaction record
 *  3. Atomically decrement / delete the listing (handlePurchase)
 *  4. Batch-reject all other pending offers for this listing
 *  5. Notify the buyer
 *
 * Returns the new transactionId.
 */
export async function acceptOffer(offer: FSOffer, sellerName: string): Promise<string> {
  // 1. Accept
  await updateDoc(doc(db, 'offers', offer.id), { status: 'accepted' });

  // 2. Transaction
  const txId = await createTransaction({
    listingId:    offer.listingId,
    listingTitle: offer.listingTitle,
    listingImage: offer.listingImage,
    listingPrice: offer.askingPrice,
    buyerId:      offer.buyerId,
    buyerName:    offer.buyerName,
    sellerId:     offer.sellerId,
    sellerName,
    amount:       offer.offerPrice,
  });

  // 3. Mark listing sold (non-fatal)
  try {
    await handlePurchase(offer.listingId);
  } catch (e) {
    console.warn('[acceptOffer] handlePurchase non-fatal:', e);
  }

  // 4. Batch-reject other pending offers for the same listing
  try {
    const q    = query(collection(db, 'offers'), where('listingId', '==', offer.listingId), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let changed = 0;
    snap.docs.forEach(d => {
      if (d.id !== offer.id) { batch.update(d.ref, { status: 'rejected' }); changed++; }
    });
    if (changed > 0) await batch.commit();
  } catch (e) {
    console.warn('[acceptOffer] batch-reject non-fatal:', e);
  }

  // 5. Notify buyer
  try {
    await createNotification(
      offer.buyerId,
      'offer',
      'Offer Accepted!',
      `Your offer of ₹${offer.offerPrice.toLocaleString('en-IN')} for "${offer.listingTitle}" was accepted. Check your transactions.`,
      { offerId: offer.id, transactionId: txId, listingId: offer.listingId },
    );
  } catch (e) {
    console.warn('[acceptOffer] notify buyer non-fatal:', e);
  }

  return txId;
}

/**
 * Reject an offer and notify the buyer.
 */
export async function rejectOffer(offer: FSOffer): Promise<void> {
  await updateDoc(doc(db, 'offers', offer.id), { status: 'rejected' });

  try {
    await createNotification(
      offer.buyerId,
      'offer',
      'Offer Declined',
      `Your offer of ₹${offer.offerPrice.toLocaleString('en-IN')} for "${offer.listingTitle}" was declined by the seller.`,
      { offerId: offer.id, listingId: offer.listingId },
    );
  } catch (e) {
    console.warn('[rejectOffer] notify buyer non-fatal:', e);
  }
}

/** Buyer-side: all offers placed by this buyer */
export function useBuyerOffers(buyerId: string | undefined) {
  const [offers, setOffers]   = useState<FSOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buyerId) { setLoading(false); return; }
    const q = query(
      collection(db, 'offers'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSOffer)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [buyerId]);

  return { offers, loading };
}
