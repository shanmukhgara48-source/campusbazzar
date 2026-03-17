import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationStatus } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';

interface Props {
  status:   VerificationStatus;
  compact?: boolean;
}

const CONFIG: Record<VerificationStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  id_verified:    { label: 'ID Verified',      icon: 'shield-checkmark', color: colors.primary,  bg: '#e8f5ee' },
  email_verified: { label: 'Email Verified',   icon: 'checkmark-circle', color: colors.info,     bg: '#eff6ff' },
  pending_id:     { label: 'Pending Review',   icon: 'time-outline',     color: colors.warning,  bg: '#fffbeb' },
  unverified:     { label: 'Unverified',        icon: 'alert-circle',     color: colors.textTertiary, bg: colors.background },
};

export default function VerificationBadge({ status, compact = false }: Props) {
  const { label, icon, color, bg } = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, compact && styles.compact]}>
      <Ionicons name={icon} size={compact ? 12 : 14} color={color} />
      {!compact && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   borderRadius.full,
    paddingVertical:  3,
    paddingHorizontal: spacing.sm,
    gap:            4,
    alignSelf:      'flex-start',
  },
  compact: {
    paddingHorizontal: 5,
    paddingVertical:   3,
  },
  label: {
    fontSize:   typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});
