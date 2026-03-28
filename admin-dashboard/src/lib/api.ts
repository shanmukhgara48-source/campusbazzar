const BASE = process.env.NEXT_PUBLIC_WORKER_URL ?? '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin:token');
}

export function setToken(token: string) {
  localStorage.setItem('admin:token', token);
}

export function clearToken() {
  localStorage.removeItem('admin:token');
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data;
}

// ─── Admin login (separate endpoint — uses ADMIN_JWT_SECRET, not user JWT) ────

export async function adminLoginApi(email: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as { token?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  if (!data.token) throw new Error('No token returned');
  return { token: data.token };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ApiUser {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  college: string;
  rollNumber: string;
  role: string;
  isVerified: boolean;
  isBanned?: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  createdAt: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<{ user: ApiUser }>('/auth/me'),
};

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface ApiListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  sellerId: string;
  seller: { id: string; name: string; avatar: string; rating: number; isVerified: boolean };
  status: string;
  views: number;
  createdAt: string;
}

export const listingsApi = {
  list: (params?: { category?: string; q?: string; limit?: number; offset?: number; status?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    ).toString();
    return apiFetch<{ listings: ApiListing[] }>(`/listings${qs ? `?${qs}` : ''}`);
  },

  update: (id: string, data: Partial<ApiListing>) =>
    apiFetch<{ listing: ApiListing }>(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
};

// ─── Offers ───────────────────────────────────────────────────────────────────

export interface ApiOffer {
  id: string;
  listingId: string;
  listingTitle?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface ApiTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  itemPrice: number;
  platformFee: number;
  gst: number;
  convenienceFee: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export const transactionsApi = {
  byBuyer: (userId: string) =>
    apiFetch<{ transactions: ApiTransaction[] }>(`/transactions/buyer/${userId}`),

  bySeller: (userId: string) =>
    apiFetch<{ transactions: ApiTransaction[] }>(`/transactions/seller/${userId}`),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  get: (id: string) => apiFetch<{ user: ApiUser }>(`/users/${id}`),

  update: (id: string, data: { isBanned?: boolean; role?: string }) =>
    apiFetch<{ user: ApiUser }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Colleges ─────────────────────────────────────────────────────────────────

export interface ApiCollege {
  id: string;
  name: string;
  domain: string;
  createdAt?: string;
  updatedAt?: string;
}

export const collegesApi = {
  list: () =>
    apiFetch<{ colleges: ApiCollege[] }>('/colleges'),

  create: (name: string, domain: string) =>
    apiFetch<{ college: ApiCollege }>('/colleges', {
      method: 'POST',
      body: JSON.stringify({ name, domain }),
    }),

  update: (id: string, name: string, domain: string) =>
    apiFetch<{ college: ApiCollege }>(`/colleges/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, domain }),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/colleges/${id}`, { method: 'DELETE' }),
};

// ─── Admin endpoints (direct Worker calls) ────────────────────────────────────

export const adminApi = {
  allUsers: () =>
    apiFetch<{ users: ApiUser[] }>('/admin/users'),

  allListings: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return apiFetch<{ listings: ApiListing[] }>(`/admin/listings${qs}`);
  },

  allTransactions: () =>
    apiFetch<{ transactions: ApiTransaction[] }>('/admin/transactions'),

  stats: () =>
    apiFetch<{
      totalUsers: number;
      totalListings: number;
      totalTransactions: number;
      totalRevenue: number;
      activeListings: number;
      pendingListings: number;
      monthlySales: { month: string; revenue: number; count: number }[];
      topCategories: { category: string; count: number }[];
    }>('/admin/stats'),

  updateListing: (id: string, status: string) =>
    apiFetch<{ success: boolean }>(`/admin/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateUser: (id: string, data: { isBanned?: boolean; role?: string }) =>
    apiFetch<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
