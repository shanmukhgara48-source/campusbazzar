import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { Listing, ItemCategory } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;
};

const CATEGORIES: { label: string; icon: string; value: ItemCategory | 'All' }[] = [
  { label: 'All', icon: 'grid-outline', value: 'All' },
  { label: 'Books', icon: 'book-outline', value: 'Books' },
  { label: 'Laptops', icon: 'laptop-outline', value: 'Laptops' },
  { label: 'Calculators', icon: 'calculator-outline', value: 'Calculators' },
  { label: 'Electronics', icon: 'headset-outline', value: 'Electronics' },
  { label: 'Other', icon: 'cube-outline', value: 'Other' },
];

const conditionColor: Record<string, string> = {
  'New': colors.success,
  'Like New': '#16a34a',
  'Good': colors.accent,
  'Fair': colors.warning,
  'Poor': colors.error,
};

function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const discount = listing.originalPrice
    ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.cardImageContainer}>
        <Image source={{ uri: listing.images[0] }} style={styles.cardImage} />
        {listing.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% off</Text>
          </View>
        )}
        <View style={[styles.conditionDot, { backgroundColor: conditionColor[listing.condition] || colors.textTertiary }]} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.cardPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
        {listing.originalPrice && (
          <Text style={styles.cardOriginalPrice}>₹{listing.originalPrice.toLocaleString('en-IN')}</Text>
        )}
        <View style={styles.cardMeta}>
          <Ionicons name="eye-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.cardMetaText}>{listing.views}</Text>
          <View style={[styles.conditionPill, { backgroundColor: (conditionColor[listing.condition] || colors.textTertiary) + '20' }]}>
            <Text style={[styles.conditionPillText, { color: conditionColor[listing.condition] || colors.textTertiary }]}>
              {listing.condition}
            </Text>
          </View>
        </View>
        <View style={styles.cardSeller}>
          <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
          <Text style={styles.sellerName} numberOfLines={1}>{listing.seller.name.split(' ')[0]}</Text>
          {listing.seller.isVerified && (
            <Ionicons name="checkmark-circle" size={12} color={colors.verified} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>('All');

  const filtered = mockListings.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || l.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const featured = mockListings.filter(l => l.isFeatured);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSubtitle}>Find great deals on campus</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, laptops, calculators..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryPill, selectedCategory === cat.value && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Ionicons
                name={cat.icon as any}
                size={15}
                color={selectedCategory === cat.value ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.categoryText, selectedCategory === cat.value && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Banner */}
        {search === '' && selectedCategory === 'All' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Listings</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredContainer}>
              {featured.map(listing => (
                <TouchableOpacity
                  key={listing.id}
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
                  activeOpacity={0.92}
                >
                  <Image source={{ uri: listing.images[0] }} style={styles.featuredImage} />
                  <View style={styles.featuredOverlay} />
                  <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.featuredPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Listings Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'Recent Listings' : selectedCategory}
            </Text>
            <Text style={styles.countText}>{filtered.length} items</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
                />
              ))}
            </View>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    gap: spacing.sm,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    ...shadows.small,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  countText: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  featuredContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  featuredCard: {
    width: 220,
    height: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  featuredTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
    marginBottom: 2,
  },
  featuredPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.accentLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  featuredText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  conditionDot: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  cardOriginalPrice: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  conditionPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  conditionPillText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  cardSeller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sellerName: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
