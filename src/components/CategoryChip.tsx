import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export default function CategoryChip({ label, icon, selected, onPress, color = colors.primary }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon as any}
        size={14}
        color={selected ? '#fff' : color}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: '#fff',
  },
});
