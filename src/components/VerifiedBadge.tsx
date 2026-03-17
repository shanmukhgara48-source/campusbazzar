import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props {
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({ size = 'md' }: Props) {
  const isSmall = size === 'sm';
  return (
    <View style={[styles.container, isSmall && styles.containerSm]}>
      <Ionicons name="checkmark-circle" size={isSmall ? 11 : 13} color={colors.primary} />
      <Text style={[styles.text, isSmall && styles.textSm]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5ee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  containerSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  textSm: {
    fontSize: 10,
  },
});
