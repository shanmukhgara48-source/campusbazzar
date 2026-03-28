/**
 * Offer service — Cloudflare Worker API (replaces Firestore).
 */
import { useEffect, useState } from 'react';
import { offersApi, ApiOffer } from './api';

export type { ApiOffer as FSOffer };

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered';

export interface CreateOfferInput {
  listingId: string;
  listingTitle?: string;
  listingImage?: string;
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  offerPrice: number;
  askingPrice?: number;
  message?: string;
}

/**
 * createOffer — accepts either the full CreateOfferInput object
 * (used by OfferScreen) or legacy positional args (listingId, amount, message).
 */
export async function createOffer(
  inputOrListingId: CreateOfferInput | string,
  amount?: number,
  message?: string,
): Promise<string> {
  let listingId: string;
  let offerAmount: number;
  let offerMessage: string | undefined;

  if (typeof inputOrListingId === 'string') {
    listingId   = inputOrListingId;
    offerAmount = amount!;
    offerMessage = message;
  } else {
    listingId    = inputOrListingId.listingId;
    offerAmount  = inputOrListingId.offerPrice;
    offerMessage = inputOrListingId.message;
  }

  const { offer } = await offersApi.create(listingId, offerAmount, offerMessage);
  return offer.id;
}

/** Accepts an offer. Returns the new transactionId created by the server. */
export async function acceptOffer(offerOrId: ApiOffer | string): Promise<string | undefined> {
  const id = typeof offerOrId === 'string' ? offerOrId : offerOrId.id;
  const { transactionId } = await offersApi.update(id, 'accepted');
  return transactionId;
}

export async function declineOffer(offerOrId: ApiOffer | string): Promise<void> {
  const id = typeof offerOrId === 'string' ? offerOrId : offerOrId.id;
  await offersApi.update(id, 'declined');
}

/** Alias for declineOffer — used by dashboard and chat screens. */
export async function rejectOffer(offerOrId: ApiOffer | string): Promise<void> {
  return declineOffer(offerOrId);
}

export async function counterOffer(offerId: string, counterAmount: number): Promise<void> {
  await offersApi.update(offerId, 'countered', counterAmount);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListingOffers(listingId: string | undefined) {
  const [offers, setOffers]   = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    offersApi.byListing(listingId)
      .then(({ offers: data }) => setOffers(data))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  return { offers, loading };
}

export function useUserOffers(userId: string | undefined) {
  const [offers, setOffers]   = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    offersApi.byUser(userId)
      .then(({ offers: data }) => setOffers(normalizeOffers(data)))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return { offers, loading };
}

/**
 * useSellerOffers — fetches all offers received by a seller.
 * Normalizes `amount` → `offerPrice` so dashboard screens work without change.
 */
export function useSellerOffers(sellerId: string | undefined) {
  const [offers, setOffers]   = useState<ApiOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) { setLoading(false); return; }
    offersApi.byUser(sellerId)
      .then(({ offers: data }) => setOffers(normalizeOffers(data)))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [sellerId]);

  return { offers, loading };
}

/** Ensures every offer has offerPrice set (fallback to amount). */
function normalizeOffers(offers: ApiOffer[]): ApiOffer[] {
  return offers.map(o => ({ ...o, offerPrice: o.offerPrice ?? o.amount }));
}
