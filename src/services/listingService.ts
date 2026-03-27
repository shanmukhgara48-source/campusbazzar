/**
 * Listing service — Cloudflare Worker API (replaces Firestore).
 * Preserves existing function signatures so screens need minimal changes.
 */
import { useEffect, useState, useCallback } from 'react';
import { listingsApi, ApiListing } from './api';

export type ListingStatus = 'active' | 'sold' | 'reserved' | 'hidden' | 'flagged';

// Re-export so screens can import FSListing from listingService
export type FSListing = ApiListing;

// ─── Async functions ──────────────────────────────────────────────────────────

export async function fetchListings(params?: {
  category?: string;
  q?: string;
  limit?: number;
}): Promise<ApiListing[]> {
  const { listings } = await listingsApi.list(params);
  return listings;
}

export async function fetchListing(id: string): Promise<ApiListing | null> {
  try {
    const { listing } = await listingsApi.get(id);
    return listing;
  } catch {
    return null;
  }
}

export async function createListing(data: {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  department?: string;
  tags?: string[];
}): Promise<string> {
  const { listing } = await listingsApi.create(data);
  return listing.id;
}

export async function updateListing(id: string, data: Partial<ApiListing>): Promise<void> {
  await listingsApi.update(id, data);
}

export async function deleteListing(id: string): Promise<void> {
  await listingsApi.delete(id);
}

/** Mark listing as sold after successful payment */
export async function handlePurchase(listingId: string): Promise<void> {
  await listingsApi.update(listingId, { status: 'sold' } as Partial<ApiListing>);
}

// ─── React hooks (polling replaces onSnapshot) ────────────────────────────────

export function useListings(params?: { category?: string; q?: string }) {
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const { listings: data } = await listingsApi.list(params);
      setListings(data);
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.q]);

  useEffect(() => {
    load();
  }, [load]);

  return { listings, loading, refresh: load };
}

export function useSellerListings(sellerId: string | undefined) {
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }
    try {
      const { listings: data } = await listingsApi.list({ sellerId });
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { listings, loading, refresh: load };
}

export function useListing(listingId: string | undefined) {
  const [listing, setListing] = useState<ApiListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    listingsApi.get(listingId)
      .then(({ listing: l }) => setListing(l))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  return { listing, loading };
}
