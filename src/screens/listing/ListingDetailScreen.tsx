import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings, mockReviews } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ListingDetail'>;
  route: RouteProp<HomeStackParamList, 'ListingDetail'>;
};

const conditionColor: Record<string, string> = {
  'New': colors.success,
  'Like New': '#16a34a',
  'Good': colors.accent,
  'Fair': colors.warning,
  'Poor': colors.error,
};

export default function ListingDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { listingId } = route.params;
  const listing = mockListings.find(l => l.id === listingId);
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Text>Listing not found</Text>
      </View>
    );
  }

  const sellerReviews = mockReviews.filter(r => r.sellerId === listing.sellerId);
  const isOwnListing = user?.id === listing.sellerId;
  const discount = listing.originalPrice
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {listing.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* Top Controls */}
          <View style={[styles.galleryTopBar, { top: insets.top + spacing.sm }]}>
            <TouchableOpacity style={styles.galleryBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.galleryTopRight}>
              <TouchableOpacity style={styles.galleryBtn} onPress={() => setIsSaved(!isSaved)}>
                <Ionicons
                  name={isSaved ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isSaved ? colors.error : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn}>
                <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dot indicators */}
          {listing.images.length > 1 && (
            <View style={styles.dotRow}>
              {listing.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentImage && styles.dotActive]} />
              ))}
            </View>
          )}

          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% off</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleSection}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{listing.category}</Text>
              </View>
              <View style={[styles.conditionBadge, { backgroundColor: conditionColor[listing.condition] + '20' }]}>
                <View style={[styles.conditionDot, { backgroundColor: conditionColor[listing.condition] }]} />
                <Text style={[styles.conditionText, { color: conditionColor[listing.condition] }]}>
                  {listing.condition}
                </Text>
              </View>
            </View>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{listing.price.toLocaleString('en-IN')}</Text>
              {listing.originalPrice && (
                <Text style={styles.originalPrice}>₹{listing.originalPrice.toLocaleString('en-IN')}</Text>
              )}
              {discount && (
                <View style={styles.savingBadge}>
                  <Text style={styles.savingText}>Save ₹{(listing.originalPrice! - listing.price).toLocaleString('en-IN')}</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.metaText}>{listing.views} views</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.metaText}>{listing.department}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.metaText}>{listing.createdAt}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <TouchableOpacity
              style={styles.sellerCard}
              onPress={() => navigation.navigate('Ratings', { userId: listing.sellerId })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{listing.seller.name}</Text>
                  {listing.seller.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
                  )}
                </View>
                <Text style={styles.sellerCollege}>{listing.seller.college} · {listing.seller.department}</Text>
                <View style={styles.sellerStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.statText}>{listing.seller.rating} ({listing.seller.reviewCount})</Text>
                  </View>
                  <Text style={styles.statSep}>·</Text>
                  <Text style={styles.statText}>{listing.seller.totalSales} sales</Text>
                  <Text style={styles.statSep}>·</Text>
                  <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                  <Text style={styles.statText}>{listing.seller.responseTime}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Recent Reviews */}
          {sellerReviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Ratings', { userId: listing.sellerId })}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {sellerReviews.slice(0, 2).map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                      <View style={styles.starsRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={12}
                            color={i < review.rating ? colors.gold : colors.textTertiary}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {!isOwnListing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => Alert.alert('Message', 'Chat feature available in Messages tab')}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.offerBtn}
            onPress={() => navigation.navigate('Offer', { listingId: listing.id })}
          >
            <Text style={styles.offerBtnText}>Make Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => navigation.navigate('Meetup', { listingId: listing.id })}
          >
            <Text style={styles.buyBtnText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwnListing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.markSoldBtn}>
            <Text style={styles.markSoldText}>Mark as Sold</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#000',
  },
  galleryImage: {
    width,
    height: 320,
    resizeMode: 'cover',
  },
  galleryTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  galleryTopRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  galleryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  dotRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },
  discountBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  discountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
    paddingTop: spacing.xl,
  },
  titleSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    gap: 4,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.extrabold,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.sizes.lg,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  savingBadge: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  savingText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: spacing.md,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  sellerCollege: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  statSep: {
    color: colors.textTertiary,
    fontSize: typography.sizes.xs,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  reviewMeta: {},
  reviewerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewComment: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    ...shadows.large,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  messageBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  offerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  offerBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  buyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  buyBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  editBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  markSoldBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  markSoldText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
});
