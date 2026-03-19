import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useFavourites } from '../../context/FavouritesContext';
import { mockListings } from '../../data/mockData';
import { Listing } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'SavedItems'>;
};

export default function SavedItemsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useFavourites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (savedIds.size === 0) {
        setListings([]);
        setFetching(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'listings'));
        const fbListings = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
        // Merge Firebase + mock; Firebase wins on duplicate IDs
        const allById = new Map<string, Listing>();
        mockListings.forEach(l => allById.set(l.id, l));
        fbListings.forEach(l => allById.set(l.id, l));
        const saved = [...savedIds]
          .map(id => allById.get(id))
          .filter(Boolean) as Listing[];
        setListings(saved);
      } catch {
        const saved = [...savedIds]
          .map(id => mockListings.find(l => l.id === id))
          .filter(Boolean) as Listing[];
        setListings(saved);
      } finally {
        setFetching(false);
      }
    };
    fetchSaved();
  }, [savedIds]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{savedIds.size}</Text>
        </View>
      </View>

      {fetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any listing to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.images?.[0] ?? 'https://via.placeholder.com/80' }}
                style={styles.cardImg}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                <View style={styles.conditionRow}>
                  <View style={styles.conditionDot} />
                  <Text style={styles.cardCondition}>{item.condition}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggle(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="heart" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  countText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  list: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    paddingRight: spacing.lg,
    ...shadows.small,
  },
  cardImg: {
    width: 88,
    height: 88,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  cardPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  cardCondition: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
});
