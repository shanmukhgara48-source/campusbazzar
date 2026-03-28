import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import {
  useMessages, sendMessage, markChatRead, setTyping,
  useIsOtherTyping, useLastMessageSeen, FSMessage,
  updateMessageOfferStatus, sendSystemMessage, sendOfferMessage,
} from '../../services/chatService';
import { acceptOffer, rejectOffer, counterOffer } from '../../services/offerService';
import { offersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'FirebaseChat'>;
  route:      RouteProp<HomeStackParamList, 'FirebaseChat'>;
};

const CONTACT_BLOCKER =
  /(\+?91[-.\s]?)?[6-9]\d{9}|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|https?:\/\/|www\.|wa\.me|t\.me|whatsapp|telegram/i;

export default function FirebaseChatScreen({ navigation, route }: Props) {
  const { chatId, otherUserName, listingTitle, listingId, sellerId } = route.params;
  const { user }  = useAuth();
  const insets    = useSafeAreaInsets();
  const [text, setText]               = useState('');
  const [sending, setSending]         = useState(false);
  const [offerLoading, setOfferLoading] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Optimistic local offer status overrides — updated instantly on button press,
  // rolled back if the API call fails. Keyed by message id.
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  // Maps message id → accepted offer id so we can pass dealId when navigating
  // to checkout. Populated by the offer-status sync effect below.
  const acceptedOfferIdsRef = useRef<Record<string, string>>({});

  // Counter offer modal state
  const [counterModal, setCounterModal] = useState<{
    visible: boolean;
    item: FSMessage | null;
    price: string;
    submitting: boolean;
  }>({ visible: false, item: null, price: '', submitting: false });

  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Role: if sellerId param is provided use it, otherwise treat offer sender as buyer
  const isSeller = !!sellerId && user?.uid === sellerId;
  const isBuyer  = !!sellerId && user?.uid !== sellerId;

  const { messages, loading } = useMessages(chatId);
  const isOtherTyping = useIsOtherTyping(chatId, user?.uid ?? '');
  const lastMsg       = messages[messages.length - 1];
  const isSeen        = useLastMessageSeen(chatId, user?.uid ?? '', lastMsg);

  /**
   * Offer-status sync — bridges the gap between the chat message poll and the
   * offers API. The Worker stores offer status in the `offers` table, NOT inside
   * message records, so the buyer's message poll never returns status:'accepted'.
   *
   * Every 5 s (and whenever the message list changes) we fetch all offers for
   * this listing, match each one to a chat message by amount, and push any
   * accepted/declined status into localStatuses. This makes the checkout button
   * appear on the buyer's screen without any backend changes.
   */
  useEffect(() => {
    const lid = listingId;
    if (!lid || !messages.length) return;

    const sync = async () => {
      try {
        const { offers } = await offersApi.byListing(lid);
        if (!offers.length) return;

        setLocalStatuses(prev => {
          let changed = false;
          const next = { ...prev };

          messages.forEach(msg => {
            if (msg.type !== 'offer' || !msg.offerPrice) return;
            // Already have a terminal status locally — don't overwrite
            const current = next[msg.id];
            if (current === 'accepted' || current === 'rejected' || current === 'countered') return;

            // Match by offer amount (nearest pending/accepted offer wins)
            const match = offers.find(o => o.amount === msg.offerPrice);
            if (!match) return;

            const normalized =
              match.status === 'accepted' ? 'accepted' :
              match.status === 'declined' || match.status === 'rejected' ? 'rejected' :
              match.status === 'countered' ? 'countered' :
              null;

            if (normalized && normalized !== current) {
              next[msg.id] = normalized;
              changed = true;
            }

            // Store the offer id so the checkout button can pass dealId
            if (match.status === 'accepted' && match.id) {
              acceptedOfferIdsRef.current[msg.id] = match.id;
            }
          });

          return changed ? next : prev;
        });
      } catch {
        // non-fatal — silently ignore network errors
      }
    };

    sync();
    const timer = setInterval(sync, 5_000);
    return () => clearInterval(timer);
  }, [listingId, messages]);

  useEffect(() => {
    if (user?.uid && chatId) markChatRead(chatId, user.uid).catch(console.warn);
  }, [chatId, user?.uid, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (!user?.uid) return;
    setTyping(chatId, user.uid, true).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(chatId, user!.uid, false).catch(() => {});
    }, 3000);
  }, [chatId, user]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (user?.uid) setTyping(chatId, user.uid, false).catch(() => {});
    };
  }, [chatId, user?.uid]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) return;
    if (CONTACT_BLOCKER.test(trimmed)) {
      Alert.alert(
        '⚠️ Not Allowed',
        'Sharing contact info, links, or payment IDs is not permitted.\n\nComplete your transaction safely inside CampusBazaar.',
      );
      return;
    }
    setSending(true);
    setText('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setTyping(chatId, user.uid, false).catch(() => {});
    try {
      await sendMessage(chatId, user.uid, trimmed);
    } catch (e) {
      console.warn('[FirebaseChatScreen] send error:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value: unknown) => {
    if (!value) return '';
    const date = (value as any)?.toDate?.() ?? new Date(value as string);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  /**
   * Try to find the real offer record in the DB so we can update its status.
   * Looks up offers by listingId (from route param or message field) and
   * matches by amount. Returns the offer id, or null if not found.
   */
  const resolveOfferId = useCallback(async (item: FSMessage): Promise<string | null> => {
    // If the message already carries an offerId, use it directly
    if (item.offerId) return item.offerId;

    const lid = listingId ?? item.listingId;
    if (!lid) {
      console.warn('[Chat] resolveOfferId: listingId missing — cannot look up offer');
      return null;
    }

    try {
      const { offers } = await offersApi.byListing(lid);
      // Match by amount + pending status + buyer (item.senderId = buyer for original offers).
      // Filtering by buyerId prevents collisions when multiple buyers offer the same amount.
      const match = offers.find(
        o => o.amount === item.offerPrice &&
             o.status === 'pending' &&
             (item.senderId ? o.buyerId === item.senderId : true),
      );
      if (!match) console.warn('[Chat] resolveOfferId: no matching pending offer found', { offerPrice: item.offerPrice, senderId: item.senderId });
      return match?.id ?? null;
    } catch (e) {
      console.warn('[Chat] resolveOfferId error:', e);
      return null;
    }
  }, [listingId]);

  const handleAcceptOffer = useCallback((item: FSMessage) => {
    // Bug fix: removed `!item.offerId` guard — offerId is not in the Worker
    // message response so it is always undefined, silently killing every press.
    if (!user) return;

    Alert.alert(
      'Accept Offer',
      `Accept ₹${item.offerPrice?.toLocaleString('en-IN')} for "${item.listingTitle ?? listingTitle}"?\n\nThis will mark the item as reserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setOfferLoading(item.id);
            // Optimistic update — UI reflects accepted instantly
            setLocalStatuses(prev => ({ ...prev, [item.id]: 'accepted' }));
            try {
              // Best-effort backend update: look up the real offer id
              const oid = await resolveOfferId(item);
              let txId: string | undefined;
              if (oid) {
                txId = await acceptOffer(oid);
                // Record the accepted offer id so checkout navigation can pass dealId
                acceptedOfferIdsRef.current[item.id] = oid;
              }
              await sendSystemMessage(
                chatId,
                `Deal accepted at ₹${item.offerPrice?.toLocaleString('en-IN')} — buyer can now proceed to checkout.`,
              );
            } catch (e: any) {
              // Rollback optimistic update on failure
              setLocalStatuses(prev => ({ ...prev, [item.id]: 'pending' }));
              Alert.alert('Error', e?.message ?? 'Could not accept offer. Please try again.');
            } finally {
              setOfferLoading(null);
            }
          },
        },
      ],
    );
  }, [chatId, user, listingId, listingTitle, resolveOfferId]);

  const handleRejectOffer = useCallback((item: FSMessage) => {
    // Bug fix: removed `!item.offerId` guard — same issue as handleAcceptOffer
    if (!user) return;

    Alert.alert(
      'Decline Offer',
      `Decline ₹${item.offerPrice?.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setOfferLoading(item.id);
            // Optimistic update
            setLocalStatuses(prev => ({ ...prev, [item.id]: 'rejected' }));
            try {
              const oid = await resolveOfferId(item);
              if (oid) {
                await rejectOffer(oid);
              }
              await sendSystemMessage(chatId, 'Offer declined.');
            } catch (e: any) {
              // Rollback on failure
              setLocalStatuses(prev => ({ ...prev, [item.id]: 'pending' }));
              Alert.alert('Error', e?.message ?? 'Could not decline offer. Please try again.');
            } finally {
              setOfferLoading(null);
            }
          },
        },
      ],
    );
  }, [chatId, user, resolveOfferId]);

  const openCounterModal = useCallback((item: FSMessage) => {
    setCounterModal({ visible: true, item, price: String(item.offerPrice ?? ''), submitting: false });
  }, []);

  const submitCounterOffer = useCallback(async () => {
    const { item, price } = counterModal;
    if (!item || !user?.uid) return;

    const amount = parseInt(price, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid counter price.');
      return;
    }

    setCounterModal(prev => ({ ...prev, submitting: true }));
    // Optimistic update for the original offer message
    setLocalStatuses(prev => ({ ...prev, [item.id]: 'countered' }));
    try {
      // Mark original offer as countered in DB (best-effort)
      const oid = item.offerId ?? await resolveOfferId(item).catch(() => null);
      if (oid) {
        await counterOffer(oid, amount).catch(() => {});
      }
      await updateMessageOfferStatus(chatId, item.id, 'countered');

      // Send counter offer as a new chat message
      await sendOfferMessage(
        chatId,
        user.uid,
        amount,
        listingId ?? item.listingId ?? '',
        listingTitle,
        '',          // no offerId for the new counter message
        item.buyerId ?? item.senderId,
        user.uid,    // seller is now the sender
      );

      await sendSystemMessage(
        chatId,
        `Counter offer sent: ₹${amount.toLocaleString('en-IN')}`,
      );

      setCounterModal({ visible: false, item: null, price: '', submitting: false });
    } catch (e: any) {
      // Rollback optimistic update
      setLocalStatuses(prev => ({ ...prev, [item.id]: 'pending' }));
      Alert.alert('Error', e?.message ?? 'Could not send counter offer.');
      setCounterModal(prev => ({ ...prev, submitting: false }));
    }
  }, [counterModal, chatId, listingId, listingTitle, user, resolveOfferId]);

  const renderMessage = ({ item, index }: { item: FSMessage; index: number }) => {
    const isMine   = item.senderId === user?.uid;
    const isLast   = index === messages.length - 1;
    const showSeen = isMine && isLast && isSeen;

    if (item.type === 'system') {
      return (
        <View style={s.systemRow}>
          <Text style={[s.systemText, { color: colors.textTertiary, backgroundColor: colors.border }]}>
            {item.text}
          </Text>
        </View>
      );
    }

    if (item.type === 'offer') {
      // localStatuses takes priority — gives instant feedback without waiting for poll
      const offerStatus  = localStatuses[item.id] ?? item.status ?? 'pending';
      const isActioning  = offerLoading === item.id;
      const isResolved   = offerStatus === 'accepted' || offerStatus === 'rejected' || offerStatus === 'countered';

      // Role detection: if sellerId route param is available, use it.
      // Fallback: whoever did NOT send this message is the one who can act on it.
      const canActAsSeller = sellerId
        ? isSeller && item.senderId !== user?.uid
        : item.senderId !== user?.uid;
      const canActAsBuyer = sellerId
        ? isBuyer && item.senderId !== user?.uid
        : false; // counter-offer buyer actions only work with explicit sellerId

      // "Proceed to Checkout" appears for the buyer only.
      // Priority: explicit sellerId param → fallback: offer sender = buyer
      // (buyer sends original offers; counter-offers come from the seller,
      //  so we flip the check for those)
      const amITheBuyer = sellerId
        ? isBuyer
        : item.senderId === user?.uid;   // I sent this offer → I'm the buyer

      const showCheckout = offerStatus === 'accepted' && amITheBuyer;

      const statusColor =
        offerStatus === 'accepted'  ? colors.success :
        offerStatus === 'rejected'  ? colors.error :
        offerStatus === 'countered' ? colors.accent :
        colors.primary;

      const statusLabel =
        offerStatus === 'accepted'  ? 'Accepted' :
        offerStatus === 'rejected'  ? 'Declined' :
        offerStatus === 'countered' ? 'Countered' :
        'Pending';

      return (
        <View style={[s.row, s.rowLeft]}>
          <View style={[s.offerCard, { backgroundColor: colors.surface, borderColor: colors.primary + '40' }]}>

            {/* Header row: icon + label + status badge */}
            <View style={s.offerHeader}>
              <Ionicons name="pricetag" size={13} color={colors.primary} />
              <Text style={[s.offerLabel, { color: colors.primary }]}>OFFER</Text>
              <View style={[s.offerStatusBadge, { backgroundColor: statusColor + '20' }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[s.offerStatusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {/* Negotiated price */}
            <Text style={[s.offerPrice, { color: colors.primary }]}>
              ₹{item.offerPrice?.toLocaleString('en-IN') ?? '—'}
            </Text>

            {/* Listing name */}
            {!!(item.listingTitle ?? listingTitle) && (
              <Text style={[s.offerTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.listingTitle ?? listingTitle}
              </Text>
            )}

            {/* ── Seller action buttons (Accept / Decline / Counter) ── */}
            {canActAsSeller && !isResolved && (
              isActioning ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
              ) : (
                <View style={s.offerActions}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleAcceptOffer(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={s.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => openCounterModal(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="repeat" size={14} color="#fff" />
                    <Text style={s.actionBtnText}>Counter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtnOutline, { borderColor: colors.error + '60' }]}
                    onPress={() => handleRejectOffer(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={14} color={colors.error} />
                    <Text style={[s.actionBtnText, { color: colors.error }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {/* ── Buyer action buttons on a counter offer ── */}
            {canActAsBuyer && !isResolved && item.senderId !== user?.uid && (
              isActioning ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
              ) : (
                <View style={s.offerActions}>
                  <TouchableOpacity
                    style={[s.actionBtn, { backgroundColor: colors.success, flex: 1 }]}
                    onPress={() => handleAcceptOffer(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={s.actionBtnText}>Accept Counter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionBtnOutline, { borderColor: colors.error + '60' }]}
                    onPress={() => handleRejectOffer(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={14} color={colors.error} />
                    <Text style={[s.actionBtnText, { color: colors.error }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {/* ── Proceed to Checkout — buyer only, offer accepted ── */}
            {showCheckout && (() => {
              const resolvedListingId = listingId ?? item.listingId;
              if (!resolvedListingId) return null;

              const finalPrice = item.offerPrice;
              return (
                <>
                  {/* Deal accepted confirmation strip */}
                  <View style={s.dealAcceptedStrip}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={s.dealAcceptedText}>
                      Deal accepted at ₹{finalPrice?.toLocaleString('en-IN') ?? '—'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[s.checkoutBtn, checkingOut && { opacity: 0.7 }]}
                    disabled={checkingOut}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (checkingOut) return;
                      setCheckingOut(true);
                      setTimeout(() => {
                        // Pass dealId so checkout can resolve the negotiated
                        // price without scanning all offers.
                        navigation.navigate('Checkout', {
                          listingId: resolvedListingId,
                          dealId:    acceptedOfferIdsRef.current[item.id],
                        });
                        setCheckingOut(false);
                      }, 150);
                    }}
                  >
                    {checkingOut ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="cart" size={15} color="#fff" />
                    )}
                    <Text style={s.checkoutBtnText}>
                      {checkingOut
                        ? 'Opening...'
                        : `Proceed to Checkout · ₹${finalPrice?.toLocaleString('en-IN') ?? '—'}`}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}

            <View style={s.metaRow}>
              <Text style={[s.time, { color: colors.textTertiary }]}>{formatTime(item.createdAt)}</Text>
              {showSeen && <SeenTick />}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[s.row, isMine ? s.rowRight : s.rowLeft]}>
        <View style={[
          s.bubble,
          isMine ? { backgroundColor: colors.messageSent, borderBottomRightRadius: 4 }
                 : { backgroundColor: colors.messageReceived, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
        ]}>
          <Text style={[s.bubbleText, { color: isMine ? '#ffffff' : colors.textPrimary }]}>
            {item.text}
          </Text>
          <View style={s.metaRow}>
            <Text style={[s.time, { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
              {formatTime(item.createdAt)}
            </Text>
            {showSeen && <SeenTick />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={[s.headerName, { color: colors.textPrimary }]}>{otherUserName}</Text>
          {isOtherTyping ? (
            <Text style={[s.typingText, { color: colors.primary }]}>typing...</Text>
          ) : (
            <Text style={[s.headerSub, { color: colors.textTertiary }]} numberOfLines={1}>{listingTitle}</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={[s.emptyText, { color: colors.textTertiary }]}>No messages yet. Say hello!</Text>
            </View>
          }
          ListFooterComponent={
            isOtherTyping ? (
              <View style={[s.typingBubble, { backgroundColor: colors.messageReceived }]}>
                <TypingDots />
              </View>
            ) : null
          }
        />
      )}

      {/* ── Counter Offer Modal ── */}
      <Modal
        visible={counterModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCounterModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Send Counter Offer</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>
              Buyer offered ₹{counterModal.item?.offerPrice?.toLocaleString('en-IN')}. Enter your price:
            </Text>
            <View style={[s.modalInputRow, { borderColor: colors.primary, backgroundColor: colors.background }]}>
              <Text style={[s.modalCurrency, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[s.modalInput, { color: colors.textPrimary }]}
                placeholder="Your price"
                placeholderTextColor={colors.textTertiary}
                value={counterModal.price}
                onChangeText={p => setCounterModal(prev => ({ ...prev, price: p.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setCounterModal({ visible: false, item: null, price: '', submitting: false })}
                disabled={counterModal.submitting}
              >
                <Text style={[s.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.accent, flex: 1 }]}
                onPress={submitCounterOffer}
                disabled={counterModal.submitting || !counterModal.price}
                activeOpacity={0.85}
              >
                {counterModal.submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="repeat" size={15} color="#fff" />
                    <Text style={[s.modalBtnText, { color: '#fff' }]}>Send Counter</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[s.inputBar, { paddingBottom: insets.bottom + spacing.sm, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[s.inputWrapper, { backgroundColor: colors.borderLight }]}>
          <TextInput
            style={[s.input, { color: colors.textPrimary }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[s.sendBtn, (!text.trim() || sending) ? { backgroundColor: colors.border } : { backgroundColor: colors.primary }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={18} color={text.trim() ? colors.textInverse : colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function SeenTick() {
  return (
    <View style={{ flexDirection: 'row', marginLeft: 4 }}>
      <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.75)" />
    </View>
  );
}

function TypingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 4 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[s.typingDot, { backgroundColor: colors.textTertiary }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  backBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo:       { flex: 1, marginLeft: spacing.sm },
  headerName:       { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  headerSub:        { fontSize: typography.sizes.xs },
  typingText:       { fontSize: typography.sizes.xs, fontStyle: 'italic' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:        { fontSize: typography.sizes.sm },
  list:             { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  row:              { flexDirection: 'row', marginBottom: spacing.xs },
  rowRight:         { justifyContent: 'flex-end' },
  rowLeft:          { justifyContent: 'flex-start' },
  bubble:           { maxWidth: '75%', borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleText:       { fontSize: typography.sizes.md, lineHeight: 22 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  time:             { fontSize: 10 },
  inputBar:         { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, gap: spacing.sm },
  inputWrapper:     { flex: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0, minHeight: 40, justifyContent: 'center' },
  input:            { fontSize: typography.sizes.md, maxHeight: 100 },
  sendBtn:          { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  offerCard:        { width: 240, borderRadius: borderRadius.lg, borderBottomLeftRadius: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1.5 },
  offerHeader:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  offerLabel:       { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'uppercase', letterSpacing: 0.4 },
  offerPrice:       { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: 2 },
  offerTitle:       { fontSize: typography.sizes.xs, marginBottom: 4 },
  typingBubble:     { alignSelf: 'flex-start', borderRadius: borderRadius.lg, borderBottomLeftRadius: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginLeft: spacing.lg, marginBottom: spacing.sm },
  typingDot:        { width: 7, height: 7, borderRadius: 4 },
  systemRow:        { alignItems: 'center', marginVertical: spacing.xs },
  systemText:       { fontSize: typography.sizes.xs, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 3, overflow: 'hidden' },
  offerStatusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: 'auto' },
  offerStatusText:  { fontSize: 10, fontWeight: typography.weights.bold },
  offerActions:     { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  actionBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: borderRadius.md, paddingVertical: spacing.sm },
  actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: borderRadius.md, paddingVertical: spacing.sm, borderWidth: 1 },
  actionBtnText:    { fontSize: 12, fontWeight: typography.weights.semibold, color: '#fff' },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  dealAcceptedStrip:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.success + '15', borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5, marginTop: spacing.sm },
  dealAcceptedText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.success, flex: 1 },
  checkoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.md, paddingVertical: spacing.md, marginTop: spacing.xs, backgroundColor: '#16a34a' },
  checkoutBtnText:  { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#fff' },
  // Counter offer modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard:        { width: '100%', borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.md },
  modalTitle:       { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  modalSub:         { fontSize: typography.sizes.sm, lineHeight: 20 },
  modalInputRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 56 },
  modalCurrency:    { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginRight: spacing.xs },
  modalInput:       { flex: 1, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  modalActions:     { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  modalBtnText:     { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
