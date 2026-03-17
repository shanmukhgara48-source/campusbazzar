import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportReason } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface Props {
  visible:    boolean;
  targetType: 'listing' | 'user';
  targetName: string;
  onClose:    () => void;
  onSubmit:   (reason: ReportReason, description: string) => void;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam',             label: 'Spam or misleading' },
  { value: 'fake_item',        label: 'Fake or counterfeit item' },
  { value: 'wrong_price',      label: 'Incorrect price' },
  { value: 'prohibited_item',  label: 'Prohibited item' },
  { value: 'inappropriate',    label: 'Inappropriate content' },
  { value: 'scam',             label: 'Scam or fraud attempt' },
  { value: 'other',            label: 'Other' },
];

export default function ReportModal({ visible, targetType, targetName, onClose, onSubmit }: Props) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription]       = useState('');

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please select a reason for your report.');
      return;
    }
    onSubmit(selectedReason, description);
    setSelectedReason(null);
    setDescription('');
    onClose();
    Alert.alert('Report Submitted', 'Our team will review it within 24 hours. Thank you for keeping CampusBazaar safe.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Report {targetType === 'listing' ? 'Listing' : 'User'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Reporting: <Text style={styles.targetName}>{targetName}</Text>
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Reason</Text>
            {REASONS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[styles.option, selectedReason === r.value && styles.optionSelected]}
                onPress={() => setSelectedReason(r.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, selectedReason === r.value && styles.radioSelected]}>
                  {selectedReason === r.value && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, selectedReason === r.value && styles.optionTextSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Ionicons name="flag" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Report</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              False reports may result in account restrictions.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: colors.overlay,
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:         spacing.xxl,
    maxHeight:       '85%',
    ...shadows.large,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    spacing.sm,
  },
  title: {
    fontSize:   typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  subtitle: {
    fontSize:     typography.sizes.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
  },
  targetName: {
    fontWeight: typography.weights.semibold,
    color:      colors.textPrimary,
  },
  sectionLabel: {
    fontSize:     typography.sizes.xs,
    fontWeight:   typography.weights.semibold,
    color:        colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  spacing.sm,
    marginTop:     spacing.sm,
  },
  option: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        spacing.md,
    borderRadius:   borderRadius.sm,
    marginBottom:   spacing.xs,
    backgroundColor: colors.background,
    gap:            spacing.md,
  },
  optionSelected: {
    backgroundColor: '#e8f5ee',
    borderWidth:     1,
    borderColor:     colors.primary,
  },
  radio: {
    width:          20,
    height:         20,
    borderRadius:   10,
    borderWidth:    2,
    borderColor:    colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize:   typography.sizes.md,
    color:      colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: typography.weights.semibold,
    color:      colors.primary,
  },
  textArea: {
    borderWidth:   1.5,
    borderColor:   colors.border,
    borderRadius:  borderRadius.md,
    padding:       spacing.md,
    fontSize:      typography.sizes.md,
    color:         colors.textPrimary,
    minHeight:     90,
    backgroundColor: colors.background,
    marginBottom:  spacing.xl,
  },
  submitBtn: {
    backgroundColor: colors.error,
    borderRadius:    borderRadius.md,
    height:          52,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginBottom:    spacing.md,
  },
  submitBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  disclaimer: {
    fontSize:  typography.sizes.xs,
    color:     colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
