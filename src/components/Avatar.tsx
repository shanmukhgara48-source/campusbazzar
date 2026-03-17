import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  name: string;
  uri?: string;
  size?: number;
  showOnline?: boolean;
}

export default function Avatar({ name, uri, size = 44, showOnline = false }: Props) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const fontSize = size * 0.38;

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.initials, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {showOnline && <View style={[styles.onlineDot, { borderRadius: 6 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#eee',
  },
  initials: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#fff',
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
