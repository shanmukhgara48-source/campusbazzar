import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { sendOtp } from '../../services/authService';
import { collegesApi, ApiCollege } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

// ─── Fallback college list (shown when API unavailable) ───────────────────────
const FALLBACK_COLLEGES: ApiCollege[] = [
  { id: '1', name: 'VNR VJIET',                    domain: 'vnrvjiet.ac.in',     createdAt: '' },
  { id: '2', name: 'CBIT',                          domain: 'cbit.ac.in',         createdAt: '' },
  { id: '3', name: 'IIT Hyderabad',                 domain: 'iith.ac.in',         createdAt: '' },
  { id: '4', name: 'IIIT Hyderabad',                domain: 'iiit.ac.in',         createdAt: '' },
  { id: '5', name: 'MGIT',                          domain: 'mgit.ac.in',         createdAt: '' },
  { id: '6', name: 'GRIET',                         domain: 'griet.ac.in',        createdAt: '' },
  { id: '7', name: 'KMIT',                          domain: 'kmit.in',            createdAt: '' },
  { id: '8', name: 'Anurag University',             domain: 'anurag.edu.in',      createdAt: '' },
  { id: '9', name: 'Osmania University',            domain: 'osmania.ac.in',      createdAt: '' },
  { id: '10', name: 'JNTUH',                        domain: 'jntuh.ac.in',        createdAt: '' },
];

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label}</Text>
        {required && <Text style={f.star}>*</Text>}
      </View>
      {children}
      {!!error && (
        <View style={f.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
          <Text style={f.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const f = StyleSheet.create({
  wrap:     { marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  label:    { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  star:     { fontSize: typography.sizes.sm, color: colors.error, marginLeft: 3, fontWeight: typography.weights.bold },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText:{ fontSize: typography.sizes.xs, color: colors.error },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SignUpScreen({ navigation }: Props) {
  const [colleges, setColleges]           = useState<ApiCollege[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [fullName,        setFullName]    = useState('');
  const [rollNumber,      setRollNumber]  = useState('');
  const [selectedCollege, setSelectedCollege] = useState<ApiCollege | null>(null);
  const [collegeSearch,   setCollegeSearch]   = useState('');
  const [showPicker,      setShowPicker]  = useState(false);
  const [email,           setEmail]       = useState('');
  const [password,        setPassword]    = useState('');
  const [confirmPw,       setConfirmPw]   = useState('');
  const [showPw,          setShowPw]      = useState(false);
  const [showConfirmPw,   setShowConfirmPw] = useState(false);
  const [isLoading,       setIsLoading]   = useState(false);
  const [errors,          setErrors]      = useState<Record<string, string>>({});

  const rollRef    = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailRef   = useRef<React.ComponentRef<typeof TextInput>>(null);
  const pwRef      = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Load colleges from API
  useEffect(() => {
    collegesApi.list()
      .then(({ colleges: data }) => setColleges(data.length > 0 ? data : FALLBACK_COLLEGES))
      .catch(() => setColleges(FALLBACK_COLLEGES))
      .finally(() => setCollegesLoading(false));
  }, []);

  const getEmailDomain = (e: string) =>
    e.includes('@') ? e.split('@')[1]?.toLowerCase().trim() ?? '' : '';

  const clearError = (key: string) =>
    setErrors(prev => ({ ...prev, [key]: '' }));

  const filteredColleges = colleges.filter(c =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.domain.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2)
      e.fullName = 'Full name must be at least 2 characters.';

    if (!rollNumber.trim())
      e.rollNumber = 'Roll number is required.';

    if (!selectedCollege)
      e.college = 'Please select your college.';

    if (!email.trim()) {
      e.email = 'College email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address.';
    } else if (selectedCollege) {
      if (getEmailDomain(email) !== selectedCollege.domain.toLowerCase())
        e.email = `Email must end with @${selectedCollege.domain}`;
    }

    if (!password || password.length < 6)
      e.password = 'Password must be at least 6 characters.';

    if (!confirmPw)
      e.confirmPw = 'Please confirm your password.';
    else if (password !== confirmPw)
      e.confirmPw = 'Passwords do not match.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await sendOtp(email.trim());
      navigation.navigate('OTP', {
        email:        email.trim().toLowerCase(),
        fullName:     fullName.trim(),
        rollNumber:   rollNumber.trim(),
        collegeName:  selectedCollege!.name,
        collegeDomain:selectedCollege!.domain,
        password:     password,
      });
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const domainMatches =
    !!selectedCollege?.domain &&
    email.length > 0 &&
    getEmailDomain(email) === selectedCollege.domain;

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
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={s.backText}>Back to Login</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <View style={s.iconCircle}>
              <Ionicons name="person-add" size={38} color={colors.primary} />
            </View>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Register with your college email to get verified.</Text>
          </View>

          <View style={s.card}>

            {/* Full Name */}
            <Field label="Full Name" error={errors.fullName} required>
              <View style={[s.row, borderFor('fullName')]}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  style={s.input}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textTertiary}
                  value={fullName}
                  onChangeText={t => { setFullName(t); clearError('fullName'); }}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => rollRef.current?.focus()}
                />
              </View>
            </Field>

            {/* Roll Number */}
            <Field label="Roll Number" error={errors.rollNumber} required>
              <View style={[s.row, borderFor('rollNumber')]}>
                <Ionicons name="id-card-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  ref={rollRef}
                  style={s.input}
                  placeholder="e.g. 21CS3045"
                  placeholderTextColor={colors.textTertiary}
                  value={rollNumber}
                  onChangeText={t => { setRollNumber(t.toUpperCase()); clearError('rollNumber'); }}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onSubmitEditing={() => setShowPicker(true)}
                />
              </View>
            </Field>

            {/* College */}
            <Field label="College" error={errors.college} required>
              <TouchableOpacity
                style={[s.row, s.pickerRow, borderFor('college')]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={18} color={colors.textTertiary} style={s.icon} />
                {collegesLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                ) : selectedCollege ? (
                  <View style={s.pickerValue}>
                    <Text style={s.pickerValueName} numberOfLines={1}>{selectedCollege.name}</Text>
                    <Text style={s.pickerValueDomain}>@{selectedCollege.domain}</Text>
                  </View>
                ) : (
                  <Text style={s.pickerPlaceholder}>Select your college</Text>
                )}
                <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              {selectedCollege && (
                <View style={s.hint}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.info} />
                  <Text style={s.hintText}>Email must end with @{selectedCollege.domain}</Text>
                </View>
              )}
            </Field>

            {/* College Email */}
            <Field label="College Email ID" error={errors.email} required>
              <View style={[s.row, borderFor('email')]}>
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  ref={emailRef}
                  style={s.input}
                  placeholder={selectedCollege?.domain ? `name@${selectedCollege.domain}` : 'your.name@college.ac.in'}
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={t => { setEmail(t.trim()); clearError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => pwRef.current?.focus()}
                />
                {domainMatches && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                )}
              </View>
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password} required>
              <View style={[s.row, borderFor('password')]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  ref={pwRef}
                  style={s.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={t => { setPassword(t); clearError('password'); }}
                  secureTextEntry={!showPw}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirmPw} required>
              <View style={[s.row, borderFor('confirmPw')]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={s.icon} />
                <TextInput
                  ref={confirmRef}
                  style={s.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPw}
                  onChangeText={t => { setConfirmPw(t); clearError('confirmPw'); }}
                  secureTextEntry={!showConfirmPw}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
                <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                  <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </Field>

            {/* Send OTP button */}
            <TouchableOpacity
              style={[s.btn, isLoading && s.btnDisabled]}
              onPress={handleSendOtp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                  <Text style={s.btnText}>Send OTP & Continue</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.loginRow}>
              <Text style={s.loginPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.footer}>
            By creating an account you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* College picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select College</Text>
              <TouchableOpacity style={s.closeBtn} onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.searchRow}>
              <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={s.searchInput}
                placeholder="Search college..."
                placeholderTextColor={colors.textTertiary}
                value={collegeSearch}
                onChangeText={setCollegeSearch}
                autoFocus={showPicker}
              />
              {collegeSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCollegeSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredColleges}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={s.sep} />}
              renderItem={({ item }) => {
                const active = selectedCollege?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[s.collegeRow, active && s.collegeRowActive]}
                    onPress={() => {
                      setSelectedCollege(item);
                      setCollegeSearch('');
                      setShowPicker(false);
                      clearError('college');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={s.collegeInfo}>
                      <Text style={[s.collegeName, active && s.collegeNameActive]}>{item.name}</Text>
                      <Text style={s.collegeDomain}>@{item.domain}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 56, paddingBottom: spacing.xxxl },

  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  backText: { fontSize: typography.sizes.md, color: '#fff', fontWeight: typography.weights.medium },

  header:     { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  title:      { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.extrabold, color: '#fff', letterSpacing: -0.5 },
  subtitle:   { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs, textAlign: 'center', lineHeight: 20 },

  card: { backgroundColor: '#fff', borderRadius: borderRadius.xl, padding: spacing.xxl, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },

  row:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, backgroundColor: colors.background, minHeight: 52 },
  icon:  { marginRight: spacing.sm },
  input: { flex: 1, height: 52, fontSize: typography.sizes.md, color: colors.textPrimary },

  pickerRow:         { paddingVertical: spacing.sm, height: undefined },
  pickerPlaceholder: { flex: 1, fontSize: typography.sizes.md, color: colors.textTertiary },
  pickerValue:       { flex: 1 },
  pickerValueName:   { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  pickerValueDomain: { fontSize: typography.sizes.xs, color: colors.primary, marginTop: 1 },

  hint:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 2 },
  hintText: { fontSize: typography.sizes.xs, color: colors.info },

  btn:         { backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  btnDisabled: { opacity: 0.7 },
  btnText:     { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: '#fff' },

  loginRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl },
  loginPrompt: { fontSize: typography.sizes.md, color: colors.textSecondary },
  loginLink:   { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary, textDecorationLine: 'underline' },

  footer: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '80%', paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sheetTitle:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', margin: spacing.lg, paddingHorizontal: spacing.md, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.background, gap: spacing.sm, height: 44 },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary },

  collegeRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md },
  collegeRowActive: { backgroundColor: '#f0f7f3' },
  collegeInfo:      { flex: 1 },
  collegeName:      { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  collegeNameActive:{ color: colors.primary, fontWeight: typography.weights.semibold },
  collegeDomain:    { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 1 },

  sep: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.xl },
});
