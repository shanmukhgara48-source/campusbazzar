/**
 * Auth service — backed by Cloudflare Worker JWT auth (no Firebase).
 * Preserves the same DBUser shape so existing screens need no changes.
 */
import { authApi, otpApi, setToken, clearToken, ApiUser } from './api';

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

/**
 * sendOtp — validates college domain on backend, sends OTP email.
 * Throws if domain is not registered or rate-limited.
 */
export async function sendOtp(email: string): Promise<void> {
  await otpApi.sendOtp(email.trim().toLowerCase());
}

/**
 * verifyOtp — submits OTP + user details. On success stores JWT and returns user.
 */
export async function verifyOtp(
  email: string,
  otp: string,
  name: string,
  password: string,
  rollNumber?: string,
): Promise<DBUser> {
  const { token, user } = await otpApi.verifyOtp(
    email.trim().toLowerCase(),
    otp.trim(),
    name.trim(),
    password,
    rollNumber?.trim(),
  );
  await setToken(token);
  return apiUserToDBUser(user);
}
