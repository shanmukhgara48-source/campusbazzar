import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { takeAndCompressPhoto, pickAndCompressImage } from '../../services/imageService';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'IDVerification'>;
};

type Step = 'intro' | 'id_card' | 'selfie' | 'review' | 'submitted';

const STEPS = [
  { key: 'id_card', title: 'Upload College ID',  icon: 'card-outline',         desc: 'Front side of your student identity card' },
  { key: 'selfie',  title: 'Take a Selfie',       icon: 'camera-outline',       desc: 'A clear photo of your face (no filters)' },
  { key: 'review',  title: 'Review & Submit',     icon: 'checkmark-circle-outline', desc: 'Confirm and submit for verification' },
];

export default function IDVerificationScreen({ navigation }: Props) {
  const [step, setStep]           = useState<Step>('intro');
  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const pickIdCard = async () => {
    const img = await pickAndCompressImage();
    if (img) { setIdCardUri(img.uri); setStep('selfie'); }
  };

  const takeSelfie = async () => {
    const img = await takeAndCompressPhoto();
    if (img) { setSelfieUri(img.uri); setStep('review'); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API submission
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setStep('submitted');
  };

  if (step === 'submitted') {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-done-circle" size={56} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Submitted!</Text>
        <Text style={styles.successSubtitle}>
          Our team will verify your ID within 24 hours.{'\n'}
          You'll get a notification once it's approved.
        </Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.banner}>
        <Ionicons name="shield-checkmark" size={40} color="#fff" />
        <Text style={styles.bannerTitle}>Student ID Verification</Text>
        <Text style={styles.bannerSubtitle}>
          Get the ID Verified badge and build trust with other students
        </Text>
      </LinearGradient>

      {step === 'intro' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What you'll need</Text>
          {STEPS.map((s, i) => (
            <View key={s.key} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
          <View style={styles.noteBox}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
            <Text style={styles.noteText}>
              Your ID is only used for verification and is never shared publicly.
            </Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('id_card')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Start Verification</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {step === 'id_card' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upload College ID Card</Text>
          <Text style={styles.sectionSubtitle}>Take a clear photo of the front of your student ID</Text>
          {idCardUri ? (
            <Image source={{ uri: idCardUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="card-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.uploadPlaceholderText}>No image selected</Text>
            </View>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={pickIdCard} activeOpacity={0.85}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={async () => {
              const img = await takeAndCompressPhoto();
              if (img) { setIdCardUri(img.uri); setStep('selfie'); }
            }} activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={styles.outlineBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'selfie' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Take a Selfie</Text>
          <Text style={styles.sectionSubtitle}>Face the camera directly in good lighting</Text>
          {selfieUri ? (
            <Image source={{ uri: selfieUri }} style={styles.selfiePreview} resizeMode="cover" />
          ) : (
            <View style={[styles.uploadPlaceholder, styles.selfieShape]}>
              <Ionicons name="person-circle-outline" size={64} color={colors.textTertiary} />
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={takeSelfie} activeOpacity={0.85}>
            <Ionicons name="camera" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'review' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Review & Submit</Text>
          <View style={styles.reviewRow}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>College ID</Text>
              {idCardUri && <Image source={{ uri: idCardUri }} style={styles.reviewThumb} resizeMode="cover" />}
              <TouchableOpacity onPress={() => setStep('id_card')}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Selfie</Text>
              {selfieUri && <Image source={{ uri: selfieUri }} style={[styles.reviewThumb, styles.selfieThumb]} resizeMode="cover" />}
              <TouchableOpacity onPress={() => setStep('selfie')}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Submit for Verification</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { paddingBottom: 40 },
  banner: {
    padding:    spacing.xxl,
    alignItems: 'center',
    gap:        spacing.sm,
    paddingTop: spacing.xxxl,
  },
  bannerTitle: {
    fontSize:   typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color:      '#fff',
  },
  bannerSubtitle: {
    fontSize:  typography.sizes.sm,
    color:     'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    margin:          spacing.xl,
    borderRadius:    borderRadius.xl,
    padding:         spacing.xxl,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize:     typography.sizes.lg,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize:     typography.sizes.sm,
    color:        colors.textSecondary,
    marginBottom: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing.md,
    marginBottom:  spacing.lg,
  },
  stepNum: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepNumText: {
    color:      '#fff',
    fontSize:   typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  stepInfo: { flex: 1 },
  stepTitle: {
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color:      colors.textPrimary,
  },
  stepDesc: {
    fontSize:  typography.sizes.sm,
    color:     colors.textSecondary,
    marginTop: 2,
  },
  noteBox: {
    flexDirection:  'row',
    gap:            spacing.sm,
    backgroundColor: '#e8f5ee',
    borderRadius:   borderRadius.sm,
    padding:        spacing.md,
    marginBottom:   spacing.xl,
    alignItems:     'flex-start',
  },
  noteText: {
    flex:      1,
    fontSize:  typography.sizes.sm,
    color:     colors.primary,
    lineHeight: 20,
  },
  uploadPlaceholder: {
    height:          180,
    backgroundColor: colors.background,
    borderRadius:    borderRadius.md,
    borderWidth:     2,
    borderColor:     colors.border,
    borderStyle:     'dashed',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
    marginBottom:    spacing.xl,
  },
  uploadPlaceholderText: {
    fontSize: typography.sizes.sm,
    color:    colors.textTertiary,
  },
  selfieShape: {
    height:       200,
    borderRadius: 100,
    width:        200,
    alignSelf:    'center',
  },
  preview: {
    height:       180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  selfiePreview: {
    width:        200,
    height:       200,
    borderRadius: 100,
    alignSelf:    'center',
    marginBottom: spacing.xl,
  },
  btnRow: {
    flexDirection: 'row',
    gap:           spacing.md,
  },
  outlineBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    borderWidth:     1.5,
    borderColor:     colors.primary,
    borderRadius:    borderRadius.md,
    paddingVertical: spacing.md,
  },
  outlineBtnText: {
    color:      colors.primary,
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    height:          52,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  reviewRow: {
    flexDirection: 'row',
    gap:           spacing.xl,
    marginBottom:  spacing.xl,
  },
  reviewItem: {
    flex:       1,
    alignItems: 'center',
    gap:        spacing.sm,
  },
  reviewLabel: {
    fontSize:   typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color:      colors.textSecondary,
  },
  reviewThumb: {
    width:        '100%',
    height:       100,
    borderRadius: borderRadius.sm,
  },
  selfieThumb: {
    borderRadius: 50,
  },
  retakeText: {
    fontSize:  typography.sizes.sm,
    color:     colors.primary,
    fontWeight: typography.weights.semibold,
  },
  successContainer: {
    flex:            1,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.xxl,
  },
  successCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: '#e8f5ee',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.xl,
  },
  successTitle: {
    fontSize:     typography.sizes.xxl,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    fontSize:     typography.sizes.md,
    color:        colors.textSecondary,
    textAlign:    'center',
    lineHeight:   24,
    marginBottom: spacing.xxxl,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius:    borderRadius.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical:   spacing.md,
  },
  doneBtnText: {
    color:      '#fff',
    fontSize:   typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
