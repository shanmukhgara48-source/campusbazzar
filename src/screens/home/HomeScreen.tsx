import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, FlatList, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreenNavigationProp } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { ItemCategory } from '../../types';
import { useListings, FSListing } from '../../services/listingService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.xl * 2 - spacing.md) / 2;

type Props = { navigation: HomeScreenNavigationProp };
type SortOption = 'latest' | 'price_asc' | 'price_desc';

const CATEGORIES: { label: string; icon: string; value: ItemCategory | 'All' }[] = [
  { label: 'All',         icon: 'grid-outline',       value: 'All' },
  { label: 'Books',       icon: 'book-outline',        value: 'Books' },
  { label: 'Laptops',     icon: 'laptop-outline',      value: 'Laptops' },
  { label: 'Calculators', icon: 'calculator-outline',  value: 'Calculators' },
  { label: 'Electronics', icon: 'headset-outline',     value: 'Electronics' },
  { label: 'Other',       icon: 'cube-outline',        value: 'Other' },
];

function conditionColor(condition: string): string {
  const map: Record<string, string> = {
    'New':      colors.success,
    'Like New': '#16a34a',
    'Good':     colors.accent,
    'Fair':     colors.warning,
    'Poor':     colors.error,
  };
  return map[condition] || colors.textTertiary;
}

