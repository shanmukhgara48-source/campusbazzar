/**
 * Auth service — backed by Cloudflare Worker JWT auth (no Firebase).
 * Preserves the same DBUser shape so existing screens need no changes.
 */
import { authApi, setToken, clearToken, ApiUser } from './api';

export interface DBUser {
  uid: string;
  email: string;
  name: string;
  avatar: string;
  college: string;
  rollNumber: string;
  createdAt: unknown;
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  year?: string;
  department?: string;
  memberSince?: string;
  responseTime?: string;
  isVerified?: boolean;
  role?: string;
}

function apiUserToDBUser(u: ApiUser): DBUser {
  return {
    uid:          u.uid,
    email:        u.email,
    name:         u.name,
    avatar:       u.avatar,
    college:      u.college,
    rollNumber:   u.rollNumber,
    createdAt:    u.createdAt,
    rating:       u.rating,
    reviewCount:  u.reviewCount,
    totalSales:   u.totalSales,
    year:         u.year,
    department:   u.department,
    memberSince:  u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '',
    responseTime: u.responseTime,
    isVerified:   u.isVerified,
    role:         u.role,
  };
}

export async function signUp(
  email: string,
  password: string,
  extra: { name: string; college: string; rollNumber: string },
): Promise<DBUser> {
  const { token, user } = await authApi.register({
    email: email.trim().toLowerCase(),
    password: password.trim(),
    name: extra.name,
    college: extra.college,
    rollNumber: extra.rollNumber,
  });
  await setToken(token);
  return apiUserToDBUser(user);
}

export async function signIn(email: string, password: string): Promise<DBUser> {
  const { token, user } = await authApi.login({
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });
  await setToken(token);
  return apiUserToDBUser(user);
}

export async function signOut(): Promise<void> {
  await clearToken();
}

export async function getStoredUser(): Promise<DBUser | null> {
  try {
    const { user } = await authApi.me();
    return apiUserToDBUser(user);
  } catch {
    return null;
  }
}
