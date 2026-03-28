import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '../types';
import { useFavourites } from '../context/FavouritesContext';
import { colors } from '../theme';

interface Props {
  listing: Listing;
  size?:   number;
  style?:  StyleProp<ViewStyle>;
}

export default function FavouriteButton({ listing, size = 22, style }: Props) {
  const { isFavourite, toggle } = useFavourites();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const active = isFavourite(listing.id);

  const handlePress = async () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
    await toggle(listing.id);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={size}
          color={active ? colors.error : colors.textTertiary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});
