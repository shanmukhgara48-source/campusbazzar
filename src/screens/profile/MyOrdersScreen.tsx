import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Modal, RefreshControl, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useBuyerTransactions } from '../../services/transactionService';
import { transactionsApi, ApiTransaction } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Orders'>;
};

// ─── Status / payment config ─────────────────────────────────────────────────

const ORDER_STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  accepted:   { label: 'Confirmed',   color: colors.primary,  bg: colors.primary + '15',  icon: 'checkmark-circle' },
  pending:    { label: 'Pending',     color: '#f59e0b',        bg: '#fef3c7',              icon: 'time' },
  meetup_set: { label: 'Meetup Set',  color: '#3b82f6',        bg: '#eff6ff',              icon: 'location' },
  completed:  { label: 'Completed',   color: colors.success,   bg: colors.success + '15',  icon: 'bag-check' },
  cancelled:  { label: 'Cancelled',   color: colors.error,     bg: colors.error + '15',    icon: 'close-circle' },
  disputed:   { label: 'Under Review',color: '#8b5cf6',        bg: '#ede9fe',              icon: 'warning' },
};

const PAYMENT_CFG: Record<string, { label: string; color: string }> = {
  pending:        { label: 'Pay at Meetup',    color: '#f59e0b' },
  paid:           { label: 'Paid',             color: colors.success },
  refunded:       { label: 'Refunded',         color: colors.primary },
  refund_pending: { label: 'Refund Processing',color: '#f59e0b' },
  cancelled:      { label: 'Cancelled',        color: colors.error },
};

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'active' | 'completed' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function matchesFilter(tx: ApiTransaction, filter: FilterKey): boolean {
  if (filter === 'all')       return true;
  if (filter === 'active')    return tx.status === 'accepted' || tx.status === 'meetup_set' || tx.status === 'pending';
  if (filter === 'completed') return tx.status === 'completed';
  if (filter === 'cancelled') return tx.status === 'cancelled';
  return true;
}

// ─── Order card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  tx:            ApiTransaction;
  onCancel:      (tx: ApiTransaction) => void;
  cancelling:    boolean;
  userId:        string;
  refundMessage: string | undefined;
}

