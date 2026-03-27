/**
 * Chat service — Cloudflare Worker API with polling (replaces Firestore onSnapshot).
 * Poll interval: 3 seconds for active conversation, 10 seconds for list.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { chatApi, ApiConversation, ApiMessage } from './api';

export type { ApiConversation as FSConversation };

// FSChat is an alias for ApiConversation — kept for screen compatibility
export type FSChat = ApiConversation;

/**
 * FSMessage extends ApiMessage with extra offer-related fields that
 * FirebaseChatScreen reads (offerPrice, offerId, listingId, etc.).
 * offerPrice is normalised from ApiMessage.offerAmount on receipt.
 */
export interface FSMessage extends ApiMessage {
  offerPrice?: number;
  offerId?: string;
  listingId?: string;
  listingTitle?: string;
  buyerId?: string;
  sellerId?: string;
  status?: string;   // offer status: 'pending' | 'accepted' | 'rejected'
}

/** Normalise a raw ApiMessage → FSMessage (maps offerAmount → offerPrice). */
function toFSMessage(m: ApiMessage): FSMessage {
  return { ...m, offerPrice: m.offerAmount };
}

export async function getOrCreateChat(
  buyerId: string,
  sellerId: string,
  _names: Record<string, string>,
  listingTitle: string,
  listingId = 'unknown',
): Promise<string> {
  // The caller passes their own userId via the auth token inside chatApi
  const { conversationId } = await chatApi.getOrCreate(sellerId, listingId, listingTitle);
  return conversationId;
}

/**
 * sendOfferMessage — posts an offer-type message into a conversation.
 * Signature matches OfferScreen's call:
 *   sendOfferMessage(chatId, senderId, amount, listingId, listingTitle, offerId, buyerId, sellerId)
 */
export async function sendOfferMessage(
  conversationId: string,
  _senderId: string,
  amount: number,
  _listingId: string,
  listingTitle: string,
  _offerId: string,
  _buyerId: string,
  _sellerId: string,
): Promise<void> {
  const text = `Offer of ₹${amount.toLocaleString('en-IN')} for "${listingTitle}"`;
  await chatApi.sendMessage(conversationId, text, 'offer', amount);
}

/**
 * sendMessage — accepts both call styles:
 *   • sendMessage(conversationId, text, type?, offerAmount?)   — service style
 *   • sendMessage(conversationId, _senderId, text)             — screen style (FirebaseChatScreen)
 */
export async function sendMessage(
  conversationId: string,
  textOrSenderId: string,
  typeOrText: string = 'text',
  offerAmount?: number,
): Promise<void> {
  // Detect screen-style call: 3rd arg is the message text (not a type keyword)
  const knownTypes = new Set(['text', 'offer', 'system']);
  let text: string;
  let type: string;

  if (knownTypes.has(typeOrText)) {
    // Service-style: sendMessage(id, text, type, amount)
    text = textOrSenderId;
    type = typeOrText;
  } else {
    // Screen-style: sendMessage(id, senderId, text)
    text = typeOrText;
    type = 'text';
  }

  await chatApi.sendMessage(conversationId, text, type, offerAmount);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { conversations: data } = await chatApi.conversations(userId);
      setConversations(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10_000); // poll every 10s
    return () => clearInterval(timer);
  }, [load]);

  return { conversations, loading };
}

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<FSMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const lastTimestamp            = useRef<string | undefined>(undefined);

  const poll = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { messages: data } = await chatApi.messages(conversationId, lastTimestamp.current);
      if (data.length > 0) {
        lastTimestamp.current = data[data.length - 1].createdAt;
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = data.filter(m => !existingIds.has(m.id)).map(toFSMessage);
          return newOnes.length ? [...prev, ...newOnes] : prev;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial full load (no `since`)
  useEffect(() => {
    if (!conversationId) { setLoading(false); return; }
    lastTimestamp.current = undefined;
    setMessages([]);
    chatApi.messages(conversationId)
      .then(({ messages: data }) => {
        setMessages(data.map(toFSMessage));
        if (data.length) lastTimestamp.current = data[data.length - 1].createdAt;
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;
    const timer = setInterval(poll, 3_000);
    return () => clearInterval(timer);
  }, [poll]);

  return { messages, loading };
}

// ─── Compatibility stubs (Firestore real-time features → polling replacements) ─

/** Mark all messages in a conversation as read for this user. No-op stub. */
export async function markChatRead(
  _conversationId: string,
  _userId: string,
): Promise<void> {}

/** Signal typing state. No-op stub — not supported with polling. */
export async function setTyping(
  _conversationId: string,
  _userId: string,
  _isTyping: boolean,
): Promise<void> {}

/** Returns whether the other user is currently typing. Always false with polling. */
export function useIsOtherTyping(
  _conversationId: string,
  _currentUserId: string,
): boolean {
  return false;
}

/** Returns whether the last message has been seen by the other party. Always false with polling. */
export function useLastMessageSeen(
  _conversationId: string,
  _currentUserId: string,
  _lastMessage: ApiMessage | undefined,
): boolean {
  return false;
}

/** Update the offer status displayed inside a chat message. No-op stub. */
export async function updateMessageOfferStatus(
  _messageId: string,
  _status: string,
): Promise<void> {}

/** Post a system-type message (e.g. "Offer accepted") into a conversation. */
export async function sendSystemMessage(
  conversationId: string,
  text: string,
): Promise<void> {
  await chatApi.sendMessage(conversationId, text, 'system');
}

/**
 * useUserChats — wraps useConversations with the shape screens expect:
 *   { chats, loading, error, unreadCount }
 */
export function useUserChats(userId: string | undefined) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { conversations: data } = await chatApi.conversations(userId);
      setConversations(data);
      setError(undefined);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [load]);

  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return { chats: conversations, loading, error, unreadCount };
}
