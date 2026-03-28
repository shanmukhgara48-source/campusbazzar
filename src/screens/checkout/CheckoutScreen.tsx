import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { listingsApi, razorpayApi, offersApi } from '../../services/api';
import { fetchListing, FSListing } from '../../services/listingService';
import { Deal, resolvePrice } from '../../services/pricingService';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Checkout'>;
  route:      RouteProp<HomeStackParamList, 'Checkout'>;
};

type PaymentMethod = 'online' | 'cod';

// ─── Razorpay HTML builder ────────────────────────────────────────────────────

function buildRazorpayHtml(
  orderId: string,
  keyId: string,
  amountInPaise: number,
  itemTitle: string,
  prefill: { name: string; email: string },
): string {
  // Escape values to prevent XSS / quote-breaking in the inline script
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    body { margin: 0; background: #f0fdf4; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, sans-serif; }
    .loader { text-align: center; color: #16a34a; }
    .loader p { margin-top: 12px; font-size: 15px; }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="loader"><p>Opening payment...</p></div>
  <script>
    window.onload = function () {
      var options = {
        key:         "${esc(keyId)}",
        amount:      ${amountInPaise},
        currency:    "INR",
        order_id:    "${esc(orderId)}",
        name:        "CampusBazaar",
        description: "${esc(itemTitle)}",
        image:       "https://campusbazaar.in/icon.png",
        prefill: {
          name:  "${esc(prefill.name)}",
          email: "${esc(prefill.email)}"
        },
        theme: { color: "#16a34a" },
        handler: function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_signature:  response.razorpay_signature
          }));
        },
        modal: {
          ondismiss: function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false, cancelled: true
            }));
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.on("payment.failed", function (r) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          success: false, error: r.error.description
        }));
      });
      rzp.open();
    };
  </script>
