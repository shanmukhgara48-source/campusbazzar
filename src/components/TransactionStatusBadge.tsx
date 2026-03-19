import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

// Accept any string — covers both TransactionStatus (types.ts) and TxStatus
// (transactionService.ts) which uses 'pending' instead of 'initiated'.
interface Props { status: string }

type BadgeConfig = { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string };

const CONFIG: Record<string, BadgeConfig> = {
  // TxStatus values (used in Firestore)
  pending:    { label: 'Pending',       icon: 'time-outline',            color: colors.warning, bg: '#fffbeb' },
  // Shared values
  accepted:   { label: 'Accepted',      icon: 'checkmark-circle-outline', color: colors.success, bg: '#f0fdf4' },
  meetup_set: { label: 'Meetup Set',    icon: 'location-outline',        color: colors.primary, bg: '#e8f5ee' },
  completed:  { label: 'Completed',     icon: 'checkmark-done-circle',   color: colors.success, bg: '#f0fdf4' },
  cancelled:  { label: 'Cancelled',     icon: 'close-circle-outline',    color: colors.error,   bg: '#fef2f2' },
  disputed:   { label: 'Disputed',      icon: 'warning-outline',         color: colors.warning, bg: '#fffbeb' },
  // TransactionStatus legacy values (types.ts)
  initiated:  { label: 'Request Sent',  icon: 'send-outline',            color: colors.info,    bg: '#eff6ff' },
  reserved:   { label: 'Reserved',      icon: 'bookmark-outline',        color: colors.accent,  bg: '#fffbeb' },
  // Offer statuses (shown via the same badge in some screens)
  rejected:   { label: 'Rejected',      icon: 'close-circle-outline',    color: colors.error,   bg: '#fef2f2' },
};

const FALLBACK: BadgeConfig = {
  label: 'Unknown',
  icon:  'help-circle-outline',
  color: colors.textTertiary,
  bg:    '#f5f5f5',
};

export default function TransactionStatusBadge({ status }: Props) {
  const config = CONFIG[status] ?? FALLBACK;
  console.log('[StatusBadge] status:', status, '→ config:', config.label);
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={13} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      borderRadius.full,
    paddingVertical:   4,
    paddingHorizontal: spacing.sm,
    gap:               4,
    alignSelf:         'flex-start',
  },
  label: {
    fontSize:   typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
