import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { sendOtp, verifyOtp } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
  route: RouteProp<AuthStackParamList, 'OTP'>;
};

const RESEND_COOLDOWN = 60; // seconds

export default function OTPScreen({ navigation, route }: Props) {
  const { email, fullName, rollNumber, collegeName, password } = route.params;
  const { refreshUser } = useAuth();

  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [timer, setTimer]           = useState(RESEND_COOLDOWN);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs                   = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits.');
      return;
    }
    setIsVerifying(true);
    try {
      await verifyOtp(email, otpString, fullName, password, rollNumber);
      await refreshUser();
      // AuthContext will detect the user and navigate to MainTab automatically
    } catch (e: any) {
      const msg = e?.message ?? 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', msg);
      // Clear OTP on failure so user can retry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      await sendOtp(email);
      setOtp(['', '', '', '', '', '']);
      setTimer(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
      Alert.alert('OTP Sent', `A new code has been sent to ${email}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every(d => d !== '');

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
            <View style={styles.collegePill}>
              <Ionicons name="school-outline" size={13} color={colors.primary} />
              <Text style={styles.collegePillText}>{collegeName}</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Enter OTP</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit      ? styles.otpInputFilled   : null,
                    isVerifying ? styles.otpInputDisabled : null,
                  ]}
                  value={digit}
                  onChangeText={value => handleOtpChange(value.slice(-1), index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                />
              ))}
            </View>

            {/* Verify button */}
            <TouchableOpacity
              style={[styles.verifyBtn, (!isOtpComplete || isVerifying) && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={!isOtpComplete || isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify & Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Resend */}
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={isResending}>
                  {isResending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.resendText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.info} />
              <Text style={styles.infoText}>
                Check your spam folder if you don't see the email. The code expires in 5 minutes.
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:  { flex: 1 },
  flex:      { flex: 1 },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },

  backBtn: { position: 'absolute', top: 60, left: spacing.xl, zIndex: 10 },

  header:     { alignItems: 'center', marginBottom: spacing.xxxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  title:      { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: '#fff', marginBottom: spacing.sm },
  subtitle:   { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  emailText:  { fontWeight: typography.weights.semibold, color: '#fff' },
  collegePill:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 5, marginTop: spacing.sm },
  collegePillText: { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },

  card: { backgroundColor: '#fff', borderRadius: borderRadius.xl, padding: spacing.xxl, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },

  cardLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },

  otpRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl },
  otpInput:         { width: 46, height: 56, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.sm, textAlign: 'center', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary, backgroundColor: colors.background },
  otpInputFilled:   { borderColor: colors.primary, backgroundColor: '#f0f7f3' },
  otpInputDisabled: { opacity: 0.6 },

  verifyBtn:         { backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText:     { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: '#fff' },

  resendRow: { alignItems: 'center', marginBottom: spacing.lg },
  timerText: { fontSize: typography.sizes.sm, color: colors.textTertiary },
  resendText:{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: borderRadius.sm, padding: spacing.sm, gap: spacing.xs },
  infoText:{ fontSize: typography.sizes.xs, color: colors.info, flex: 1, lineHeight: 17 },
});
