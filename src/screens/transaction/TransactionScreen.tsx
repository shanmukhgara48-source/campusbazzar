import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useTransaction, updateTransactionStatus, confirmHandoff, TxStatus } from '../../services/transactionService';
import { getOrCreateChat } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import TransactionStatusBadge from '../../components/TransactionStatusBadge';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Transaction'>;
  route:      RouteProp<HomeStackParamList, 'Transaction'>;
};

const STATUS_FLOW: TxStatus[] = ['pending', 'accepted', 'meetup_set', 'completed'];

const STATUS_LABELS: Record<TxStatus, string> = {
  pending:   'Purchase Requested',
  accepted:  'Seller Accepted',
  meetup_set:'Meetup Confirmed',
  completed: 'Handoff Complete',
  cancelled: 'Cancelled',
  disputed:  'Under Review',
};

export default function TransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const { user } = useAuth();
  const { transaction, loading } = useTransaction(transactionId);

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
        <Text style={styles.notFoundText}>Transaction not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const iAmBuyer   = user?.uid === transaction.buyerId;
  const currentStep = STATUS_FLOW.indexOf(transaction.status);

  const handleMessage = async () => {
    if (!user?.uid) return;
    if (!transaction.buyerId || !transaction.sellerId) {
      Alert.alert('Error', 'Transaction data is incomplete.');
      return;
    }
    console.log('[TransactionScreen] Message pressed', {
      buyerId:  transaction.buyerId,
      sellerId: transaction.sellerId,
    });
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
      );
      navigation.navigate('FirebaseChat', {
        chatId,
        otherUserId:   iAmBuyer ? transaction.sellerId  : transaction.buyerId,
        otherUserName: iAmBuyer ? transaction.sellerName : transaction.buyerName,
        listingTitle:  transaction.listingTitle,
      });
    } catch (e: any) {
      console.error('[TransactionScreen] chat error:', e?.code, e?.message, e);
      Alert.alert('Could Not Open Chat', e?.message ?? 'Please try again.');
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Handoff',
      'Confirm that you have received / handed over the item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Confirm',
          onPress: async () => {
            try {
              const role = iAmBuyer ? 'buyer' : 'seller';
              await confirmHandoff(transaction.id, role);
              // Check if the other side has already confirmed
              const otherConfirmed = iAmBuyer
                ? transaction.sellerConfirmed
                : transaction.buyerConfirmed;
              if (otherConfirmed) {
                await updateTransactionStatus(transaction.id, 'completed');
                Alert.alert('Transaction Complete!', 'Please leave a review for your experience.');
              } else {
                Alert.alert('Confirmed!', 'Waiting for the other party to confirm.');
              }
            } catch {
              Alert.alert('Error', 'Could not confirm. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Transaction',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Transaction',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateTransactionStatus(transaction.id, 'cancelled');
            } catch {
              Alert.alert('Error', 'Could not cancel. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Item card */}
      <View style={styles.itemCard}>
        {!!transaction.listingImage && (
          <Image source={{ uri: transaction.listingImage }} style={styles.itemImage} resizeMode="cover" />
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{transaction.listingTitle}</Text>
          <Text style={styles.finalPrice}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
          <TransactionStatusBadge status={transaction.status as any} />
        </View>
      </View>

      {/* Participants */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Participants</Text>
        <View style={styles.participantRow}>
          <View style={styles.participantItem}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitials}>
                {transaction.buyerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.participantRole}>Buyer</Text>
              <Text style={styles.participantName}>{transaction.buyerName}</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
          <View style={styles.participantItem}>
            <View style={[styles.participantAvatar, { backgroundColor: colors.accent + '25' }]}>
              <Text style={[styles.participantInitials, { color: colors.accent }]}>
                {transaction.sellerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.participantRole}>Seller</Text>
              <Text style={styles.participantName}>{transaction.sellerName}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress stepper */}
      {transaction.status !== 'cancelled' && transaction.status !== 'disputed' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress</Text>
          {STATUS_FLOW.map((s, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            return (
              <View key={s} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                    {done
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : <View style={current ? styles.stepDotInner : undefined} />
                    }
                  </View>
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  current && styles.stepLabelCurrent,
                  done    && styles.stepLabelDone,
                ]}>
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Meetup details */}
      {(transaction.meetupLocation || transaction.meetupTime || transaction.paymentMethod) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetup Details</Text>
          {transaction.meetupLocation && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.meetupLocation}</Text>
            </View>
          )}
          {transaction.meetupTime && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.meetupTime}</Text>
            </View>
          )}
          {transaction.paymentMethod && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.paymentMethod}</Text>
            </View>
          )}
        </View>
      )}

      {/* Confirm Handoff */}
      {transaction.status === 'meetup_set' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirm Handoff</Text>
          <View style={styles.confirmRow}>
            <View style={styles.confirmItem}>
              <Ionicons
                name={transaction.buyerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={transaction.buyerConfirmed ? colors.success : colors.textTertiary}
              />
              <Text style={styles.confirmLabel}>Buyer</Text>
            </View>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmItem}>
              <Ionicons
                name={transaction.sellerConfirmed ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={transaction.sellerConfirmed ? colors.success : colors.textTertiary}
              />
              <Text style={styles.confirmLabel}>Seller</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>I've completed the handoff</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      {transaction.status !== 'completed' && transaction.status !== 'cancelled' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post-completion CTA */}
      {transaction.status === 'completed' && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Ratings', { userId: iAmBuyer ? transaction.sellerId : transaction.buyerId })}
          activeOpacity={0.85}
        >
          <Ionicons name="star-outline" size={18} color={colors.accent} />
          <Text style={styles.reviewBtnText}>Leave a Review</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  notFoundText: { fontSize: typography.sizes.md, color: colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  headerTitle:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: spacing.xl, borderRadius: borderRadius.xl,
    overflow: 'hidden', ...shadows.medium,
  },
  itemImage:   { width: 100, height: 100 },
  itemInfo:    { flex: 1, padding: spacing.md, gap: spacing.xs },
  itemTitle:   { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  finalPrice:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  card: {
    backgroundColor: '#fff', marginHorizontal: spacing.xl, marginBottom: spacing.md,
    borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.small,
  },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  participantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participantItem:{ flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  participantAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center',
  },
  participantInitials:{ fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  participantRole:    { fontSize: typography.sizes.xs, color: colors.textTertiary },
  participantName:    { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  stepRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 40 },
  stepLeft:  { alignItems: 'center', width: 24 },
  stepDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  stepDotDone:    { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotCurrent: { backgroundColor: '#fff', borderColor: colors.primary },
  stepDotInner:   { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  stepLine:       { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  stepLineDone:   { backgroundColor: colors.primary },
  stepLabel:      { fontSize: typography.sizes.md, color: colors.textTertiary, paddingTop: 2, marginBottom: spacing.lg },
  stepLabelCurrent:{ color: colors.primary, fontWeight: typography.weights.semibold },
  stepLabelDone:   { color: colors.textSecondary },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  detailText: { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl, marginBottom: spacing.xl },
  confirmItem:   { alignItems: 'center', gap: spacing.xs },
  confirmLabel:  { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  confirmDivider:{ width: 40, height: 1, backgroundColor: colors.border },
  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  confirmBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  actionsRow: {
    flexDirection: 'row', gap: spacing.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.md, paddingVertical: spacing.md,
  },
  messageBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  cancelBtn:  {
    borderWidth: 1.5, borderColor: colors.error,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  cancelBtnText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: spacing.xl,
    borderWidth: 2, borderColor: colors.accent,
    borderRadius: borderRadius.md, paddingVertical: spacing.md, backgroundColor: '#fffbeb',
  },
  reviewBtnText: { color: colors.accent, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
