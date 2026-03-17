import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const CATEGORIES = [
  {
    title: 'Academic Integrity',
    icon: 'school-outline' as const,
    color: '#ef4444',
    items: [
      'Exam papers (past or current)',
      'Answer keys or solved papers',
      'Assignments or project files for submission',
      'Plagiarised academic work',
    ],
  },
  {
    title: 'Illegal Items',
    icon: 'ban-outline' as const,
    color: '#dc2626',
    items: [
      'Drugs, narcotics, or controlled substances',
      'Weapons of any kind',
      'Stolen goods',
      'Counterfeit currency or documents',
      'Fake identity documents',
    ],
  },
  {
    title: 'Harmful Content',
    icon: 'warning-outline' as const,
    color: '#f59e0b',
    items: [
      'Alcohol or tobacco products',
      'Pornographic or adult material',
      'Content promoting violence or hate',
    ],
  },
  {
    title: 'Digital & Services',
    icon: 'laptop-outline' as const,
    color: '#8b5cf6',
    items: [
      'Cracked / pirated software',
      'Stolen accounts or credentials',
      'Services promoting cheating',
      'Spyware or malicious software',
    ],
  },
  {
    title: 'Other Restricted Items',
    icon: 'alert-circle-outline' as const,
    color: '#6b7280',
    items: [
      'Animals or live organisms',
      'Perishable food items',
      'Prescription medicines',
      'Financial instruments (bonds, shares)',
    ],
  },
];

export default function ProhibitedItemsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="shield-outline" size={40} color="#ef4444" />
        </View>
        <Text style={styles.heroTitle}>Prohibited Items</Text>
        <Text style={styles.heroSubtitle}>
          Listing any of the following items will result in immediate account suspension and may be reported to campus authorities.
        </Text>
      </View>

      {CATEGORIES.map(cat => (
        <View key={cat.title} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${cat.color}18` }]}>
              <Ionicons name={cat.icon} size={20} color={cat.color} />
            </View>
            <Text style={[styles.cardTitle, { color: cat.color }]}>{cat.title}</Text>
          </View>
          {cat.items.map(item => (
            <View key={item} style={styles.itemRow}>
              <Ionicons name="close-circle" size={16} color={cat.color} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.reportBox}>
        <Ionicons name="flag-outline" size={20} color={colors.primary} />
        <Text style={styles.reportText}>
          Spotted a prohibited listing? Use the <Text style={styles.bold}>Report</Text> button on any listing to alert our moderation team.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.xl },
  hero: {
    alignItems:   'center',
    marginBottom: spacing.xl,
    gap:          spacing.sm,
  },
  heroIcon: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: '#fef2f2',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.sm,
  },
  heroTitle: {
    fontSize:   typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  heroSubtitle: {
    fontSize:  typography.sizes.sm,
    color:     colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius:    borderRadius.xl,
    padding:         spacing.xl,
    marginBottom:    spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
    marginBottom:  spacing.md,
  },
  iconCircle: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.sm,
    marginBottom:  spacing.sm,
    paddingLeft:   spacing.xs,
  },
  itemText: {
    flex:      1,
    fontSize:  typography.sizes.sm,
    color:     colors.textSecondary,
    lineHeight: 20,
  },
  reportBox: {
    flexDirection:  'row',
    gap:            spacing.md,
    backgroundColor: '#e8f5ee',
    borderRadius:   borderRadius.md,
    padding:        spacing.lg,
    alignItems:     'flex-start',
  },
  reportText: {
    flex:      1,
    fontSize:  typography.sizes.sm,
    color:     colors.textSecondary,
    lineHeight: 20,
  },
  bold: { fontWeight: typography.weights.semibold, color: colors.primary },
});
