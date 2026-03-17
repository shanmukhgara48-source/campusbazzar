import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, size = 16, interactive = false, onRate }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.floor(rating);
        const half = !filled && star - 0.5 <= rating;
        const iconName = filled ? 'star' : half ? 'star-half' : 'star-outline';
        if (interactive && onRate) {
          return (
            <TouchableOpacity key={star} onPress={() => onRate(star)}>
              <Ionicons name={iconName as any} size={size} color={colors.accent} />
            </TouchableOpacity>
          );
        }
        return <Ionicons key={star} name={iconName as any} size={size} color={colors.accent} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
