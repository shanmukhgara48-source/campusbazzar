import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings, mockOffers, mockReviews, CURRENT_USER_ID } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SellerDashboard'>;
};

export default function SellerDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'offers' | 'reviews'>('overview');

  const myListings = mockListings.filter(l => l.sellerId === CURRENT_USER_ID);
  const myOffers = mockOffers.filter(o => o.sellerId === CURRENT_USER_ID);
  const myReviews = mockReviews.filter(r => r.sellerId === CURRENT_USER_ID);
  const totalViews = myListings.reduce((sum, l) => sum + l.views, 0);
  const totalRevenue = myListings
    .filter(l => l.status === 'sold')
    .reduce((sum, l) => sum + l.price, 0);

  const TABS = ['overview', 'listings', 'offers', 'reviews'] as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
            { icon: 'bag-check', label: 'Total Sales', value: user?.totalSales || 0, color: '#4ade80' },
            { icon: 'eye', label: 'Total Views', value: totalViews, color: '#60a5fa' },
            { icon: 'star', label: 'Avg Rating', value: user?.rating.toFixed(1) || '0', color: '#fbbf24' },
            { icon: 'cash', label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN') || '0'}`, color: '#34d399' },
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.performanceCard}>
              {[
                { label: 'Active Listings', value: myListings.filter(l => l.status === 'active').length, icon: 'list', color: colors.primary },
                { label: 'Pending Offers', value: myOffers.filter(o => o.status === 'pending').length, icon: 'pricetag', color: colors.accent },
                { label: 'Avg Response', value: user?.responseTime || 'N/A', icon: 'time', color: colors.info },
                { label: 'Member Since', value: user?.memberSince || 'N/A', icon: 'calendar', color: colors.success },
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

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {[
              { icon: 'eye', text: `Your listings got ${totalViews} total views`, time: 'Today', color: colors.info },
              { icon: 'star', text: `You have ${myReviews.length} verified reviews`, time: 'This month', color: colors.gold },
              { icon: 'pricetag', text: `${myOffers.length} offers received on your listings`, time: 'This week', color: colors.accent },
            ].map((item, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.color} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>{item.text}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <View>
            {myListings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No listings yet</Text>
                <Text style={styles.emptySubtitle}>Post your first item to start selling</Text>
              </View>
            ) : (
              myListings.map(listing => (
                <View key={listing.id} style={styles.listingRow}>
                  <Image source={{ uri: listing.images[0] }} style={styles.listingRowImg} />
                  <View style={styles.listingRowInfo}>
                    <Text style={styles.listingRowTitle} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.listingRowPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
                    <View style={styles.listingRowMeta}>
                      <Ionicons name="eye-outline" size={12} color={colors.textTertiary} />
                      <Text style={styles.listingRowMetaText}>{listing.views} views</Text>
                      <View style={[styles.listingStatusBadge, {
                        backgroundColor: listing.status === 'active' ? colors.success + '20' : colors.warning + '20'
                      }]}>
                        <Text style={[styles.listingStatusText, {
                          color: listing.status === 'active' ? colors.success : colors.warning
                        }]}>
                          {listing.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.listingRowMenu}>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <View>
            {myOffers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No offers yet</Text>
              </View>
            ) : (
              myOffers.map(offer => {
                const listing = mockListings.find(l => l.id === offer.listingId);
                const statusColors: Record<string, string> = {
                  pending: colors.warning,
                  accepted: colors.success,
                  declined: colors.error,
                  countered: colors.info,
                };
                return (
                  <View key={offer.id} style={styles.offerCard}>
                    <View style={styles.offerCardTop}>
                      <Text style={styles.offerListing} numberOfLines={1}>{listing?.title}</Text>
                      <View style={[styles.offerStatusBadge, { backgroundColor: statusColors[offer.status] + '20' }]}>
                        <Text style={[styles.offerStatusText, { color: statusColors[offer.status] }]}>
                          {offer.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.offerPriceRow}>
                      <View>
                        <Text style={styles.offerPriceLabel}>Offer Amount</Text>
                        <Text style={styles.offerPrice}>₹{offer.amount.toLocaleString('en-IN')}</Text>
                      </View>
                      {offer.counterAmount && (
                        <View>
                          <Text style={styles.offerPriceLabel}>Counter Offer</Text>
                          <Text style={[styles.offerPrice, { color: colors.accent }]}>
                            ₹{offer.counterAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.offerPriceLabel}>Asking Price</Text>
                        <Text style={styles.offerPrice}>₹{listing?.price.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                    {offer.status === 'pending' && (
                      <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.acceptBtn}>
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.counterBtn}>
                          <Text style={styles.counterBtnText}>Counter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn}>
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <View>
            {myReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No reviews yet</Text>
              </View>
            ) : (
              myReviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewAvatar} />
                    <View>
                      <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                      <View style={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={13}
                            color={i < review.rating ? colors.gold : colors.textTertiary}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statsBanner: {
    padding: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statItemValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#fff',
    marginTop: spacing.xs,
  },
  statItemLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  tabContent: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  performanceCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.small,
  },
  perfItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  perfIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  perfLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.small,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityInfo: { flex: 1 },
  activityText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.small,
  },
  listingRowImg: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  listingRowInfo: { flex: 1 },
  listingRowTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  listingRowPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 3,
  },
  listingRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listingRowMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  listingStatusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  listingStatusText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  listingRowMenu: {
    padding: spacing.xs,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  offerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  offerListing: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  offerStatusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  offerStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'capitalize',
  },
  offerPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  offerPriceLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  offerPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  counterBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  counterBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  declineBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
