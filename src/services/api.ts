/**
 * Base HTTP client for the CampusBazaar Cloudflare Worker API.
 * Stores JWT in AsyncStorage; auto-attaches Authorization header.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL ?? '';
const TOKEN_KEY = 'cb:jwt_token';

// ─── Token management ─────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
  timeoutMs = 15_000,
): Promise<T> {
  if (!BASE_URL) throw new Error('EXPO_PUBLIC_UPLOAD_WORKER_URL is not set in .env');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (authenticated) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const data = await res.json() as T & { error?: string };
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return data;
  } catch (e: any) {
    if (e.name === 'AbortError') throw new Error('Request timed out. Check your internet connection.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  college?: string;
  rollNumber?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }, false),

  login: (input: LoginInput) =>
    apiFetch<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }, false),

  me: () =>
    apiFetch<{ user: ApiUser }>('/auth/me'),

  updateProfile: (data: Partial<ApiUser>) =>
    apiFetch<{ user: ApiUser }>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Upload endpoints ─────────────────────────────────────────────────────────

export const uploadApi = {
  getUploadUrl: (folder: string, filename: string, contentType = 'image/jpeg') =>
    apiFetch<{ uploadUrl: string; publicUrl: string; key: string }>('/upload-url', {
      method: 'POST',
      body: JSON.stringify({ folder, filename, contentType }),
    }),
};

// ─── Listings endpoints ───────────────────────────────────────────────────────

export const listingsApi = {
  list: (params?: { category?: string; q?: string; limit?: number; offset?: number; sellerId?: string }) => {
    const qs = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
    return apiFetch<{ listings: ApiListing[] }>(`/listings${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) =>
    apiFetch<{ listing: ApiListing }>(`/listings/${id}`),

  create: (data: CreateListingInput) =>
    apiFetch<{ listing: ApiListing }>('/listings', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<ApiListing>) =>
    apiFetch<{ listing: ApiListing }>(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
};

// ─── Offers endpoints ─────────────────────────────────────────────────────────

export const offersApi = {
  create: (listingId: string, amount: number, message?: string) =>
    apiFetch<{ offer: ApiOffer }>('/offers', { method: 'POST', body: JSON.stringify({ listingId, amount, message }) }),

  byListing: (listingId: string) =>
    apiFetch<{ offers: ApiOffer[] }>(`/offers/listing/${listingId}`),

  byUser: (userId: string) =>
    apiFetch<{ offers: ApiOffer[] }>(`/offers/user/${userId}`),

  update: (id: string, status: string, counterAmount?: number) =>
    apiFetch<{ success: boolean }>(`/offers/${id}`, { method: 'PUT', body: JSON.stringify({ status, counterAmount }) }),
};

// ─── Transactions endpoints ───────────────────────────────────────────────────

export const transactionsApi = {
  create: (data: CreateTransactionInput) =>
    apiFetch<{ transactionId: string }>('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch<{ transaction: ApiTransaction }>(`/transactions/${id}`),

  update: (id: string, data: Partial<ApiTransaction>) =>
    apiFetch<{ success: boolean }>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  byBuyer: (userId: string) =>
    apiFetch<{ transactions: ApiTransaction[] }>(`/transactions/buyer/${userId}`),

  bySeller: (userId: string) =>
    apiFetch<{ transactions: ApiTransaction[] }>(`/transactions/seller/${userId}`),

  verifyQR: (id: string, qrData: string) =>
    apiFetch<{ success: boolean }>(`/transactions/${id}/verify-qr`, { method: 'POST', body: JSON.stringify({ qrData }) }),

  verifyOTP: (id: string, otp: string) =>
    apiFetch<{ matched: boolean }>(`/transactions/${id}/verify-otp`, { method: 'POST', body: JSON.stringify({ otp }) }),
};

// ─── Conversations & Messages endpoints ───────────────────────────────────────

export const chatApi = {
  conversations: (userId: string) =>
    apiFetch<{ conversations: ApiConversation[] }>(`/conversations/user/${userId}`),

  getOrCreate: (otherUserId: string, listingId: string, listingTitle: string) =>
    apiFetch<{ conversationId: string }>('/conversations', { method: 'POST', body: JSON.stringify({ otherUserId, listingId, listingTitle }) }),

  messages: (conversationId: string, since?: string) => {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiFetch<{ messages: ApiMessage[] }>(`/conversations/${conversationId}/messages${qs}`);
  },

  sendMessage: (conversationId: string, text: string, type = 'text', offerAmount?: number) =>
    apiFetch<{ message: ApiMessage }>('/messages', { method: 'POST', body: JSON.stringify({ conversationId, text, type, offerAmount }) }),
};

// ─── Notifications endpoints ──────────────────────────────────────────────────

export const notificationsApi = {
  list: (userId: string) =>
    apiFetch<{ notifications: ApiNotification[] }>(`/notifications/user/${userId}`),

  markRead: (id: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
};

// ─── Users endpoints ──────────────────────────────────────────────────────────

export const usersApi = {
  get: (id: string) =>
    apiFetch<{ user: ApiUser }>(`/users/${id}`),
};

// ─── API types ────────────────────────────────────────────────────────────────

export interface ApiUser {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  department: string;
  year: string;
  college: string;
  rollNumber: string;
  role: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  responseTime: string;
  createdAt: string;
}

export interface ApiListing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  finalPrice?: number;
  acceptedOfferId?: string;
  category: string;
  condition: string;
  images: string[];
  sellerId: string;
  seller: { id: string; name: string; avatar: string; rating: number; isVerified: boolean };
  department: string;
  status: string;
  views: number;
  isFeatured: boolean;
  reservedFor?: string;
  createdAt: string;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  department?: string;
  tags?: string[];
}

export interface ApiOffer {
  id: string;
  listingId: string;
  listingTitle?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  amount: number;
  /** Alias for amount — used by dashboard screens */
  offerPrice?: number;
  status: string;
  message?: string;
  counterAmount?: number;
  createdAt: string;
}

export interface ApiTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  itemPrice: number;
  platformFee: number;
  gst: number;
  convenienceFee: number;
  convenienceFeePaid: boolean;
  qrCodeData: string;
  isDelivered: boolean;
  meetupLocation: string;
  meetupTime: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  deliveryOtp?: string;
  status: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  deliveredAt?: string;
  createdAt: string;
}

export interface CreateTransactionInput {
  listingId: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: number;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  itemPrice: number;
  platformFee: number;
  gst: number;
  convenienceFee: number;
  convenienceFeePaid: boolean;
  qrCodeData: string;
  meetupLocation: string;
  meetupTime: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  deliveryOtp?: string;
}

export interface ApiConversation {
  id: string;
  listingId: string;
  listingTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  type: string;
  offerAmount?: number;
  isRead: boolean;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}
