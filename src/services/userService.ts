/**
 * User service — Cloudflare Worker API (replaces Firestore).
 */
import { usersApi, authApi, ApiUser } from './api';

export type { ApiUser as FSUser };

export async function getUser(uid: string): Promise<ApiUser | null> {
  try {
    const { user } = await usersApi.get(uid);
    return user;
  } catch {
    return null;
  }
}

export async function updateUserProfile(data: Partial<ApiUser>): Promise<void> {
  await authApi.updateProfile(data);
}

/**
 * updateUser — convenience wrapper used by EditProfileScreen.
 * The uid param is accepted for signature compatibility but identity
 * comes from the JWT token stored in AsyncStorage.
 */
export async function updateUser(_uid: string, data: Partial<ApiUser>): Promise<void> {
  await authApi.updateProfile(data);
}

/**
 * blockUser — blocks targetUid for the authenticated user.
 * Fires a best-effort POST; silently ignores failure if the endpoint
 * is not yet deployed.
 */
export async function blockUser(myUid: string, targetUid: string): Promise<void> {
  const workerUrl = process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL ?? '';
  if (!workerUrl) return;
  const { getToken } = await import('./api');
  const token = await getToken();
  try {
    await fetch(`${workerUrl}/users/${targetUid}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ blockerId: myUid }),
    });
  } catch (e) {
    console.warn('[blockUser] non-fatal:', e);
  }
}
