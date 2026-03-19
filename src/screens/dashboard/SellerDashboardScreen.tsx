import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useSellerOffers, acceptOffer, rejectOffer, FSOffer } from '../../services/offerService';
import { useSellerListings, FSListing } from '../../services/listingService';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SellerDashboard'>;
};

export default function SellerDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'offers'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // offerId being actioned

  const { offers: myOffers, loading: offersLoading } = useSellerOffers(user?.uid);
  const { listings: myListings, loading: listingsLoading } = useSellerListings(user?.uid ?? '');

  const pendingOffers  = myOffers.filter(o => o.status === 'pending');
  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings   = myListings.filter(l => l.status === 'sold');
  const totalRevenue   = soldListings.reduce((sum, l) => sum + l.price, 0);

  const TABS = ['overview', 'listings', 'offers'] as const;

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = (offer: FSOffer) => {
    Alert.alert(
      'Accept Offer',
      `Accept ₹${offer.offerPrice.toLocaleString('en-IN')} from ${offer.buyerName} for "${offer.listingTitle}"?\n\nThis will mark the item as sold and reject all other pending offers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading(offer.id);
            try {
              const txId = await acceptOffer(offer, user?.name || user?.email || 'Seller');
              Alert.alert(
                'Offer Accepted!',
                `Transaction created. Coordinate the meetup with ${offer.buyerName}.`,
                [{ text: 'OK' }],
              );
              console.log('[SellerDashboard] offer accepted, txId:', txId);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not accept offer. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = (offer: FSOffer) => {
    Alert.alert(
      'Decline Offer',
      `Decline ₹${offer.offerPrice.toLocaleString('en-IN')} from ${offer.buyerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(offer.id);
            try {
              await rejectOffer(offer);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not decline offer.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Dashboard</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Stats Banner */}
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.statsBanner}>
        <View style={styles.statsGrid}>
          {[
            { icon: 'bag-check',  label: 'Sold',          value: soldListings.length,                           color: '#4ade80' },
            { icon: 'list',       label: 'Active',         value: activeListings.length,                         color: '#60a5fa' },
            { icon: 'pricetag',   label: 'Pending Offers', value: pendingOffers.length,                          color: '#fbbf24' },
            { icon: 'cash',       label: 'Revenue',        value: `₹${totalRevenue.toLocaleString('en-IN')}`,    color: '#34d399' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statItemValue}>{s.value}</Text>
              <Text style={styles.statItemLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'offers'
                ? `Offers${pendingOffers.length > 0 ? ` (${pendingOffers.length})` : ''}`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.performanceCard}>
              {[
                { label: 'Active Listings',  value: activeListings.length,                   icon: 'list',     color: colors.primary },
                { label: 'Pending Offers',   value: pendingOffers.length,                    icon: 'pricetag', color: colors.accent },
                { label: 'Items Sold',       value: soldListings.length,                     icon: 'bag-check',color: colors.success },
                { label: 'Total Listings',   value: myListings.length,                       icon: 'storefront', color: colors.info },
              ].map((item, i) => (
                <View key={i} style={styles.perfItem}>
                  <View style={[styles.perfIconBox, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.perfValue}>{item.value}</Text>
                  <Text style={styles.perfLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Offers</Text>
            {offersLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : myOffers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No offers yet</Text>
              </View>
            ) : (
              myOffers.slice(0, 3).map(offer => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  loading={actionLoading === offer.id}
                  onAccept={() => handleAccept(offer)}
                  onReject={() => handleReject(offer)}
                />
              ))
            )}
            {myOffers.length > 3 && (
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => setActiveTab('offers')}>
                <Text style={styles.seeAllText}>See all {myOffers.length} offers</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Listings ─────────────────────────────────────────────────────── */}
        {activeTab === 'listings' && (
          <View>
            {listingsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xxxl }} />
            ) : myListings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No listings yet</Text>
                <Text style={styles.emptySubtitle}>Post your first item to start selling</Text>
              </View>
            ) : (
              myListings.map(listing => <ListingRow key={listing.id} listing={listing} />)
            )}
          </View>
        )}

        {/* ── Offers ───────────────────────────────────────────────────────── */}
        {activeTab === 'offers' && (
          <View>
            {offersLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xxxl }} />
            ) : myOffers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No offers yet</Text>
              </View>
            ) : (
              myOffers.map(offer => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  loading={actionLoading === offer.id}
                  onAccept={() => handleAccept(offer)}
                  onReject={() => handleReject(offer)}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ListingRow({ listing }: { listing: FSListing }) {
  const statusColor = listing.status === 'active' ? colors.success : colors.warning;
  return (
    <View style={styles.listingRow}>
      <Image source={{ uri: listing.images[0] }} style={styles.listingRowImg} />
      <View style={styles.listingRowInfo}>
        <Text style={styles.listingRowTitle} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.listingRowPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
        <View style={[styles.listingStatusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.listingStatusText, { color: statusColor }]}>{listing.status}</Text>
        </View>
      </View>
    </View>
  );
}

function OfferRow({
  offer, loading, onAccept, onReject,
}: {
  offer: FSOffer;
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const statusColors: Record<string, string> = {
    pending:  colors.warning,
    accepted: colors.success,
    rejected: colors.error,
  };
  const statusColor = statusColors[offer.status] ?? colors.textTertiary;
  const discount    = Math.round(((offer.askingPrice - offer.offerPrice) / offer.askingPrice) * 100);

  return (
    <View style={styles.offerCard}>
      <View style={styles.offerCardTop}>
        <Text style={styles.offerListing} numberOfLines={1}>{offer.listingTitle}</Text>
        <View style={[styles.offerStatusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.offerStatusText, { color: statusColor }]}>{offer.status}</Text>
        </View>
      </View>

      {!!offer.message && (
        <Text style={styles.offerMessage} numberOfLines={2}>"{offer.message}"</Text>
      )}

      <View style={styles.offerPriceRow}>
        <View style={styles.offerPriceCol}>
          <Text style={styles.offerPriceLabel}>Offer</Text>
          <Text style={[styles.offerPriceValue, { color: colors.primary }]}>
            ₹{offer.offerPrice.toLocaleString('en-IN')}
          </Text>
          {discount > 0 && (
            <Text style={styles.discountText}>{discount}% below ask</Text>
          )}
        </View>
        <View style={styles.offerPriceCol}>
          <Text style={styles.offerPriceLabel}>Asking</Text>
          <Text style={styles.offerPriceValue}>₹{offer.askingPrice.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.offerPriceCol}>
          <Text style={styles.offerPriceLabel}>From</Text>
          <Text style={styles.offerPriceValue} numberOfLines={1}>{offer.buyerName}</Text>
        </View>
      </View>

      {offer.status === 'pending' && (
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        ) : (
          <View style={styles.offerActions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={onReject}>
              <Ionicons name="close" size={16} color={colors.error} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  headerTitle:    { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  statsBanner:    { padding: spacing.xl },
  statsGrid:      { flexDirection: 'row', gap: spacing.md },
  statItem:       { flex: 1, alignItems: 'center', gap: 3 },
  statItemValue:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: '#fff', marginTop: spacing.xs },
  statItemLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab:            { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText:        { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textTertiary, textTransform: 'capitalize' },
  tabTextActive:  { color: colors.primary, fontWeight: typography.weights.semibold },
  tabContent:     { padding: spacing.xl },
  sectionTitle: {
    fontSize: typography.sizes.lg, fontWeight: typography.weights.bold,
    color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.lg,
  },
  performanceCard: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.small,
  },
  perfItem:       { width: '50%', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  perfIconBox:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  perfValue:      { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  perfLabel:      { fontSize: typography.sizes.xs, color: colors.textTertiary, textAlign: 'center' },
  emptyState:     { alignItems: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.md },
  emptyTitle:     { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  emptySubtitle:  { fontSize: typography.sizes.sm, color: colors.textTertiary },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, gap: spacing.xs,
  },
  seeAllText:     { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },
  // Listing row
  listingRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm,
    gap: spacing.md, ...shadows.small,
  },
  listingRowImg:      { width: 60, height: 60, borderRadius: borderRadius.sm },
  listingRowInfo:     { flex: 1 },
  listingRowTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold,
    color: colors.textPrimary, marginBottom: 3,
  },
  listingRowPrice: {
    fontSize: typography.sizes.md, fontWeight: typography.weights.bold,
    color: colors.primary, marginBottom: 4,
  },
  listingStatusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  listingStatusText:  { fontSize: 10, fontWeight: typography.weights.semibold, textTransform: 'capitalize' },
  // Offer card
  offerCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadows.small,
  },
  offerCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  offerListing:   { flex: 1, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginRight: spacing.sm },
  offerStatusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  offerStatusText:  { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'capitalize' },
  offerMessage:   { fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.md },
  offerPriceRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  offerPriceCol:  { flex: 1 },
  offerPriceLabel:{ fontSize: typography.sizes.xs, color: colors.textTertiary, marginBottom: 2 },
  offerPriceValue:{ fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  discountText:   { fontSize: 10, color: colors.success, marginTop: 1 },
  offerActions:   { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: {
    flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: spacing.xs,
  },
  acceptBtnText:  { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: '#fff' },
  declineBtn: {
    flex: 1, backgroundColor: colors.error + '15', borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.error + '40',
  },
  declineBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.error },
});
