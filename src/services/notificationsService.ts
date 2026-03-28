/**
 * Notifications service — Cloudflare Worker API (replaces Firestore).
 */
import { useEffect, useState, useCallback } from 'react';
import { notificationsApi, ApiNotification } from './api';

export type { ApiNotification as FSNotification };

export type FSNotifType = 'message' | 'offer' | 'review' | 'listing_view' | 'sale' | 'wishlist_match' | 'system';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  // Fire-and-forget — non-critical if it fails
  try {
    const workerUrl = process.env.EXPO_PUBLIC_UPLOAD_WORKER_URL ?? '';
    await fetch(`${workerUrl}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, title, body, data }),
    });
  } catch (e) {
    console.warn('[notifications] create non-fatal:', e);
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await notificationsApi.markRead(id);
}

/** Mark every id in the provided array as read. Fires requests concurrently. */
export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await Promise.all(ids.map(id => notificationsApi.markRead(id)));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { notifications: data } = await notificationsApi.list(userId);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15_000); // poll every 15s
    return () => clearInterval(timer);
  }, [load]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, loading, unreadCount, refresh: load };
}
