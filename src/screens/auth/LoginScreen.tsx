import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { signIn } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { refreshUser } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors(prev => ({ ...prev, [key]: '' }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!email.trim())
      e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Enter a valid email address.';
    if (!password.trim())
      e.password = 'Password is required.';
    else if (password.trim().length < 6)
      e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signIn(email, password);
      await refreshUser();
    } catch (e: any) {
      const msg = e.message ?? 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const borderFor = (key: string) => ({
    borderColor: errors[key] ? colors.error : colors.border,
  });

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
      style={s.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logo}>
            <View style={s.logoCircle}>
              <Ionicons name="storefront" size={44} color={colors.primary} />
            </View>
            <Text style={s.appName}>CampusBazaar</Text>
            <Text style={s.tagline}>Campus-only verified marketplace</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome Back!</Text>
            <Text style={s.cardSub}>Sign in with your college email to continue.</Text>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>College Email ID</Text>
              <View style={[s.row, borderFor('email')]}>
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  style={s.input}
                  placeholder="your.name@college.ac.in"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={t => { setEmail(t.trim()); clearError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {!!errors.email && (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
                  <Text style={s.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={s.label}>Password</Text>
              <View style={[s.row, borderFor('password')]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  style={s.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={t => { setPassword(t); clearError('password'); }}
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {!!errors.password && (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
                  <Text style={s.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={s.forgotWrap} onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your college email.')}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[s.btn, isLoading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <Text style={s.btnText}>Signing in…</Text>
              ) : (
                <>
                  <Text style={s.btnText}>Log In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* ── Create account link ── */}
            <View style={s.signUpRow}>
              <Text style={s.signUpPrompt}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.signUpLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Supported colleges */}
          <View style={s.colleges}>
            <Text style={s.collegesLabel}>Supported colleges</Text>
            <View style={s.badges}>
              {['IIT', 'NIT', 'BITS', 'VIT', 'DTU', 'IIIT'].map(c => (
                <View key={c} style={s.badge}>
                  <Text style={s.badgeText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={s.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: 72,
    paddingBottom: spacing.xxxl,
  },

  // Logo
  logo:       { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  appName: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  cardTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  // Field
  fieldWrap: { marginBottom: spacing.lg },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    height: 52,
  },
  icon:  { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText:{ fontSize: typography.sizes.xs, color: colors.error },

  // Forgot
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.xl, marginTop: -spacing.sm },
  forgotText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },

  // Login button
  btn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },

  // Create account link
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  signUpPrompt: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // Colleges strip
  colleges: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  collegesLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },

  footer: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
});
