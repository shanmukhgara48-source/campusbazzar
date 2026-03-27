import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useBuyerTransactions, useSellerTransactions } from '../../services/transactionService';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'TransactionHistory'>;
};

type Tab = 'purchases' | 'sales';

const STATUS_COLOR: Record<string, string> = {
  pending:    colors.warning,
  accepted:   colors.info,
  meetup_set: colors.accent,
  completed:  colors.success,
  cancelled:  colors.error,
};

export default function TransactionHistoryScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('purchases');

  const { transactions: purchases, loading: buyLoading } = useBuyerTransactions(user?.uid ?? '');
  const { transactions: sales,    loading: sellLoading } = useSellerTransactions(user?.uid ?? '');

  const data    = tab === 'purchases' ? purchases : sales;
  const loading = tab === 'purchases' ? buyLoading : sellLoading;

  const formatDate = (val: unknown) => {
    if (!val) return '';
    const d = (val as any)?.toDate?.() ?? new Date(val as string);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['purchases', 'sales'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
            <View style={[styles.tabBadge, tab === t && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === t && styles.tabBadgeTextActive]}>
                {t === 'purchases' ? purchases.length : sales.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLOR[item.status] ?? colors.textTertiary;
            return (
              <View style={styles.card}>
                {item.listingImage ? (
                  <Image source={{ uri: item.listingImage }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.noImage]}>
                    <Ionicons name="bag-outline" size={24} color={colors.textTertiary} />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.listingTitle}</Text>
                  <Text style={styles.cardAmount}>₹{item.amount?.toLocaleString('en-IN')}</Text>
                  <Text style={styles.cardParty}>
                    {tab === 'purchases'
                      ? `Seller: ${item.sellerName}`
                      : `Buyer: ${item.buyerName}`}
                  </Text>
                  <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status?.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={52} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No {tab} yet</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'purchases'
                  ? 'Items you buy will appear here.'
                  : 'Items you sell will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  backBtn:           { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:       { flex: 1, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, textAlign: 'center' },
  tabs:              { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab:               { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:         { borderBottomColor: colors.primary },
  tabText:           { fontSize: typography.sizes.md, color: colors.textSecondary, fontWeight: typography.weights.medium },
  tabTextActive:     { color: colors.primary, fontWeight: typography.weights.bold },
  tabBadge:          { backgroundColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: 7, paddingVertical: 1 },
  tabBadgeActive:    { backgroundColor: colors.primary + '20' },
  tabBadgeText:      { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.semibold },
  tabBadgeTextActive:{ color: colors.primary },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:              { padding: spacing.xl, gap: spacing.md },
  card:              { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.small, gap: spacing.md },
  thumb:             { width: 64, height: 64, borderRadius: borderRadius.md, flexShrink: 0 },
  noImage:           { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cardInfo:          { flex: 1 },
  cardTitle:         { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: 2 },
  cardAmount:        { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginBottom: 2 },
  cardParty:         { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 2 },
  cardDate:          { fontSize: typography.sizes.xs, color: colors.textTertiary },
  statusBadge:       { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText:        { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, textTransform: 'capitalize' },
  empty:             { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.md },
  emptyTitle:        { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  emptySubtitle:     { fontSize: typography.sizes.sm, color: colors.textTertiary, textAlign: 'center' },
});
