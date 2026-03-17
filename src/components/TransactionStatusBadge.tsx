import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionStatus } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';

interface Props { status: TransactionStatus }

const CONFIG: Record<TransactionStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  initiated:  { label: 'Request Sent',  icon: 'send-outline',           color: colors.info,    bg: '#eff6ff' },
  accepted:   { label: 'Accepted',      icon: 'checkmark-circle-outline', color: colors.success, bg: '#f0fdf4' },
  reserved:   { label: 'Reserved',      icon: 'bookmark-outline',        color: colors.accent,  bg: '#fffbeb' },
  meetup_set: { label: 'Meetup Set',    icon: 'location-outline',        color: colors.primary, bg: '#e8f5ee' },
  completed:  { label: 'Completed',     icon: 'checkmark-done-circle',   color: colors.success, bg: '#f0fdf4' },
  cancelled:  { label: 'Cancelled',     icon: 'close-circle-outline',    color: colors.error,   bg: '#fef2f2' },
  disputed:   { label: 'Disputed',      icon: 'warning-outline',         color: colors.warning, bg: '#fffbeb' },
};

export default function TransactionStatusBadge({ status }: Props) {
  const { label, icon, color, bg } = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
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