function ListingCard({
  listing, onPress,
}: { listing: FSListing; onPress: () => void }) {
  const price = listing.price ?? 0;
  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={cardStyles.cardImageContainer}>
        {listing.images?.[0] ? (
          <Image source={{ uri: listing.images[0] }} style={cardStyles.cardImage} />
        ) : (
          <View style={[cardStyles.cardImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border }]}>
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
          </View>
        )}
        <View style={[cardStyles.conditionDot, { backgroundColor: conditionColor((listing as any).condition) }]} />
      </View>
      <View style={cardStyles.cardBody}>
        <Text style={[cardStyles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={[cardStyles.cardPrice, { color: colors.primary }]}>
          ₹{price.toLocaleString('en-IN')}
        </Text>
        <View style={cardStyles.cardMeta}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[cardStyles.cardMetaText, { color: colors.textTertiary }]}>{listing.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card:               { width: CARD_WIDTH, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.small },
  cardImageContainer: { position: 'relative' },
  cardImage:          { width: '100%', height: 140 },
  conditionDot:       { position: 'absolute', bottom: spacing.sm, right: spacing.sm, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
  cardBody:           { padding: spacing.md },
  cardTitle:          { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.xs, lineHeight: 18 },
  cardPrice:          { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  cardMeta:           { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  cardMetaText:       { fontSize: typography.sizes.xs },
});

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [search, setSearch]                       = useState('');
  const [selectedCategory, setSelectedCategory]   = useState<ItemCategory | 'All'>('All');
  const [filterVisible, setFilterVisible]         = useState(false);
  const [minPrice, setMinPrice]                   = useState('');
  const [maxPrice, setMaxPrice]                   = useState('');
  const [sort, setSort]                           = useState<SortOption>('latest');
  const [appliedMin, setAppliedMin]               = useState<number | null>(null);
  const [appliedMax, setAppliedMax]               = useState<number | null>(null);
  const [appliedSort, setAppliedSort]             = useState<SortOption>('latest');

  const category = selectedCategory === 'All' ? undefined : selectedCategory;
  const { listings, loading } = useListings(category);

  const filtered = listings
    .filter(l => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
      const matchMin    = appliedMin === null || l.price >= appliedMin;
      const matchMax    = appliedMax === null || l.price <= appliedMax;
      return matchSearch && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (appliedSort === 'price_asc')  return a.price - b.price;
      if (appliedSort === 'price_desc') return b.price - a.price;
      return 0;
    });

  const applyFilters = useCallback(() => {
    setAppliedMin(minPrice ? Number(minPrice) : null);
    setAppliedMax(maxPrice ? Number(maxPrice) : null);
    setAppliedSort(sort);
    setFilterVisible(false);
  }, [minPrice, maxPrice, sort]);

  const resetFilters = useCallback(() => {
    setMinPrice(''); setMaxPrice(''); setSort('latest');
    setAppliedMin(null); setAppliedMax(null); setAppliedSort('latest');
    setFilterVisible(false);
  }, []);

  const hasActiveFilter = appliedMin !== null || appliedMax !== null || appliedSort !== 'latest';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Find great deals on campus
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
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
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: hasActiveFilter ? colors.primary : colors.surface }]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color={hasActiveFilter ? colors.textInverse : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryPill,
              { backgroundColor: selectedCategory === cat.value ? colors.primary : colors.surface },
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Ionicons
              name={cat.icon as any}
              size={15}
              color={selectedCategory === cat.value ? colors.textInverse : colors.textSecondary}
            />
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === cat.value ? colors.textInverse : colors.textSecondary },
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {selectedCategory === 'All' ? 'Recent Listings' : selectedCategory}
              </Text>
              <Text style={[styles.countText, { color: colors.textTertiary }]}>{filtered.length} items</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No listings found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>Try a different search or category</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterVisible(false)} />
        <View style={[styles.filterSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.filterHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Filter & Sort</Text>

          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Price Range (₹)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.priceInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
              placeholder="Min"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={[styles.priceDash, { color: colors.textTertiary }]}>—</Text>
            <TextInput
              style={[styles.priceInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
              placeholder="Max"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>

          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sort By</Text>
          {([
            ['latest',     'Latest First'],
            ['price_asc',  'Lowest Price'],
            ['price_desc', 'Highest Price'],
          ] as [SortOption, string][]).map(([val, label]) => (
            <TouchableOpacity key={val} style={styles.sortOption} onPress={() => setSort(val)}>
              <View style={[styles.radio, { borderColor: sort === val ? colors.primary : colors.border }]}>
                {sort === val && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
              <Text style={[
                styles.sortLabel,
                { color: sort === val ? colors.textPrimary : colors.textSecondary },
                sort === val && styles.sortLabelActive,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterActions}>
            <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetFilters}>
              <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={applyFilters}>
              <Text style={[styles.applyBtnText, { color: colors.textInverse }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1 },
  header:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  greeting:            { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  headerSubtitle:      { fontSize: typography.sizes.sm, marginTop: 2 },
  notifBtn:            { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...shadows.small },
  searchContainer:     { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.sm },
  searchBar:           { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, height: 48, gap: spacing.sm, ...shadows.small },
  searchInput:         { flex: 1, fontSize: typography.sizes.sm },
  filterBtn:           { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', ...shadows.small },
  categoriesScroll:    { flexGrow: 0 },
  categoriesContainer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, paddingTop: 4, gap: 8, alignItems: 'center' },
  categoryPill:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  categoryText:        { fontSize: 13, fontWeight: '600' },
  center:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent:         { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row:                 { gap: spacing.md, marginBottom: spacing.md },
  sectionHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingTop: spacing.sm },
  sectionTitle:        { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  countText:           { fontSize: typography.sizes.sm },
  emptyState:          { alignItems: 'center', paddingVertical: spacing.xxxl * 2 },
  emptyTitle:          { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginTop: spacing.md },
  emptySubtitle:       { fontSize: typography.sizes.sm, marginTop: spacing.xs },
  modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  filterSheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  filterHandle:        { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  filterTitle:         { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: spacing.lg },
  filterLabel:         { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginBottom: spacing.sm, marginTop: spacing.md },
  priceRow:            { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  priceInput:          { flex: 1, height: 44, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: typography.sizes.md },
  priceDash:           { fontSize: typography.sizes.lg },
  sortOption:          { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.md },
  radio:               { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:            { width: 10, height: 10, borderRadius: 5 },
  sortLabel:           { fontSize: typography.sizes.md },
  sortLabelActive:     { fontWeight: typography.weights.semibold },
  filterActions:       { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  resetBtn:            { flex: 1, height: 48, borderRadius: borderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetBtnText:        { fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  applyBtn:            { flex: 2, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  applyBtnText:        { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
});
