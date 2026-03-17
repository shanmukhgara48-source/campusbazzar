import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WishlistItem, ItemCategory } from '../../types';
import { getWishlist, addWishlistItem, removeWishlistItem } from '../../services/storageService';
import EmptyState from '../../components/EmptyState';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const CATEGORIES: ItemCategory[] = ['Books', 'Laptops', 'Calculators', 'Electronics', 'Other'];

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export default function WishlistScreen() {
  const [items, setItems]       = useState<WishlistItem[]>([]);
  const [modalOpen, setModal]   = useState(false);
  const [keyword, setKeyword]   = useState('');
  const [category, setCategory] = useState<ItemCategory | undefined>();
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    getWishlist().then(setItems);
  }, []);

  const handleAdd = async () => {
    if (!keyword.trim()) {
      Alert.alert('Add a keyword', 'e.g. "Mouse", "Data Structures book"');
      return;
    }
    const item: WishlistItem = {
      id:         newId(),
      userId:     'me',
      keyword:    keyword.trim(),
      category,
      maxPrice:   maxPrice ? parseFloat(maxPrice) : undefined,
      createdAt:  new Date().toISOString(),
      matchCount: 0,
    };
    await addWishlistItem(item);
    setItems(prev => [item, ...prev]);
    setKeyword('');
    setCategory(undefined);
    setMaxPrice('');
    setModal(false);
  };

  const handleRemove = async (id: string) => {
    await removeWishlistItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Alert</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No wishlist alerts"
            subtitle={"Add a keyword and we'll notify you when a matching listing appears."}
            actionLabel="Add Alert"
            onAction={() => setModal(true)}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.wishCard}>
            <View style={styles.wishIcon}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.wishInfo}>
              <Text style={styles.wishKeyword}>{item.keyword}</Text>
              <View style={styles.wishMeta}>
                {item.category && (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{item.category}</Text>
                  </View>
                )}
                {item.maxPrice && (
                  <View style={[styles.metaChip, styles.priceChip]}>
                    <Text style={[styles.metaChipText, styles.priceChipText]}>
                      Under ₹{item.maxPrice.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
              {item.matchCount > 0 && (
                <Text style={styles.matchCount}>{item.matchCount} match{item.matchCount !== 1 ? 'es' : ''} found</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Alert</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Keyword *</Text>
            <TextInput
              style={styles.input}
              placeholder={'e.g. "Mouse under 500", "GATE books"'}
              placeholderTextColor={colors.textTertiary}
              value={keyword}
              onChangeText={setKeyword}
            />
            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(prev => prev === c ? undefined : c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Max price ₹ (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor={colors.textTertiary}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         spacing.xl,
    paddingTop:      spacing.xl,
  },
  headerTitle: {
    fontSize:   typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  addBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.xs,
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
  },
  addBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  list:          { padding: spacing.xl, gap: spacing.md },
  emptyContainer: { flex: 1 },
  wishCard: {
    flexDirection:   'row',
    backgroundColor: '#fff',
    borderRadius:    borderRadius.xl,
    padding:         spacing.lg,
    alignItems:      'center',
    gap:             spacing.md,
    ...shadows.small,
  },
  wishIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#e8f5ee',
    alignItems:      'center',
    justifyContent:  'center',
  },
  wishInfo:    { flex: 1, gap: spacing.xs },
  wishKeyword: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  wishMeta:    { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor:  colors.background,
    borderRadius:     borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderWidth:      1,
    borderColor:      colors.border,
  },
  priceChip:     { backgroundColor: '#e8f5ee', borderColor: colors.primary },
  metaChipText:  { fontSize: typography.sizes.xs, color: colors.textSecondary },
  priceChipText: { color: colors.primary, fontWeight: typography.weights.semibold },
  matchCount:    { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.semibold },
  overlay:       { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:         spacing.xxl,
    ...shadows.large,
  },
  sheetHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    spacing.xl,
  },
  sheetTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  fieldLabel: {
    fontSize:     typography.sizes.xs,
    fontWeight:   typography.weights.semibold,
    color:        colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  spacing.sm,
    marginTop:     spacing.md,
  },
  input: {
    borderWidth:   1.5,
    borderColor:   colors.border,
    borderRadius:  borderRadius.md,
    height:        48,
    paddingHorizontal: spacing.lg,
    fontSize:      typography.sizes.md,
    color:         colors.textPrimary,
    backgroundColor: colors.background,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth:       1.5,
    borderColor:       colors.border,
    borderRadius:      borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
    backgroundColor:   colors.background,
  },
  chipActive:     { borderColor: colors.primary, backgroundColor: '#e8f5ee' },
  chipText:       { fontSize: typography.sizes.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    height:          52,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginTop:       spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
