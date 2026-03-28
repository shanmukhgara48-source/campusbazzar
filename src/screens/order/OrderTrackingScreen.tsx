import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTransaction } from '../../services/transactionService';
import { transactionsApi } from '../../services/api';
import { getOrCreateChat } from '../../services/chatService';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'OrderTracking'>;
  route:      RouteProp<HomeStackParamList, 'OrderTracking'>;
};

// ─── Status config ────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  accepted:    { label: 'Order Placed',  color: colors.primary,  icon: 'checkmark-circle', bg: colors.primary + '15' },
  meetup_set:  { label: 'Meetup Set',    color: '#f59e0b',        icon: 'time',             bg: '#fef3c7' },
  completed:   { label: 'Delivered',     color: colors.success,   icon: 'bag-check',        bg: colors.success + '15' },
  cancelled:   { label: 'Cancelled',     color: colors.error,     icon: 'close-circle',     bg: colors.error + '15' },
  disputed:    { label: 'Under Review',  color: '#8b5cf6',        icon: 'warning',          bg: '#ede9fe' },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:       { label: 'Pay at Meetup',     color: '#f59e0b' },
  paid:          { label: 'Paid',               color: colors.success },
  refunded:      { label: 'Refunded',           color: colors.primary },
  refund_pending:{ label: 'Refund Processing',  color: '#f59e0b' },
  cancelled:     { label: 'Cancelled',          color: colors.error },
};

// ─── Timeline step ────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'accepted',   label: 'Order Placed' },
  { key: 'meetup_set', label: 'Meetup Set' },
  { key: 'completed',  label: 'Delivered' },
];

const STATUS_RANK: Record<string, number> = {
  accepted: 0, meetup_set: 1, completed: 2, cancelled: -1, disputed: -1,
};

