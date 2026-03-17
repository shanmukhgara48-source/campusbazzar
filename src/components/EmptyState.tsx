import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

interface Props {
  icon?:         keyof typeof Ionicons.glyphMap;
  title:         string;
  subtitle?:     string;
  actionLabel?:  string;
  onAction?:     () => void;
  secondaryLabel?: string;
  onSecondary?:  () => void;
}

export default function EmptyState({
  icon = 'search-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={44} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryLabel && onSecondary && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl * 2,
  },
  iconCircle: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: '#e8f5ee',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.xl,
  },
  title: {
    fontSize:   typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
    textAlign:  'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize:   typography.sizes.sm,
    color:      colors.textSecondary,
    textAlign:  'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    marginBottom:    spacing.sm,
  },
  primaryBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  secondaryBtn: {
    borderWidth:  1.5,
    borderColor:  colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical:   spacing.md,
  },
  secondaryBtnText: {
    color:      colors.textSecondary,
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
});