</body>
</html>`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckoutScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { listingId, dealId } = route.params;

  const [listing, setListing]           = useState<FSListing | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deal, setDeal]                 = useState<Deal | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [placing, setPlacing]             = useState(false);
  const [rzpHtml, setRzpHtml]             = useState<string | null>(null);
  const [rzpVisible, setRzpVisible]       = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const l = await fetchListing(listingId);
        if (cancelled) return;
        if (!l) { setFetchLoading(false); return; }
        setListing(l);

        if (!user?.uid) { setFetchLoading(false); return; }

        let foundDeal: Deal | null = null;

        console.log('[Checkout] listing.finalPrice:', l.finalPrice, '| listing.reservedFor:', l.reservedFor, '| user.uid:', user.uid);

        // ── Priority 1: listing carries final_price + reserved_for ───────────
        if (l.finalPrice && l.reservedFor === user.uid) {
          foundDeal = {
            id:            dealId ?? `listing-deal-${listingId}`,
            listingId,
            buyerId:       user.uid,
            sellerId:      l.seller?.id ?? '',
            originalPrice: l.price,
            offeredPrice:  l.finalPrice,
            finalPrice:    l.finalPrice,
            status:        'accepted',
            updatedAt:     Date.now(),
          };
          console.log('[Checkout] P1 hit — finalPrice from listing:', l.finalPrice);
        }

        // ── Priority 2: dedicated deal endpoint ──────────────────────────────
        // Runs independently of Priority 1 so we always get the freshest data.
        // Falls through (no throw) when the endpoint returns { deal: null }.
        if (!foundDeal) {
          try {
            const { deal: activeDeal } = await offersApi.activeDeal(listingId, user.uid);
            console.log('[Checkout] P2 activeDeal response:', activeDeal);
            if (activeDeal?.status === 'accepted' && activeDeal.amount) {
              foundDeal = {
                id:            activeDeal.id,
                listingId,
                buyerId:       user.uid,
                sellerId:      activeDeal.sellerId,
                originalPrice: l.price,
                offeredPrice:  activeDeal.amount,
                finalPrice:    activeDeal.amount,
                status:        'accepted',
                updatedAt:     new Date(activeDeal.createdAt).getTime(),
              };
            }
          } catch (e) {
            console.log('[Checkout] P2 failed:', e);
          }
        }

        // ── Priority 3: scan all listing offers (runs when P1+P2 both miss) ──
        // This path handles the case where the listing isn't yet marked reserved
        // (e.g. race condition) but the offer is already accepted in the DB.
        if (!foundDeal) {
          try {
            const { offers } = await offersApi.byListing(listingId);
            console.log('[Checkout] P3 all offers:', offers.map(o => ({ id: o.id, buyerId: o.buyerId, status: o.status, amount: o.amount })));
            const accepted = offers
              .filter(o => o.status === 'accepted' && o.buyerId === user.uid)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            if (accepted) {
              foundDeal = {
                id:            accepted.id,
                listingId,
                buyerId:       user.uid,
                sellerId:      accepted.sellerId,
                originalPrice: l.price,
                offeredPrice:  accepted.amount,
                finalPrice:    accepted.amount,
                status:        'accepted',
                updatedAt:     new Date(accepted.createdAt).getTime(),
              };
            }
          } catch (e) {
            console.log('[Checkout] P3 failed:', e);
          }
        }

        const resolvedPrice = resolvePrice(foundDeal, l);
        console.log('[Checkout] Deal:', foundDeal);
        console.log('[Checkout] Resolved Price:', resolvedPrice);

        if (!cancelled) setDeal(foundDeal);
      } catch {
        if (!cancelled) setListing(null);
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [listingId, dealId, user?.uid]);


  // ── Complete purchase (called after Razorpay success OR COD) ─────────────

  const completePurchase = useCallback(async (
    rzpPaymentId: string | null,
    rzpOrderId:   string | null,
    rzpSignature: string | null,
  ) => {
    if (!listing || !user?.uid) return;
    setPlacing(true);
    try {
      const { transactionId } = await listingsApi.buyNow(listing.id, {
        paymentMethod:     rzpPaymentId ? 'online' : 'cod',
        razorpayPaymentId: rzpPaymentId ?? undefined,
        razorpayOrderId:   rzpOrderId   ?? undefined,
        razorpaySignature: rzpSignature  ?? undefined,
      });
      navigation.replace('OrderTracking', { transactionId });
    } catch (e: any) {
      Alert.alert('Order Failed', e?.message ?? 'Could not place order. Please try again.');
      setPlacing(false);
    }
  }, [listing, user, navigation]);

  // ── Razorpay WebView message handler ─────────────────────────────────────

  const handleWebViewMessage = useCallback((e: WebViewMessageEvent) => {
    setRzpVisible(false);
    setRzpHtml(null);
    try {
      const data = JSON.parse(e.nativeEvent.data) as {
        success: boolean;
        cancelled?: boolean;
        error?: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      };
      if (data.success) {
        completePurchase(
          data.razorpay_payment_id ?? null,
          data.razorpay_order_id   ?? null,
          data.razorpay_signature  ?? null,
        );
      } else if (!data.cancelled) {
        Alert.alert('Payment Failed', data.error ?? 'Payment was not completed. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not process payment response.');
    }
  }, [completePurchase]);

  // ── Place Order button handler ────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!user?.uid) { Alert.alert('Login required', 'Please log in to place an order.'); return; }
    if (!listing) return;

    // Allow checkout if active OR reserved specifically for this buyer
    const isReservedForMe = listing.status === 'reserved' && listing.reservedFor === user.uid;
    if (listing.status !== 'active' && !isReservedForMe) {
      Alert.alert('Unavailable', 'This item is no longer available for purchase.');
      return;
    }

    // Resolve price via the single pricing resolver — deal.finalPrice wins over listing.price.
    // The backend enforces this independently; the frontend value is display/Razorpay only.
    const effectivePrice = resolvePrice(deal, listing);

    if (paymentMethod === 'cod') {
      completePurchase(null, null, null);
      return;
    }

    // Online: create Razorpay order at the effective (backend-verified) price
    setPlacing(true);
    try {
      const { orderId, keyId } = await razorpayApi.createOrder(
        effectivePrice * 100,
        `cb_${listing.id.slice(0, 16)}_${Date.now().toString(36)}`,
      );
      const html = buildRazorpayHtml(
        orderId,
        keyId,
        effectivePrice * 100,
        listing.title,
        { name: user.name || '', email: user.email || '' },
      );
      setRzpHtml(html);
      setRzpVisible(true);
    } catch (e: any) {
      Alert.alert('Payment Error', e?.message ?? 'Could not initiate payment. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Reserved-for-me means the seller accepted this buyer's offer — allow checkout
  const isReservedForMe  = listing.status === 'reserved' && listing.reservedFor === user?.uid;
  const isSoldOrReserved = (listing.status === 'sold' || listing.status === 'reserved') && !isReservedForMe;

  // Single pricing resolver — deal.finalPrice wins; backend enforces the same rule.
  const effectivePrice = resolvePrice(deal, listing);
  const hasNegotiation = deal?.status === 'accepted' && !!deal.finalPrice && deal.finalPrice < listing.price;

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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Product Card ─────────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>ITEM</Text>
          <View style={styles.productRow}>
            {listing.images?.[0] ? (
              <Image source={{ uri: listing.images[0] }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={28} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{listing.title}</Text>
              <View style={styles.productMeta}>
                <View style={[styles.conditionBadge, { backgroundColor: colors.success + '18' }]}>
                  <Text style={[styles.conditionText, { color: colors.success }]}>{listing.condition}</Text>
                </View>
                {listing.department ? (
                  <Text style={styles.deptText}>{listing.department}</Text>
                ) : null}
              </View>
              <Text style={styles.sellerText}>
                Sold by <Text style={{ color: colors.primary }}>{listing.seller?.name ?? 'Seller'}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Price Breakdown ──────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>PRICE</Text>

          {/* Negotiated deal banner */}
          {hasNegotiation && (
            <View style={styles.dealBanner}>
              <Ionicons name="pricetag" size={14} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dealBannerTitle}>Negotiated Price Applied</Text>
                <Text style={styles.dealBannerSub}>
                  Seller accepted your offer of ₹{effectivePrice.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>
                  Save ₹{(listing.price - effectivePrice).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>
              {paymentMethod === 'online' ? 'Total Payable' : 'Pay at Meetup'}
            </Text>
            <View style={styles.priceStack}>
              {hasNegotiation && (
                <Text style={styles.strikePrice}>
                  ₹{listing.price.toLocaleString('en-IN')}
                </Text>
              )}
              <Text style={[styles.totalValue, hasNegotiation && { color: colors.success }]}>
                ₹{effectivePrice.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {paymentMethod === 'cod' && (
            <Text style={styles.codNote}>
              Pay ₹{effectivePrice.toLocaleString('en-IN')} directly to the seller at meetup.
            </Text>
          )}
        </View>

        {/* ── Payment Method ───────────────────────────────────────────────── */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>

          {/* Online */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'online' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('online')}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'online' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentOptionRow}>
                <Ionicons name="flash" size={20} color={paymentMethod === 'online' ? colors.primary : colors.textTertiary} />
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'online' && { color: colors.primary },
                ]}>
                  UPI / Online Payment
                </Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              </View>
              <Text style={styles.paymentOptionSub}>
                Pay now via UPI, Debit/Credit Card, or Net Banking
              </Text>
            </View>
          </TouchableOpacity>

          {/* COD */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionSelected,
              { marginTop: spacing.sm, marginBottom: 0 },
            ]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentOptionRow}>
                <Ionicons name="cash-outline" size={20} color={paymentMethod === 'cod' ? colors.primary : colors.textTertiary} />
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'cod' && { color: colors.primary },
                ]}>
                  Cash on Delivery
                </Text>
              </View>
              <Text style={styles.paymentOptionSub}>
                Pay cash directly to the seller at the meetup
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Safety Note ──────────────────────────────────────────────────── */}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
          <Text style={styles.safetyText}>
            All transactions are protected by CampusBazaar's buyer guarantee.
            Never share payment details outside the app.
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Place Order Button ────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            (placing || isSoldOrReserved) && styles.btnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={placing || isSoldOrReserved}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={paymentMethod === 'online' ? 'lock-closed' : 'checkmark-circle'}
                size={18}
                color="#fff"
              />
              <Text style={styles.placeOrderText}>
                {isSoldOrReserved
                  ? 'Item No Longer Available'
                  : paymentMethod === 'online'
                    ? `Pay ₹${effectivePrice.toLocaleString('en-IN')}${hasNegotiation ? ' (Deal)' : ''} · Place Order`
                    : `Place Order · COD ₹${effectivePrice.toLocaleString('en-IN')}${hasNegotiation ? ' (Deal)' : ''}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Razorpay WebView Modal ────────────────────────────────────────── */}
      <Modal
        visible={rzpVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setRzpVisible(false);
          setRzpHtml(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
          <View style={styles.rzpHeader}>
            <TouchableOpacity
              onPress={() => {
                setRzpVisible(false);
                setRzpHtml(null);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.rzpHeaderTitle}>Secure Payment</Text>
            <Ionicons name="lock-closed" size={16} color={colors.success} />
          </View>

          {rzpHtml ? (
            <WebView
              source={{ html: rzpHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>
                    Loading payment...
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Full-screen placing overlay ───────────────────────────────────── */}
      {placing && !rzpVisible && (
        <View style={styles.placingOverlay}>
          <View style={styles.placingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.placingText}>Placing your order…</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },

  // Header
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
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },

  // Scroll
  scroll: {
    padding: spacing.xl,
    gap: spacing.md,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  // Product
  productRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productInfo: {
    flex: 1,
    gap: 6,
  },
  productTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  conditionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  deptText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  sellerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },

  // Deal / negotiation banner
  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '12',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  dealBannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.success,
  },
  dealBannerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  priceStack: {
    alignItems: 'flex-end',
    gap: 2,
  },
  strikePrice: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  // Price breakdown
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  priceLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  freeTag: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  freeTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  codNote: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },

  // Payment options
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentOptionContent: {
    flex: 1,
    gap: 4,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  paymentOptionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  paymentOptionSub: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  recommendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },

  // Safety note
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  safetyText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    lineHeight: 18,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  placeOrderText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },

  // Razorpay modal header
  rzpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  rzpHeaderTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Placing overlay
  placingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl ?? 32,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 180,
  },
  placingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
});