function OrderCard({ tx, onCancel, cancelling, userId, refundMessage }: OrderCardProps) {
  const statusCfg  = ORDER_STATUS_CFG[tx.status]      ?? ORDER_STATUS_CFG['pending'];
  const paymentCfg = PAYMENT_CFG[tx.paymentStatus ?? 'pending'] ?? PAYMENT_CFG['pending'];

  const canCancel = tx.buyerId === userId && tx.status === 'accepted';

  const orderId = tx.id.slice(0, 8).toUpperCase();
  const placedAt = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={[styles.card, shadows.small]}>

      {/* ── Top row: status badge + date ─────────────────────────────────── */}
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
          <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <Text style={styles.orderDate}>{placedAt}</Text>
      </View>

      {/* ── Product row ──────────────────────────────────────────────────── */}
      <View style={styles.productRow}>
        {tx.listingImage ? (
          <Image source={{ uri: tx.listingImage }} style={styles.productImg} />
        ) : (
          <View style={[styles.productImg, styles.imgPlaceholder]}>
            <Ionicons name="cube-outline" size={24} color={colors.textTertiary} />
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>{tx.listingTitle}</Text>
          <View style={styles.sellerRow}>
            <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.sellerName} numberOfLines={1}>
              {tx.sellerName || 'Seller'}
            </Text>
          </View>
          <Text style={styles.productPrice}>₹{tx.amount.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Bottom row: payment + order ID + cancel ──────────────────────── */}
      <View style={styles.cardBottomRow}>
        <View style={styles.metaCol}>
          <View style={[styles.payBadge, { backgroundColor: paymentCfg.color + '18' }]}>
            <View style={[styles.payDot, { backgroundColor: paymentCfg.color }]} />
            <Text style={[styles.payBadgeText, { color: paymentCfg.color }]}>
              {paymentCfg.label}
            </Text>
          </View>
          <Text style={styles.orderId}>#{orderId}</Text>
        </View>

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(tx)}
            disabled={cancelling}
            activeOpacity={0.75}
          >
            {cancelling
              ? <ActivityIndicator size="small" color={colors.error} />
              : <>
                  <Ionicons name="close-circle-outline" size={15} color={colors.error} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {tx.status === 'cancelled' && (
          <View style={styles.cancelledTag}>
            <Text style={styles.cancelledTagText}>Cancelled</Text>
          </View>
        )}
      </View>

      {/* Refund / cancellation note */}
      {refundMessage && (
        <View style={styles.refundNote}>
          <Ionicons name="card-outline" size={14} color={colors.primary} />
          <Text style={styles.refundNoteText}>{refundMessage}</Text>
        </View>
      )}
      {!refundMessage && tx.status === 'cancelled' && tx.paymentMethod === 'online' && (
        <View style={styles.refundNote}>
          <Ionicons name="card-outline" size={14} color={colors.primary} />
          <Text style={styles.refundNoteText}>
            {(tx.paymentStatus ?? '') === 'refunded'
              ? 'Refund initiated — arrives in 3–5 business days.'
              : (tx.paymentStatus ?? '') === 'refund_pending'
                ? 'Refund is being processed.'
                : 'No payment was charged.'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyOrdersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { transactions: allOrders, loading, refreshing, refetch } = useBuyerTransactions(user?.uid ?? '');

  const [filter,         setFilter]         = useState<FilterKey>('all');
  const [cancelTarget,   setCancelTarget]   = useState<ApiTransaction | null>(null);
  const [cancelling,     setCancelling]     = useState(false);
  // Local overrides so cancel reflects immediately without waiting for a re-fetch
  const [cancelledIds,   setCancelledIds]   = useState<Set<string>>(new Set());
  const [refundMessages, setRefundMessages] = useState<Record<string, string>>({});

  // ── Derived list ─────────────────────────────────────────────────────────

  const merged = allOrders.map(tx =>
    cancelledIds.has(tx.id)
      ? { ...tx, status: 'cancelled', paymentStatus: tx.paymentMethod === 'online' ? 'refund_pending' : 'cancelled' }
      : tx,
  );

  const filtered = merged
    .filter(tx => matchesFilter(tx, filter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ── Refresh ──────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  // ── Cancel flow ──────────────────────────────────────────────────────────

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelling(true);
    setCancelTarget(null);
    try {
      const result = await transactionsApi.cancel(target.id);
      // Optimistically flip the card status immediately
      setCancelledIds(prev => new Set(prev).add(target.id));
      const ps = result.paymentStatus;
      const msg = target.paymentMethod === 'online'
        ? (ps === 'refunded'
            ? 'Your payment will be refunded in 3–5 business days.'
            : 'Your refund is being processed. It may take a few business days.')
        : 'Your order has been cancelled successfully.';
      setRefundMessages(prev => ({ ...prev, [target.id]: msg }));
      // Background refetch so the list reflects the true server state
      refetch();
    } catch {
      // Silent — the cancel button stays visible so user can retry
    } finally {
      setCancelling(false);
    }
  }, [cancelTarget]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{allOrders.length}</Text>
        </View>
      </View>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => {
            const count = allOrders.filter(tx => matchesFilter(tx, f.key)).length;
            const active = f.key === filter;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterTab,
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterTabText,
                  active && { color: '#fff' },
                ]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.filterCount,
                    { backgroundColor: active ? 'rgba(255,255,255,0.3)' : colors.border },
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            filtered.length === 0 ? styles.emptyContainer : styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="cube-outline" size={56} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Items you purchase will appear here.'
                  : 'Try selecting a different filter.'}
              </Text>
              {filter !== 'all' && (
                <TouchableOpacity onPress={() => setFilter('all')} style={styles.emptyAction}>
                  <Text style={styles.emptyActionText}>View all orders</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <OrderCard
              tx={item}
              onCancel={setCancelTarget}
              cancelling={cancelling && cancelTarget?.id === item.id}
              userId={user?.uid ?? ''}
              refundMessage={refundMessages[item.id]}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Cancel confirmation modal ────────────────────────────────────── */}
      <Modal
        visible={!!cancelTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="alert-circle" size={40} color={colors.error} />
            </View>

            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to cancel this order?
              {cancelTarget?.paymentMethod === 'online'
                ? '\n\nYour payment will be refunded within 3–5 business days.'
                : ''}
            </Text>

            {cancelTarget && (
              <View style={styles.modalOrderSummary}>
                <Text style={styles.modalOrderTitle} numberOfLines={1}>
                  {cancelTarget.listingTitle}
                </Text>
                <Text style={styles.modalOrderPrice}>
                  ₹{cancelTarget.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setCancelTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalKeepText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleConfirmCancel}
                activeOpacity={0.8}
              >
                {cancelling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalCancelText}>Yes, Cancel</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontSize: typography.sizes.sm },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  // Filter tabs
  filterWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterTabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  filterCount: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },

  // List
  listContent:    { padding: spacing.xl, gap: spacing.md },
  emptyContainer: { flex: 1 },

  // Order card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  orderDate: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },

  productRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  productImg: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  imgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: { flex: 1, gap: 5 },
  productTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sellerName: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    flex: 1,
  },
  productPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaCol: { gap: 5 },

  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  payDot:       { width: 6, height: 6, borderRadius: 3 },
  payBadgeText: { fontSize: 11, fontWeight: typography.weights.semibold },

  orderId: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontFamily: 'monospace' as any,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  cancelBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },

  cancelledTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error + '12',
  },
  cancelledTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },

  refundNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  refundNoteText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '12',
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
  },
  emptyActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
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
  modalOrderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  modalOrderTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  modalOrderPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  modalKeepBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalKeepText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
});
