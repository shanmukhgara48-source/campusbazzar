import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { colors, typography, spacing } from '../theme';

export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue:         isOnline ? -50 : 0,
      useNativeDriver: true,
      tension:         80,
      friction:        10,
    }).start();
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>No internet — showing cached data</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          999,
    backgroundColor: colors.error,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: spacing.sm,
    gap:             spacing.xs,
  },
  text: {
    color:      '#fff',
    fontSize:   typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