function Timeline({ status }: { status: string }) {
  const rank = STATUS_RANK[status] ?? 0;
  const isCancelled = status === 'cancelled';
  return (
    <View style={tl.container}>
      {STEPS.map((step, i) => {
        const done    = rank >= i && !isCancelled;
        const current = rank === i && !isCancelled;
        return (
          <View key={step.key} style={tl.stepRow}>
            <View style={tl.leftCol}>
              <View style={[
                tl.dot,
                done    && { backgroundColor: colors.primary, borderColor: colors.primary },
                current && { borderColor: colors.primary },
              ]}>
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[tl.line, rank > i && !isCancelled && { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={[tl.label, done && { color: colors.textPrimary, fontWeight: typography.weights.semibold }]}>
              {step.label}
            </Text>
          </View>
        );
      })}
      {isCancelled && (
        <View style={[tl.stepRow, { marginTop: spacing.sm }]}>
          <View style={tl.leftCol}>
            <View style={[tl.dot, { backgroundColor: colors.error, borderColor: colors.error }]}>
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          </View>
          <Text style={[tl.label, { color: colors.error, fontWeight: typography.weights.semibold }]}>
            Order Cancelled
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrderTrackingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactionId } = route.params;
  const { transaction, loading } = useTransaction(transactionId);

  const [cancelModal, setCancelModal]   = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [chatLoading, setChatLoading]   = useState(false);

  const canCancel = transaction
    && transaction.status === 'accepted'
    && transaction.buyerId === user?.uid;

  const handleCancel = useCallback(async () => {
    if (!transaction) return;
    setCancelling(true);
    setCancelModal(false);
    try {
      const { paymentStatus } = await transactionsApi.cancel(transaction.id);
      const wasRefunded = paymentStatus === 'refunded';
      const isPending   = paymentStatus === 'refund_pending';
      Alert.alert(
        'Order Cancelled',
        wasRefunded
          ? 'Your payment will be refunded in 3–5 business days.'
          : isPending
            ? 'Your refund is being processed. It may take a few business days.'
            : 'Your order has been cancelled successfully.',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  }, [transaction]);

  const handleMessage = useCallback(async () => {
    if (!user?.uid || !transaction) return;
    setChatLoading(true);
    try {
      const names: Record<string, string> = {
        [transaction.buyerId]:  transaction.buyerName  || 'Buyer',
        [transaction.sellerId]: transaction.sellerName || 'Seller',
      };
      const chatId = await getOrCreateChat(
        transaction.buyerId,
        transaction.sellerId,
        names,
        transaction.listingTitle,
        transaction.listingId,
      );
      navigation.navigate('FirebaseChat', {
        chatId,
        otherUserId:   transaction.sellerId,
        otherUserName: transaction.sellerName || 'Seller',
        listingTitle:  transaction.listingTitle,
        listingId:     transaction.listingId,
        sellerId:      transaction.sellerId,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not open chat.');
    } finally {
      setChatLoading(false);
    }
  }, [user, transaction, navigation]);

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.notFoundText}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCfg  = ORDER_STATUS[transaction.status]   ?? ORDER_STATUS['accepted'];
  const paymentCfg = PAYMENT_STATUS[transaction.paymentStatus] ?? PAYMENT_STATUS['pending'];

  const orderId  = transaction.id.slice(0, 8).toUpperCase();
  const placedAt = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Status Hero ──────────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: statusCfg.bg }, shadows.small]}>
          <View style={[styles.heroIconWrap, { backgroundColor: statusCfg.color + '25' }]}>
            <Ionicons name={statusCfg.icon as any} size={32} color={statusCfg.color} />
          </View>
          <Text style={[styles.heroStatus, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          <Text style={styles.heroOrderId}>Order #{orderId}</Text>
        </View>

        {/* ── Product Card ─────────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>ITEM</Text>
          <View style={styles.productRow}>
            {transaction.listingImage ? (
              <Image source={{ uri: transaction.listingImage }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{transaction.listingTitle}</Text>
              <Text style={styles.productSeller}>Sold by {transaction.sellerName}</Text>
              <Text style={styles.productPrice}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* ── Order Details ────────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>ORDER DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>#{orderId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Placed On</Text>
            <Text style={styles.detailValue}>{placedAt}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>
              {transaction.paymentMethod === 'online' ? 'UPI / Online' : 'Cash on Delivery'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <View style={[styles.payBadge, { backgroundColor: paymentCfg.color + '18' }]}>
              <View style={[styles.payDot, { backgroundColor: paymentCfg.color }]} />
              <Text style={[styles.payBadgeText, { color: paymentCfg.color }]}>
                {paymentCfg.label}
              </Text>
            </View>
          </View>
          {transaction.meetupLocation ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Meetup</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {transaction.meetupLocation}{transaction.meetupTime ? `\n${transaction.meetupTime}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Status Timeline ──────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>STATUS</Text>
          <Timeline status={transaction.status} />
        </View>

        {/* ── Seller Card ──────────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>SELLER</Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {(transaction.sellerName || 'S')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{transaction.sellerName}</Text>
              <Text style={styles.sellerSubtext}>Tap to message about meetup details</Text>
            </View>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={handleMessage}
              disabled={chatLoading}
            >
              {chatLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <>
                    <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cancel Section ───────────────────────────────────────────────── */}
        {canCancel && (
          <View style={[styles.cancelCard, shadows.small]}>
            <View style={styles.cancelCardLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.cancelHint}>
                You can cancel before the seller sets a meetup.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancelModal(true)}
              disabled={cancelling}
            >
              {cancelling
                ? <ActivityIndicator size="small" color={colors.error} />
                : <Text style={styles.cancelBtnText}>Cancel Order</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Refund note for cancelled paid orders */}
        {transaction.status === 'cancelled' && transaction.paymentMethod === 'online' && (
          <View style={[styles.refundNote, shadows.small]}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.refundNoteText}>
              {transaction.paymentStatus === 'refunded'
                ? 'Your refund has been initiated and will appear in 3–5 business days.'
                : transaction.paymentStatus === 'refund_pending'
                  ? 'Your refund is being processed. Contact support if delayed.'
                  : 'No payment was collected — no refund needed.'}
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Cancel Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        visible={cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="alert-circle" size={40} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to cancel this order?
              {transaction.paymentMethod === 'online'
                ? '\n\nYour payment will be refunded in 3–5 business days.'
                : ''}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalNoBtn}
                onPress={() => setCancelModal(false)}
              >
                <Text style={styles.modalNoBtnText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalYesBtn}
                onPress={handleCancel}
              >
                <Text style={styles.modalYesBtnText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Timeline styles ──────────────────────────────────────────────────────────

const tl = StyleSheet.create({
  container: { gap: 0 },
  stepRow:   { flexDirection: 'row', alignItems: 'flex-start', minHeight: 44 },
  leftCol:   { alignItems: 'center', width: 28, marginRight: spacing.md },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
    minHeight: 20,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    paddingTop: 3,
    flex: 1,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: typography.sizes.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  scroll: { padding: spacing.xl, gap: spacing.md },

  // Hero
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroStatus: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  heroOrderId: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },

  // Product
  productRow:   { flexDirection: 'row', gap: spacing.md },
  productImg:   { width: 72, height: 72, borderRadius: borderRadius.lg, backgroundColor: colors.background },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  productInfo:  { flex: 1, gap: 4 },
  productTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, lineHeight: 20 },
  productSeller:{ fontSize: typography.sizes.xs, color: colors.textTertiary },
  productPrice: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },

  // Details
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel:{ fontSize: typography.sizes.sm, color: colors.textSecondary, flex: 1 },
  detailValue:{ fontSize: typography.sizes.sm, color: colors.textPrimary, fontWeight: typography.weights.medium, textAlign: 'right', flex: 1 },

  // Payment badge
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  payDot:       { width: 6, height: 6, borderRadius: 3 },
  payBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },

  // Seller
  sellerRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInitial:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  sellerInfo:     { flex: 1 },
  sellerName:     { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  sellerSubtext:  { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 2 },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  messageBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primary },

  // Cancel
  cancelCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error + '30',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cancelHint:     { flex: 1, fontSize: typography.sizes.xs, color: colors.textTertiary, lineHeight: 16 },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  cancelBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.error },

  // Refund note
  refundNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.primary + '0a',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  refundNoteText: { flex: 1, fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl ?? 24,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  modalNoBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalNoBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  modalYesBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalYesBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#fff' },
});
