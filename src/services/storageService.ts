import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listing, Favourite, WishlistItem } from '../types';

const KEYS = {
  LISTINGS_CACHE:   'cb:listings_cache',
  FAVOURITES:       'cb:favourites',
  WISHLIST:         'cb:wishlist',
  LAST_SYNC:        'cb:last_sync',
} as const;

const CACHE_LIMIT = 20;

// ─── Listings cache ───────────────────────────────────────────────────────────
export async function cacheListings(listings: Listing[]): Promise<void> {
  const slice = listings.slice(0, CACHE_LIMIT);
  await AsyncStorage.setItem(KEYS.LISTINGS_CACHE, JSON.stringify(slice));
  await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
}

export async function getCachedListings(): Promise<Listing[]> {
  const raw = await AsyncStorage.getItem(KEYS.LISTINGS_CACHE);
  return raw ? (JSON.parse(raw) as Listing[]) : [];
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.LAST_SYNC);
}

// ─── Favourites ───────────────────────────────────────────────────────────────
export async function getFavourites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVOURITES);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function addFavourite(listingId: string): Promise<void> {
  const current = await getFavourites();
  if (!current.includes(listingId)) {
    await AsyncStorage.setItem(KEYS.FAVOURITES, JSON.stringify([...current, listingId]));
  }
}

export async function removeFavourite(listingId: string): Promise<void> {
  const current = await getFavourites();
  await AsyncStorage.setItem(
    KEYS.FAVOURITES,
    JSON.stringify(current.filter(id => id !== listingId)),
  );
}

export async function isFavourite(listingId: string): Promise<boolean> {
  const current = await getFavourites();
  return current.includes(listingId);
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export async function getWishlist(): Promise<WishlistItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.WISHLIST);
  return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
}

export async function saveWishlist(items: WishlistItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.WISHLIST, JSON.stringify(items));
}

export async function addWishlistItem(item: WishlistItem): Promise<void> {
  const current = await getWishlist();
  await saveWishlist([...current, item]);
}

export async function removeWishlistItem(id: string): Promise<void> {
  const current = await getWishlist();
  await saveWishlist(current.filter(w => w.id !== id));
}

// ─── Utility ──────────────────────────────────────────────────────────────────
export async function clearAllCache(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
