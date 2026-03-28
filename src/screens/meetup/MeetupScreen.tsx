import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTransaction } from '../../services/transactionService';
import { transactionsApi } from '../../services/api';
import { generateCheckoutHTML, RazorpayWebMessage } from '../../services/razorpayService';
import { calculateFees } from '../../services/pricingService';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Meetup'>;
  route: RouteProp<HomeStackParamList, 'Meetup'>;
};

export default function MeetupScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const { user } = useAuth();
  const { transaction, loading } = useTransaction(transactionId);

  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Transaction not found</Text>
      </View>
    );
  }

  const fees           = calculateFees(transaction.amount);
  const convenienceFee = fees.platformFee + fees.gst;

  const completePurchase = async (razorpayPaymentId: string) => {
    if (!user?.uid) return;
    setIsConfirming(true);
    try {
      const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));
      const qrCodeData  = JSON.stringify({
        v:         1,
        txId:      transaction.id,
        listingId: transaction.listingId,
        buyerId:   transaction.buyerId,
        sellerId:  transaction.sellerId,
      });

      await transactionsApi.update(transaction.id, {
        itemPrice:           fees.itemPrice,
        platformFee:         fees.platformFee,
        gst:                 fees.gst,
        convenienceFee,
        convenienceFeePaid:  true,
        qrCodeData,
        deliveryOtp,
        paymentMethod:       'Razorpay',
        razorpayPaymentId,
      } as any);

      navigation.replace('Transaction', { transactionId: transaction.id });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not record payment. Contact support.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRazorpayMessage = (event: WebViewMessageEvent) => {
    let msg: RazorpayWebMessage;
    try { msg = JSON.parse(event.nativeEvent.data) as RazorpayWebMessage; }
    catch { return; }

    if (msg.type === 'PAYMENT_SUCCESS') {
      setShowRazorpay(false);
      completePurchase(msg.payment_id);
    } else if (msg.type === 'PAYMENT_FAILED') {
      setShowRazorpay(false);
      Alert.alert('Payment Failed', msg.description || 'Please try again.');
    } else if (msg.type === 'PAYMENT_CANCELLED') {
      setShowRazorpay(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Convenience Fee</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Item summary */}
        <View style={styles.itemCard}>
          {!!transaction.listingImage && (
            <Image source={{ uri: transaction.listingImage }} style={styles.itemImg} />
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>{transaction.listingTitle}</Text>
            <Text style={styles.itemPrice}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.itemSeller}>Seller: {transaction.sellerName}</Text>
          </View>
        </View>

        {/* Meetup details */}
        <View style={styles.meetupCard}>
          <Text style={styles.meetupCardTitle}>Agreed Meetup</Text>
          {!!transaction.meetupLocation && (
            <View style={styles.meetupRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.meetupRowText}>{transaction.meetupLocation}</Text>
            </View>
          )}
          {!!transaction.meetupTime && (
            <View style={styles.meetupRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.meetupRowText}>{transaction.meetupTime}</Text>
            </View>
          )}
        </View>

        {/* Price breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Payment Summary</Text>

          {[
            { label: 'Item Price', meta: 'Pay cash at meetup', value: `₹${fees.itemPrice.toLocaleString('en-IN')}` },
            { label: 'Platform Fee', meta: `${Math.round(fees.feePercent * 100)}% of item price`, value: `₹${fees.platformFee.toLocaleString('en-IN')}` },
            { label: 'GST', meta: '18% of platform fee', value: `₹${fees.gst.toLocaleString('en-IN')}` },
          ].map(row => (
            <View key={row.label} style={styles.breakdownRow}>
              <View>
                <Text style={styles.breakdownLabel}>{row.label}</Text>
                <Text style={styles.breakdownMeta}>{row.meta}</Text>
              </View>
              <Text style={styles.breakdownValue}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <View>
              <Text style={[styles.breakdownLabel, { color: colors.primary, fontWeight: '700' }]}>Pay Online Now</Text>
              <Text style={styles.breakdownMeta}>Convenience fee via Razorpay</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: colors.primary, fontSize: typography.sizes.lg }]}>
              ₹{convenienceFee.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Razorpay badge */}
        <View style={styles.rzpBadge}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <View>
            <Text style={styles.rzpBadgeTitle}>Pay securely with Razorpay</Text>
            <Text style={styles.rzpBadgeSub}>UPI · Cards · Net Banking · Wallets</Text>
          </View>
        </View>

        {/* Pay button */}
        <TouchableOpacity
          style={[styles.payBtn, isConfirming && { opacity: 0.6 }]}
          disabled={isConfirming}
          onPress={() => setShowRazorpay(true)}
          activeOpacity={0.85}
        >
          {isConfirming
            ? <><ActivityIndicator size="small" color="#fff" /><Text style={styles.payBtnText}>Processing…</Text></>
            : <><Ionicons name="shield-checkmark" size={20} color="#fff" /><Text style={styles.payBtnText}>Pay ₹{convenienceFee.toLocaleString('en-IN')}</Text></>
          }
        </TouchableOpacity>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Razorpay WebView Modal */}
      <Modal visible={showRazorpay} animationType="slide" onRequestClose={() => setShowRazorpay(false)}>
        <View style={styles.rzpContainer}>
          <View style={[styles.rzpHeader, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.rzpHeaderTitle}>Secure Payment</Text>
            <TouchableOpacity style={styles.rzpClose} onPress={() => setShowRazorpay(false)}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{
              html: generateCheckoutHTML({
                amount:      convenienceFee,
                name:        'CampusBazaar',
                description: transaction.listingTitle,
                buyerName:   user?.name  || '',
                buyerEmail:  user?.email || '',
              }),
            }}
            onMessage={handleRazorpayMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mixedContentMode="always"
            originWhitelist={['*']}
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled
            renderLoading={() => (
              <View style={styles.rzpLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  content:     { padding: spacing.xl },

  itemCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.xl, gap: spacing.md, ...shadows.small,
  },
  itemImg:    { width: 72, height: 72, borderRadius: borderRadius.md },
  itemInfo:   { flex: 1 },
  itemTitle:  { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: 3 },
  itemPrice:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginBottom: 3 },
  itemSeller: { fontSize: typography.sizes.xs, color: colors.textTertiary },

  meetupCard: {
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  meetupCardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.primary, marginBottom: spacing.md },
  meetupRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  meetupRowText:   { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },

  breakdownCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    ...shadows.small, borderWidth: 1, borderColor: colors.border,
  },
  breakdownTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  breakdownLabel: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  breakdownMeta:  { fontSize: 10, color: colors.textTertiary, marginTop: 1 },
  breakdownValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  divider:        { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  rzpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary + '08', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  rzpBadgeTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  rzpBadgeSub:   { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 1 },

  payBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, ...shadows.medium,
  },
  payBtnText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: '#fff' },

  rzpContainer: { flex: 1, backgroundColor: colors.background },
  rzpHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rzpHeaderTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  rzpClose:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rzpLoader:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
