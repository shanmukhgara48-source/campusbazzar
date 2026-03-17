import React, { useState, useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated, Alert,
  Linking, Modal, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface Props {
  meetupLocation?: string;
}

const EMERGENCY_NUMBER = '112';
const SAFETY_TIPS = [
  'Meet only in public, well-lit areas on campus',
  'Tell a friend or roommate where you are going',
  'Verify the buyer / seller\'s profile before meeting',
  'Keep your phone charged before the meetup',
  'Trust your instincts — cancel if something feels off',
];

export default function SOSButton({ meetupLocation }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  };

  const handleSOS = () => {
    Alert.alert(
      '🆘 Emergency',
      `Call emergency services (${EMERGENCY_NUMBER})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => Linking.openURL(`tel:${EMERGENCY_NUMBER}`),
        },
      ],
    );
  };

  const handleShareLocation = () => {
    const message = meetupLocation
      ? `I'm at a CampusBazaar meetup — location: ${meetupLocation}. Check on me if I don't respond.`
      : `I'm at a CampusBazaar meetup. Check on me if I don't respond.`;
    Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
  };

  return (
    <>
      <View style={styles.row}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.sosBtn}
            onPress={handleSOS}
            onPressIn={startPulse}
            activeOpacity={0.85}
          >
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.sosBtnText}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareLocation} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
          <Text style={styles.shareBtnText}>Share Location</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tipsBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          <Text style={styles.tipsBtnText}>Safety Tips</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.tipsTitle}>Campus Safety Tips</Text>
            </View>
            {SAFETY_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:           spacing.sm,
    alignItems:    'center',
    marginTop:     spacing.md,
  },
  sosBtn: {
    backgroundColor: colors.error,
    borderRadius:    borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing.xs,
    ...shadows.medium,
  },
  sosBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  shareBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    borderWidth:     1.5,
    borderColor:     colors.primary,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.sm,
  },
  shareBtnText: {
    fontSize:   typography.sizes.sm,
    color:      colors.primary,
    fontWeight: typography.weights.semibold,
  },
  tipsBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    borderWidth:     1.5,
    borderColor:     colors.accent,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.sm,
  },
  tipsBtnText: {
    fontSize:   typography.sizes.sm,
    color:      colors.accent,
    fontWeight: typography.weights.semibold,
  },
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.xl,
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius:    borderRadius.xl,
    padding:         spacing.xxl,
    width:           '100%',
    ...shadows.large,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    marginBottom:  spacing.xl,
  },
  tipsTitle: {
    fontSize:   typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.md,
    marginBottom:  spacing.md,
  },
  tipBullet: {
    width:           24,
    height:          24,
    borderRadius:    12,
    backgroundColor: '#e8f5ee',
    alignItems:      'center',
    justifyContent:  'center',
  },
  tipNumber: {
    fontSize:   typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color:      colors.primary,
  },
  tipText: {
    flex:       1,
    fontSize:   typography.sizes.sm,
    color:      colors.textSecondary,
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       spacing.md,
  },
  closeBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
