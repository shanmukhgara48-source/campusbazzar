import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { useTransactions } from '../../context/TransactionContext';
import TransactionStatusBadge from '../../components/TransactionStatusBadge';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Transaction, TransactionStatus } from '../../types';
import { MOCK_TRANSACTIONS } from '../../data/mockData';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Transaction'>;
  route:      RouteProp<HomeStackParamList, 'Transaction'>;
};

const STATUS_FLOW: TransactionStatus[] = [
  'initiated', 'accepted', 'reserved', 'meetup_set', 'completed',
];

const STATUS_LABELS: Record<TransactionStatus, string> = {
  initiated:  'Request Sent',
  accepted:   'Accepted',
  reserved:   'Item Reserved',
  meetup_set: 'Meetup Scheduled',
  completed:  'Handoff Complete',
  cancelled:  'Cancelled',
  disputed:   'Under Review',
};

export default function TransactionScreen({ navigation, route }: Props) {
  const { transactionId } = route.params;
  const { updateStatus, confirmBuyer, confirmSeller, isBothConfirmed } = useTransactions();

  // In production this would come from context / API
  const [transaction, setTransaction] = useState<Transaction>(
    MOCK_TRANSACTIONS.find(t => t.id === transactionId) ?? MOCK_TRANSACTIONS[0],
  );

  const currentStep = STATUS_FLOW.indexOf(transaction.status as TransactionStatus);
  const iAmBuyer    = true; // derive from AuthContext in production

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Meetup',
      'Confirm that you have received / handed over the item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Confirm',
          onPress: () => {
            if (iAmBuyer) confirmBuyer(transaction.id);
            else confirmSeller(transaction.id);
            if (isBothConfirmed(transaction.id)) {
              updateStatus(transaction.id, 'completed', { completedAt: new Date().toISOString() });
              Alert.alert('Transaction Complete!', 'Please leave a review for your experience.');
            } else {
              Alert.alert('Confirmed!', 'Waiting for the other party to confirm.');
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Transaction',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Transaction',
          style: 'destructive',
          onPress: () => updateStatus(transaction.id, 'cancelled'),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Item card */}
      <View style={styles.itemCard}>
        {transaction.listing.images[0] && (
          <Image source={{ uri: transaction.listing.images[0] }} style={styles.itemImage} resizeMode="cover" />
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{transaction.listing.title}</Text>
          <Text style={styles.finalPrice}>₹{transaction.finalPrice.toLocaleString('en-IN')}</Text>
          <TransactionStatusBadge status={transaction.status as TransactionStatus} />
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
                <Text style={[styles.stepLabel, current && styles.stepLabelCurrent, done && styles.stepLabelDone]}>
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Meetup details */}
      {transaction.status === 'meetup_set' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetup Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.detailText}>{transaction.meetupLocation}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.detailText}>
              {new Date(transaction.meetupTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
            <Text style={styles.detailText}>{transaction.paymentMethod}</Text>
          </View>
        </View>
      )}

      {/* Confirmation */}
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
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigation.navigate('Chat' as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post-completion CTA */}
      {transaction.status === 'completed' && !transaction.reviewLeft && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Ratings', { userId: transaction.sellerId })}
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
  container: { flex: 1, backgroundColor: colors.background },
  itemCard: {
    flexDirection:   'row',
    backgroundColor: '#fff',
    margin:          spacing.xl,
    borderRadius:    borderRadius.xl,
    overflow:        'hidden',
    ...shadows.medium,
  },
  itemImage: { width: 100, height: 100 },
  itemInfo: {
    flex:    1,
    padding: spacing.md,
    gap:     spacing.xs,
  },
  itemTitle: {
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color:      colors.textPrimary,
  },
  finalPrice: {
    fontSize:   typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color:      colors.primary,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.xl,
    marginBottom:    spacing.md,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    ...shadows.small,
  },
  cardTitle: {
    fontSize:     typography.sizes.md,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.md,
    minHeight:     40,
  },
  stepLeft: {
    alignItems: 'center',
    width:      24,
  },
  stepDot: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: colors.border,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.border,
  },
  stepDotDone:    { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotCurrent: { backgroundColor: '#fff', borderColor: colors.primary },
  stepDotInner:   { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  stepLine: {
    width:           2,
    flex:            1,
    backgroundColor: colors.border,
    marginVertical:  2,
  },
  stepLineDone: { backgroundColor: colors.primary },
  stepLabel: {
    fontSize:    typography.sizes.md,
    color:       colors.textTertiary,
    paddingTop:  2,
    marginBottom: spacing.lg,
  },
  stepLabelCurrent: { color: colors.primary,    fontWeight: typography.weights.semibold },
  stepLabelDone:    { color: colors.textSecondary },
  detailRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
    marginBottom:  spacing.md,
  },
  detailText: {
    fontSize:   typography.sizes.md,
    color:      colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  confirmRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.xxl,
    marginBottom:   spacing.xl,
  },
  confirmItem: {
    alignItems: 'center',
    gap:        spacing.xs,
  },
  confirmLabel: {
    fontSize:   typography.sizes.sm,
    color:      colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  confirmDivider: {
    width:           40,
    height:          1,
    backgroundColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    height:          50,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
  },
  confirmBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  actionsRow: {
    flexDirection:    'row',
    gap:              spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom:     spacing.md,
  },
  messageBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    borderWidth:     1.5,
    borderColor:     colors.primary,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.md,
  },
  messageBtnText: {
    color:      colors.primary,
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  cancelBtn: {
    borderWidth:     1.5,
    borderColor:     colors.error,
    borderRadius:    borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cancelBtnText: {
    color:      colors.error,
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  reviewBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              spacing.sm,
    marginHorizontal: spacing.xl,
    borderWidth:      2,
    borderColor:      colors.accent,
    borderRadius:     borderRadius.md,
    paddingVertical:  spacing.md,
    backgroundColor:  '#fffbeb',
  },
  reviewBtnText: {
    color:      colors.accent,
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
