import {
  collection, doc, addDoc, setDoc, getDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

export interface FSMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: unknown;
  // Offer messages carry extra metadata rendered as a special card
  type?: 'text' | 'offer';
  offerPrice?: number;
  listingId?: string;
  listingTitle?: string;
}

export interface FSChat {
  id: string;
  participants: string[];
  // { uid: displayName } stored on creation so ConversationList can render names without extra fetches
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: unknown;
  listingTitle: string;
  // { uid: unread count } incremented on send, reset to 0 when user opens the chat
  unreadCounts: Record<string, number>;
}

/** Deterministic chatId for any two users */
export function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Strip undefined/null from a names map so Firestore never receives
 * an undefined value — even though ignoreUndefinedProperties handles
 * top-level object fields, it does NOT protect array elements.
 */
function sanitizeNames(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(raw).forEach(([k, v]) => {
    if (k && v != null) out[k] = String(v);
  });
  return out;
}

export async function getOrCreateChat(
  uid1: string,
  uid2: string,
  names: Record<string, string> = {},
  listingTitle = '',
): Promise<string> {
  // ── Validate both UIDs before touching Firestore ──────────────────────────
  if (!uid1 || typeof uid1 !== 'string') {
    throw new Error(`getOrCreateChat: invalid uid1 — "${uid1}"`);
  }
  if (!uid2 || typeof uid2 !== 'string') {
    throw new Error(`getOrCreateChat: invalid uid2 (sellerId missing or undefined) — "${uid2}"`);
  }
  if (uid1 === uid2) {
    throw new Error('getOrCreateChat: cannot start a chat with yourself');
  }

  const chatId = getChatId(uid1, uid2);
  console.log('[Chat] getOrCreateChat', { uid1, uid2, chatId });

  const ref = doc(db, 'chats', chatId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // participants must be a clean string array — never write undefined into an array
    const safeNames = sanitizeNames(names);
    console.log('[Chat] creating new chat doc', { chatId, participants: [uid1, uid2], names: safeNames });
    await setDoc(ref, {
      participants:     [uid1, uid2],
      participantNames: safeNames,
      lastMessage:      '',
      lastMessageAt:    serverTimestamp(),
      listingTitle:     listingTitle || '',
      unreadCounts:     { [uid1]: 0, [uid2]: 0 },
    });
    console.log('[Chat] chat doc created successfully');
  } else {
    // Patch names / listingTitle if they were missing on first creation
    const data = snap.data() as FSChat;
    const updates: Record<string, unknown> = {};
    const safeNames = sanitizeNames(names);
    if (Object.keys(safeNames).length && !Object.keys(data.participantNames ?? {}).length) {
      updates.participantNames = safeNames;
    }
    if (listingTitle && !data.listingTitle) {
      updates.listingTitle = listingTitle;
    }
    if (Object.keys(updates).length) {
      console.log('[Chat] patching existing chat doc', updates);
      await updateDoc(ref, updates);
    }
  }
  return chatId;
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });

  // Increment unread for the other participant
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  if (chatSnap.exists()) {
    const chat = chatSnap.data() as FSChat;
    const unreadCounts = { ...(chat.unreadCounts ?? {}) };
    chat.participants.forEach(uid => {
      if (uid !== senderId) unreadCounts[uid] = (unreadCounts[uid] ?? 0) + 1;
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:   text,
      lastMessageAt: serverTimestamp(),
      unreadCounts,
    });
  }
}

/** Post an offer as a chat message so the seller sees it in their inbox */
export async function sendOfferMessage(
  chatId:       string,
  senderId:     string,
  offerPrice:   number,
  listingId:    string,
  listingTitle: string,
): Promise<void> {
  const text = `Offer: ₹${offerPrice.toLocaleString('en-IN')} for "${listingTitle}"`;

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    type:         'offer',
    offerPrice,
    listingId,
    listingTitle,
    timestamp:    serverTimestamp(),
  });

  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  if (chatSnap.exists()) {
    const chat         = chatSnap.data() as FSChat;
    const unreadCounts = { ...(chat.unreadCounts ?? {}) };
    chat.participants.forEach(uid => {
      if (uid !== senderId) unreadCounts[uid] = (unreadCounts[uid] ?? 0) + 1;
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage:   text,
      lastMessageAt: serverTimestamp(),
      unreadCounts,
    });
  }
}

/** Call when a user opens a chat to clear their unread badge */
export async function markChatRead(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCounts.${uid}`]: 0,
  });
}

// ─── Real-time hooks ─────────────────────────────────────────────────────────

export function useMessages(chatId: string) {
  const [messages, setMessages] = useState<FSMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSMessage)));
        setLoading(false);
      },
      err => {
        console.error('[useMessages] onSnapshot error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [chatId]);

  return { messages, loading, error };
}

export function useUserChats(uid: string | undefined) {
  const [chats, setChats]     = useState<FSChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
    );
    const unsub: Unsubscribe = onSnapshot(
      q,
      snap => {
        setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as FSChat)));
        setLoading(false);
      },
      err => {
        // Common causes:
        //  - failed-precondition: missing composite index in Firestore
        //    Fix: deploy firestore.indexes.json (see backend/firestore.indexes.json)
        //  - permission-denied: security rules blocking the query
        console.error('[useUserChats] onSnapshot error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid]);

  const unreadCount = uid
    ? chats.reduce((sum, c) => sum + (c.unreadCounts?.[uid] ?? 0), 0)
    : 0;

  return { chats, unreadCount, loading, error };
}
