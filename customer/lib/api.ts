const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const TOKEN_KEY = 'cb:jwt_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (authenticated) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as any).error ?? `HTTP ${res.status}`);
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  college?: string;
  rollNumber?: string;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface ApiListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  status: 'active' | 'sold' | 'reserved' | 'hidden' | 'flagged';
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  department?: string;
  tags?: string[];
  createdAt: string;
}

export interface ApiOffer {
  id: string;
  listingId: string;
  buyerId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  counterAmount?: number;
  createdAt: string;
}

export interface ApiTransaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  listing?: ApiListing;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name: string; college?: string }) =>
    apiFetch<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }, false),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }, false),

  me: () =>
    apiFetch<{ user: ApiUser }>('/auth/me'),
};

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listingsApi = {
  list: (params?: { category?: string; q?: string; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    ).toString();
    return apiFetch<{ listings: ApiListing[] }>(`/listings${qs ? `?${qs}` : ''}`, {}, false);
  },

  get: (id: string) =>
    apiFetch<{ listing: ApiListing }>(`/listings/${id}`, {}, false),

  buyNow: (id: string, payment: { paymentMethod: 'online' | 'cod'; razorpayPaymentId?: string; razorpayOrderId?: string; razorpaySignature?: string }) =>
    apiFetch<{ transactionId: string }>(`/listings/${id}/buy-now`, { method: 'POST', body: JSON.stringify(payment) }),
};

// ─── Offers ───────────────────────────────────────────────────────────────────

export const offersApi = {
  create: (listingId: string, amount: number, message?: string) =>
    apiFetch<{ offer: ApiOffer }>('/offers', { method: 'POST', body: JSON.stringify({ listingId, amount, message }) }),
};

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export const razorpayApi = {
  createOrder: (amountInPaise: number, receipt: string) =>
    apiFetch<{ orderId: string; keyId: string; amount: number; currency: string }>(
      '/razorpay/create-order',
      { method: 'POST', body: JSON.stringify({ amount: amountInPaise, receipt }) },
    ),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  byBuyer: (userId: string) =>
    apiFetch<{ transactions: ApiTransaction[] }>(`/transactions/buyer/${userId}`),
};
