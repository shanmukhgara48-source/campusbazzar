import {
  collection, doc, addDoc, updateDoc, writeBatch,
  query, where, orderBy, onSnapshot, serverTimestamp, Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

// Firestore path: notifications/{notificationId}

export type FSNotifType =
  | 'message'
  | 'offer'
  | 'review'
  | 'listing_view'
  | 'sale'
  | 'wishlist_match'
  | 'system';

export interface FSNotification {
  id: string;
  userId: string;
  type: FSNotifType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: unknown;
  data?: Record<string, string>;
}

export async function createNotification(
  userId: string,
  type: FSNotifType,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    title,
    body,
    isRead: false,
    createdAt: serverTimestamp(),
    data: data ?? {},
  });
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
}

export async function markAllNotificationsRead(unreadIds: string[]): Promise<void> {
  if (unreadIds.length === 0) return;
  const batch = writeBatch(db);
  unreadIds.forEach(id => batch.update(doc(db, 'notifications', id), { isRead: true }));
  await batch.commit();
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<FSNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSNotification)));
        setLoading(false);
      },
      () => { setLoading(false); },
    );
    return unsub;
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  return { notifications, unreadCount, loading };
}
