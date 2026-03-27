import React, { useState, useEffect } from 'react';
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
import { fetchListing } from '../../services/listingService';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { createTransaction } from '../../services/transactionService';
import { handlePurchase } from '../../services/listingService';
import { createNotification } from '../../services/notificationsService';
import { generateCheckoutHTML, RazorpayWebMessage } from '../../services/razorpayService';
import { calculateFees } from '../../services/pricingService';
import { Listing, MeetupLocation } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Meetup'>;
  route: RouteProp<HomeStackParamList, 'Meetup'>;
};

const LOCATIONS: { value: MeetupLocation; icon: string; desc: string }[] = [
  { value: 'Library',      icon: 'library-outline',   desc: 'Main campus library entrance' },
  { value: 'Canteen',      icon: 'restaurant-outline', desc: 'Central canteen, ground floor' },
  { value: 'Admin Gate',   icon: 'business-outline',   desc: 'Main admin building gate' },
  { value: 'Main Block',   icon: 'school-outline',     desc: 'Main academic block lobby' },
  { value: 'Hostel Block', icon: 'home-outline',       desc: 'Hostel common area' },
];

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'];

export default function MeetupScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listingId, finalPrice: negotiatedPrice } = route.params;
  const { user } = useAuth();

  const [listing, setListing]           = useState<Listing | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [location, setLocation]         = useState<MeetupLocation | null>(null);
  const [timeSlot, setTimeSlot]         = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);

  useEffect(() => {
    fetchListing(listingId)
      .then(l => setListing((l ?? mockListings.find(m => m.id === listingId) ?? null) as any))
      .catch(() => setListing(mockListings.find(l => l.id === listingId) ?? null))
      .finally(() => setFetchLoading(false));
  }, [listingId]);

  if (fetchLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const isSold       = listing.status === 'sold';
  const isOwnListing = user?.uid === listing.sellerId;
  const canPay       = !!(location && timeSlot && !isSold && !isOwnListing);

  // Use negotiated price from chat offer flow if provided, else listing's stored finalPrice, else asking price
  const itemPrice    = negotiatedPrice ?? listing.finalPrice ?? listing.price;
  const isNegotiated = itemPrice < listing.price;
  const fees           = calculateFees(itemPrice);
  const convenienceFee = fees.platformFee + fees.gst;

  // ── Core purchase logic (called on Razorpay success) ──────────────────────
  const completePurchase = async (razorpayPaymentId: string) => {
    if (!user?.uid || !location || !timeSlot || !listing) return;
    setIsConfirming(true);
    try {
      const deliveryOtp    = String(Math.floor(1000 + Math.random() * 9000));
      const convenienceFee = fees.platformFee + fees.gst;

      // QR payload — filled in after we know the txId
      // We create the transaction first, then update qrCodeData with the real txId
      const txId = await createTransaction({
        listingId:         listing.id,
        listingTitle:      listing.title,
        listingImage:      listing.images?.[0] ?? '',
        listingPrice:      listing.price,
        buyerId:           user.uid,
        buyerName:         user.name || user.email,
        sellerId:          listing.sellerId,
        sellerName:        listing.seller?.name ?? 'Seller',
        amount:            fees.total,
        itemPrice:         fees.itemPrice,
        platformFee:       fees.platformFee,
        gst:               fees.gst,
        convenienceFee,
        convenienceFeePaid: true,
        qrCodeData:        '',       // patched below
        meetupLocation:    location,
        meetupTime:        `${dateStr}, ${timeSlot}`,
        paymentMethod:     'Razorpay',
        deliveryOtp,
        razorpayPaymentId,
      });

      // Patch qrCodeData now that we have the real txId
      const { transactionsApi } = await import('../../services/api');
      const qrCodeData = JSON.stringify({
        v:         1,
        txId,
        listingId: listing.id,
        buyerId:   user.uid,
        sellerId:  listing.sellerId,
      });
      await transactionsApi.update(txId, { qrCodeData } as any);

      try { await handlePurchase(listing.id); }
      catch (e: any) { console.warn('[MeetupScreen] handlePurchase non-fatal:', e?.message); }

      try {
        await createNotification(
          listing.sellerId, 'sale', 'Item Purchased!',
          `${user.name || user.email} bought "${listing.title}" — Meetup at ${location}, ${timeSlot}`,
          { transactionId: txId, listingId: listing.id },
        );
      } catch (e) { console.warn('[MeetupScreen] notify non-fatal:', e); }

      navigation.navigate('Transaction', { transactionId: txId });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      Alert.alert(
        'Purchase Failed',
        msg.includes('permission') || msg.includes('PERMISSION')
          ? 'Permission denied. Please ensure you are logged in.'
          : `Could not complete purchase: ${msg}`,
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Open Razorpay after guards ────────────────────────────────────────────
  const handlePayNow = () => {
    if (!user?.uid)    { Alert.alert('Login required', 'Please log in to buy items.'); return; }
    if (isOwnListing)  { Alert.alert('Not allowed', 'You cannot buy your own listing.'); return; }
    if (isSold)        { Alert.alert('Already Sold', 'This item has already been sold.'); return; }
    if (!location)     { Alert.alert('Select Location', 'Please choose a meetup location.'); return; }
    if (!timeSlot)     { Alert.alert('Select Time', 'Please choose a time slot.'); return; }
    setShowRazorpay(true);
  };

  // ── Handle Razorpay WebView messages ─────────────────────────────────────
  const handleRazorpayMessage = (event: WebViewMessageEvent) => {
    let msg: RazorpayWebMessage;
    try { msg = JSON.parse(event.nativeEvent.data) as RazorpayWebMessage; }
    catch { return; }

    if (msg.type === 'PAYMENT_SUCCESS') {
      setShowRazorpay(false);
      completePurchase(msg.payment_id);
    } else if (msg.type === 'PAYMENT_FAILED') {
      setShowRazorpay(false);
      Alert.alert('Payment Failed', msg.description || 'The payment could not be processed. Please try again.');
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
        <Text style={styles.headerTitle}>Buy Now</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Listing Summary */}
        <View style={styles.listingCard}>
          <Image source={{ uri: listing.images?.[0] }} style={styles.listingImg} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
            {isNegotiated ? (
              <View>
                <Text style={styles.listingPrice}>₹{itemPrice.toLocaleString('en-IN')}
                  <Text style={styles.dealTag}> · Deal Price</Text>
                </Text>
                <Text style={styles.originalPriceStrike}>
                  Original: ₹{listing.price.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : (
              <Text style={styles.listingPrice}>₹{itemPrice.toLocaleString('en-IN')}</Text>
            )}
            <View style={styles.sellerRow}>
              {listing.seller?.avatar
                ? <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
                : null}
              <Text style={styles.sellerName}>{listing.seller?.name ?? 'Seller'}</Text>
            </View>
          </View>
        </View>

        {/* Sold / own-listing warning */}
        {(isSold || isOwnListing) && (
          <View style={styles.warnBox}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.warnText}>
              {isSold ? 'This item has already been sold.' : 'You cannot buy your own listing.'}
            </Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.dateCard}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <View>
            <Text style={styles.dateLabel}>Proposed Meetup Date</Text>
            <Text style={styles.dateValue}>{dateStr}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Time Slot</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, timeSlot === slot && styles.slotActive]}
                onPress={() => setTimeSlot(slot)}
                disabled={isSold || isOwnListing}
              >
                <Text style={[styles.slotText, timeSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meeting Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meeting Location</Text>
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc.value}
              style={[styles.optionRow, location === loc.value && styles.optionRowActive]}
              onPress={() => setLocation(loc.value)}
              disabled={isSold || isOwnListing}
            >
              <View style={[styles.optionIconBox, location === loc.value && styles.optionIconBoxActive]}>
                <Ionicons
                  name={loc.icon as any}
                  size={20}
                  color={location === loc.value ? '#fff' : colors.textSecondary}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionName, location === loc.value && styles.optionNameActive]}>
                  {loc.value}
                </Text>
                <Text style={styles.optionDesc}>{loc.desc}</Text>
              </View>
              {location === loc.value && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Price Breakdown ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment Summary</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Item Price</Text>
              <Text style={styles.breakdownValue}>₹{fees.itemPrice.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelGroup}>
                <Text style={styles.breakdownLabel}>Platform Fee</Text>
                <Text style={styles.breakdownMeta}>({Math.round(fees.feePercent * 100)}% of item price)</Text>
              </View>
              <Text style={styles.breakdownValue}>₹{fees.platformFee.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelGroup}>
                <Text style={styles.breakdownLabel}>GST</Text>
                <Text style={styles.breakdownMeta}>(18% of platform fee)</Text>
              </View>
              <Text style={styles.breakdownValue}>₹{fees.gst.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownTotalLabel}>Total Amount</Text>
              <Text style={styles.breakdownTotalValue}>₹{fees.total.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelGroup}>
                <Text style={[styles.breakdownLabel, { color: colors.primary, fontWeight: '600' }]}>Pay Online Now</Text>
                <Text style={styles.breakdownMeta}>(convenience fee — via Razorpay)</Text>
              </View>
              <Text style={[styles.breakdownTotalValue, { color: colors.primary }]}>
                ₹{convenienceFee.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelGroup}>
                <Text style={styles.breakdownLabel}>Pay at Meetup</Text>
                <Text style={styles.breakdownMeta}>(item price — cash to seller)</Text>
              </View>
              <Text style={styles.breakdownValue}>₹{fees.itemPrice.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Razorpay badge */}
          <View style={styles.rzpBadge}>
            <View style={styles.rzpBadgeLeft}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <View>
                <Text style={styles.rzpBadgeTitle}>Pay securely with Razorpay</Text>
                <Text style={styles.rzpBadgeSub}>UPI · Cards · Net Banking · Wallets</Text>
              </View>
            </View>
          </View>
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={12} color={colors.success} />
            <Text style={styles.secureText}>256-bit SSL encrypted · PCI DSS compliant</Text>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyBox}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={styles.safetyTitle}>Safety Tips</Text>
          </View>
          {[
            'Meet in public, well-lit campus locations',
            'Inspect the item before the meetup',
            'Bring a friend if buying high-value items',
            'Report suspicious activity to admin',
          ].map((tip, i) => (
            <View key={i} style={styles.safetyRow}>
              <View style={styles.safetyDot} />
              <Text style={styles.safetyText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Protection badge */}
        <View style={styles.protectionBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.protectionTitle}>Protected by CampusBazaar</Text>
            <Text style={styles.protectionSub}>Refund available if item not delivered · OTP verified handoff</Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, (!canPay || isConfirming) && styles.payBtnDisabled]}
          onPress={handlePayNow}
          disabled={!canPay || isConfirming}
          activeOpacity={0.85}
        >
          {isConfirming ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payBtnText}>Processing…</Text>
            </>
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.payBtnText}>
                Pay Convenience Fee ₹{convenienceFee.toLocaleString('en-IN')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* ── Razorpay WebView Modal ──────────────────────────────────────── */}
      <Modal
        visible={showRazorpay}
        animationType="slide"
        onRequestClose={() => setShowRazorpay(false)}
      >
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
                description: listing.title,
                buyerName:   user?.name  || '',
                buyerEmail:  user?.email || '',
              }),
            }}
            onMessage={handleRazorpayMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            // Android: allow Razorpay CDN (https) to load inside the webview
            mixedContentMode="always"
            originWhitelist={['*']}
            // Android: allow Razorpay's UPI intent / payment app redirects
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled
            renderLoading={() => (
              <View style={styles.rzpLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            style={styles.webview}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  content:     { padding: spacing.xl },

  // Listing card
  listingCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl,
    gap: spacing.md, ...shadows.small,
  },
  listingImg:   { width: 72, height: 72, borderRadius: borderRadius.md },
  listingInfo:  { flex: 1 },
  listingTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: spacing.xs, lineHeight: 20 },
  listingPrice: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginBottom: spacing.xs },
  sellerRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sellerAvatar: { width: 18, height: 18, borderRadius: 9 },
  sellerName:   { fontSize: typography.sizes.xs, color: colors.textSecondary },

  // Warn
  warnBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error + '12', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  warnText: { flex: 1, fontSize: typography.sizes.sm, color: colors.error },

  // Date
  dateCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.md,
    padding: spacing.lg, marginBottom: spacing.xl, gap: spacing.md,
  },
  dateLabel: { fontSize: typography.sizes.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.primary },

  // Section
  section:      { marginBottom: spacing.xl },
  sectionLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: spacing.md },

  // Time slots
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, minWidth: '30%', alignItems: 'center',
  },
  slotActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText:       { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textSecondary },
  slotTextActive: { color: '#fff', fontWeight: typography.weights.semibold },

  // Location options
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1.5, borderColor: colors.border, gap: spacing.md,
  },
  optionRowActive:     { borderColor: colors.primary, backgroundColor: '#f0f7f3' },
  optionIconBox:       { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  optionIconBoxActive: { backgroundColor: colors.primary },
  optionInfo:          { flex: 1 },
  optionName:          { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  optionNameActive:    { color: colors.primary },
  optionDesc:          { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 2 },

  // Razorpay payment card
  razorpayCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, borderWidth: 2, borderColor: colors.primary,
    ...shadows.small,
  },
  razorpayCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  razorpayIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  razorpayCardTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  razorpayCardSub:   { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 2 },
  razorpayAmountBox: { alignItems: 'flex-end' },
  razorpayAmountLabel: { fontSize: typography.sizes.xs, color: colors.textTertiary },
  razorpayAmount:    { fontSize: typography.sizes.lg, fontWeight: typography.weights.extrabold, color: colors.primary },
  secureRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, paddingHorizontal: 2 },
  secureText:  { fontSize: 11, color: colors.success },

  // Safety tips
  safetyBox: {
    backgroundColor: '#f0f7f3', borderRadius: borderRadius.md,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  safetyTitle:  { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
  safetyRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  safetyDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },
  safetyText:   { flex: 1, fontSize: typography.sizes.xs, color: colors.textSecondary, lineHeight: 18 },

  // Pay button
  payBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, ...shadows.medium,
  },
  payBtnDisabled:      { opacity: 0.5 },
  payBtnText:          { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: '#fff' },
  dealTag:             { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.success },
  originalPriceStrike: { fontSize: typography.sizes.xs, color: colors.textTertiary, textDecorationLine: 'line-through', marginTop: 2 },

  // Price breakdown card
  breakdownCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadows.small,
    borderWidth: 1, borderColor: colors.border,
  },
  breakdownRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  breakdownLabelGroup: { gap: 1 },
  breakdownLabel:      { fontSize: typography.sizes.sm, color: colors.textSecondary },
  breakdownMeta:       { fontSize: 10, color: colors.textTertiary },
  breakdownValue:      { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  breakdownDivider:    { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  breakdownTotalLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  breakdownTotalValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.extrabold, color: colors.primary },

  // Razorpay badge (replaces old razorpayCard)
  rzpBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary + '08', borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.primary + '30',
    marginBottom: spacing.xs,
  },
  rzpBadgeLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rzpBadgeTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  rzpBadgeSub:   { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 1 },

  // Razorpay modal
  rzpContainer: { flex: 1, backgroundColor: colors.background },
  rzpHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rzpHeaderTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  rzpClose:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rzpLoader:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  webview:        { flex: 1 },
  protectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.success + '12', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.success + '30',
  },
  protectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.success },
  protectionSub:   { fontSize: 11, color: colors.success + 'cc', marginTop: 1 },
});
