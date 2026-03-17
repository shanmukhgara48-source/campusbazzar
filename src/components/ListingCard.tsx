import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../types';
import { colors, shadows, borderRadius } from '../theme';
import VerifiedBadge from './VerifiedBadge';
import StarRating from './StarRating';

interface Props {
  listing: Listing;
  onPress: () => void;
  style?: object;
}

const CONDITION_COLORS: Record<string, string> = {
  'New': '#22c55e',
  'Like New': '#3b82f6',
  'Good': '#f59e0b',
  'Fair': '#f97316',
  'Poor': '#ef4444',
};

export default function ListingCard({ listing, onPress, style }: Props) {
  const discount = listing.originalPrice
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : null;

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: listing.images[0] }} style={styles.image} />
        {listing.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={[styles.conditionDot, { backgroundColor: CONDITION_COLORS[listing.condition] ?? '#ccc' }]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{listing.price.toLocaleString()}</Text>
          {listing.originalPrice && (
            <Text style={styles.originalPrice}>₹{listing.originalPrice.toLocaleString()}</Text>
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={[styles.conditionChip, { backgroundColor: CONDITION_COLORS[listing.condition] + '22' }]}>
            <Text style={[styles.conditionText, { color: CONDITION_COLORS[listing.condition] }]}>
              {listing.condition}
            </Text>
          </View>
          <View style={styles.viewsRow}>
            <Ionicons name="eye-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.views}>{listing.views}</Text>
          </View>
        </View>
        <View style={styles.sellerRow}>
          <View style={styles.sellerInfo}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarInitial}>{listing.seller.name[0]}</Text>
            </View>
            <Text style={styles.sellerName} numberOfLines={1}>{listing.seller.name.split(' ')[0]}</Text>
            {listing.seller.isVerified && <VerifiedBadge size="sm" />}
          </View>
          <StarRating rating={listing.seller.rating} size={11} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#eee',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  featuredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  conditionDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  body: {
    padding: 10,
    gap: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionChip: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  views: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  avatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sellerName: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
});
