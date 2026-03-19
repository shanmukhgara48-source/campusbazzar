import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { signUp } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

// ─────────────────────────────────────────────
// College list with email domain mapping
// ─────────────────────────────────────────────
interface College {
  name: string;
  short: string;
  domain: string;
}

const COLLEGES: College[] = [
  // ── Premier institutes ──────────────────────────────────────────────
  { name: 'IIT Hyderabad',                                              short: 'IITH',    domain: 'iith.ac.in' },
  { name: 'IIIT Hyderabad',                                             short: 'IIITH',   domain: 'iiit.ac.in' },
  { name: 'University of Hyderabad (UoH)',                              short: 'UoH',     domain: 'uohyd.ac.in' },
  { name: 'Osmania University',                                         short: 'OU',      domain: 'osmania.ac.in' },
  { name: 'JNTUH',                                                      short: 'JNTUH',   domain: 'jntuh.ac.in' },

  // ── Autonomous / NAAC A+ colleges ───────────────────────────────────
  { name: 'VNR VJIET',                                                  short: 'VNRVJIET',domain: 'vnrvjiet.ac.in' },
  { name: 'CBIT (Chaitanya Bharathi Institute of Technology)',          short: 'CBIT',    domain: 'cbit.ac.in' },
  { name: 'MGIT (Mahatma Gandhi Institute of Technology)',              short: 'MGIT',    domain: 'mgit.ac.in' },
  { name: 'Vasavi College of Engineering',                              short: 'VCE',     domain: 'vasaviengg.ac.in' },
  { name: 'Gokaraju Rangaraju Institute of Engineering (GRIET)',        short: 'GRIET',   domain: 'griet.ac.in' },
  { name: 'Mahindra École Centrale (MEC)',                              short: 'MEC',     domain: 'mahindrauniversity.edu.in' },
  { name: 'Sreenidhi Institute of Science and Technology (SNIST)',      short: 'SNIST',   domain: 'sreenidhi.edu.in' },
  { name: 'Vardhaman College of Engineering',                           short: 'VCE-V',   domain: 'vardhaman.org' },
  { name: 'Anurag University',                                          short: 'AU-HYD',  domain: 'anurag.edu.in' },
  { name: 'Anurag Group of Institutions (CVSR)',                        short: 'CVSR',    domain: 'cvsr.ac.in' },

  // ── Malla Reddy group ────────────────────────────────────────────────
  { name: 'Malla Reddy Engineering College (MREC)',                     short: 'MREC',    domain: 'mallareddyengineeringcollege.ac.in' },
  { name: 'Malla Reddy Institute of Technology (MRIT)',                 short: 'MRIT',    domain: 'mrits.ac.in' },
  { name: 'Malla Reddy College of Engineering for Women',               short: 'MRCEW',   domain: 'mrec.ac.in' },

  // ── Other well-known colleges ────────────────────────────────────────
  { name: 'Institute of Aeronautical Engineering (IARE)',               short: 'IARE',    domain: 'iare.ac.in' },
  { name: 'MLR Institute of Technology',                                short: 'MLRIT',   domain: 'mlrinstitutions.ac.in' },
  { name: 'St. Martin\'s Engineering College',                          short: 'SMEC',    domain: 'smec.ac.in' },
  { name: 'BVRIT Hyderabad College of Engineering for Women',           short: 'BVRIT',   domain: 'bvrithyderabad.ac.in' },
  { name: 'GNITS (G. Narayanamma Institute of Technology & Science)',   short: 'GNITS',   domain: 'gnits.ac.in' },
  { name: 'Stanley College of Engineering for Women',                   short: 'Stanley', domain: 'stanley.edu.in' },
  { name: 'Methodist College of Engineering and Technology',            short: 'MCET',    domain: 'methodist.edu.in' },
  { name: 'Deccan College of Engineering and Technology',               short: 'DCET',    domain: 'deccancollegehyd.ac.in' },
  { name: 'Muffakham Jah College of Engineering (MJCET)',               short: 'MJCET',   domain: 'mjcollege.ac.in' },
  { name: 'Lords Institute of Engineering and Technology',              short: 'LORDS',   domain: 'lordsinstitution.ac.in' },
  { name: 'Nawab Shah Alam Khan College of Engineering & Technology',   short: 'NSAKEC',  domain: 'nsaket.ac.in' },
  { name: 'ISL Engineering College',                                    short: 'ISLEC',   domain: 'islec.ac.in' },
  { name: 'Shadan College of Engineering and Technology',               short: 'SCET',    domain: 'shadancet.ac.in' },

  // ── CMR group ────────────────────────────────────────────────────────
  { name: 'CMR College of Engineering and Technology',                  short: 'CMRCET',  domain: 'cmrcet.ac.in' },
  { name: 'CMR Technical Campus',                                       short: 'CMRTC',   domain: 'cmrtc.ac.in' },
  { name: 'CMR Institute of Technology',                                short: 'CMRIT',   domain: 'cmritonline.ac.in' },

  // ── Aurora group ─────────────────────────────────────────────────────
  { name: "Aurora's Engineering College",                               short: 'AEC',     domain: 'aec.edu.in' },
  { name: "Aurora's Technological and Research Institute",              short: 'ATRI',    domain: 'atri.edu.in' },

  // ── Other institutions ───────────────────────────────────────────────
  { name: 'Holy Mary Institute of Technology and Science',              short: 'HMIT',    domain: 'holymaryengg.ac.in' },
  { name: 'Bhoj Reddy Engineering College for Women',                   short: 'BRECW',   domain: 'brecw.ac.in' },
  { name: 'Siddhartha Institute of Engineering and Technology',         short: 'SIET',    domain: 'sietk.ac.in' },
  { name: 'Brilliant Grammar School Educational Society GI',            short: 'BGS',     domain: 'bgsgroups.com' },
  { name: 'Swarna Bharathi Institute of Science and Technology',        short: 'SBIT',    domain: 'sbitsiddipet.ac.in' },

  // ── Vignan group ─────────────────────────────────────────────────────
  { name: 'Vignan Institute of Technology and Science',                 short: 'VITS',    domain: 'vignanits.ac.in' },
  { name: 'Vignan Bharathi Institute of Technology',                    short: 'VBIT',    domain: 'vbit.ac.in' },

  // ── More colleges ────────────────────────────────────────────────────
  { name: 'Maturi Venkata Subba Rao Engineering College (MVSR)',        short: 'MVSR',    domain: 'mvsrec.ac.in' },
  { name: 'TKR College of Engineering and Technology',                  short: 'TKRCET',  domain: 'tkrcet.com' },
  { name: 'TKR Institute of Engineering and Technology',                short: 'TKRMET',  domain: 'tkrmet.com' },
  { name: 'Keshav Memorial Institute of Technology',                    short: 'KMIT',    domain: 'kmit.in' },
  { name: 'Keshav Memorial Engineering College',                        short: 'KMEC',    domain: 'kmec.ac.in' },
  { name: "St. Mary's Engineering College",                             short: 'SMEC-M',  domain: 'stmarys.ac.in' },
  { name: 'AVN Institute of Engineering and Technology',                short: 'AVNIET',  domain: 'avniet.ac.in' },

  // ── Fallback ─────────────────────────────────────────────────────────
  { name: 'Other',                                                       short: 'Other',   domain: '' },
];

// ─────────────────────────────────────────────
// Reusable field wrapper
// ─────────────────────────────────────────────
function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
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

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function SignUpScreen({ navigation }: Props) {
  const [fullName,        setFullName]        = useState('');
  const [rollNumber,      setRollNumber]      = useState('');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [collegeSearch,   setCollegeSearch]   = useState('');
  const [showPicker,      setShowPicker]      = useState(false);
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPw,       setConfirmPw]       = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  const rollRef    = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailRef   = useRef<React.ComponentRef<typeof TextInput>>(null);
  const pwRef      = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const getEmailDomain = (e: string) =>
    e.includes('@') ? e.split('@')[1]?.toLowerCase().trim() ?? '' : '';

  const clearError = (key: string) =>
    setErrors(prev => ({ ...prev, [key]: '' }));

  const filteredColleges = COLLEGES.filter(c =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.short.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  // ── Validation ──────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!fullName.trim())
      e.fullName = 'Full name is required.';
    else if (fullName.trim().length < 2)
      e.fullName = 'Name must be at least 2 characters.';

    if (!rollNumber.trim())
      e.rollNumber = 'Roll number is required.';

    if (!selectedCollege)
      e.college = 'Please select your college.';

    if (!email.trim()) {
      e.email = 'College email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address.';
    } else if (selectedCollege && selectedCollege.domain) {
      if (getEmailDomain(email) !== selectedCollege.domain.toLowerCase())
        e.email = `The email domain does not match the selected college. Expected @${selectedCollege.domain}`;
    } else {
      const domain = getEmailDomain(email);
      if (!domain.endsWith('.ac.in') && !domain.endsWith('.edu') && !domain.endsWith('.edu.in'))
        e.email = 'Please use a valid college email (.ac.in or .edu).';
    }

    if (!password)
      e.password = 'Password is required.';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters.';

    if (!confirmPw)
      e.confirmPw = 'Please confirm your password.';
    else if (password !== confirmPw)
      e.confirmPw = 'Passwords do not match.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await signUp(email.trim(), password.trim(), {
        name:        fullName.trim(),
        college:     selectedCollege?.name ?? '',
        rollNumber:  rollNumber.trim(),
      });
      Alert.alert(
        'Account Created!',
        'You can now log in.',
        [{ text: 'Log In', onPress: () => navigation.navigate('Login') }],
        { cancelable: false },
      );
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
        e.code === 'auth/invalid-email'        ? 'Invalid email address.' :
        e.code === 'auth/weak-password'        ? 'Password must be at least 6 characters.' :
        e.message ?? 'Sign up failed. Please try again.';
      Alert.alert('Sign Up Failed', msg);
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

  // ── Render ───────────────────────────────────
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
          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={s.backText}>Back to Login</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <View style={s.iconCircle}>
              <Ionicons name="person-add" size={38} color={colors.primary} />
            </View>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Fill in all fields to verify your student identity.</Text>
          </View>

          {/* Form card */}
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

            {/* College Name */}
            <Field label="College Name" error={errors.college} required>
              <TouchableOpacity
                style={[s.row, s.pickerRow, borderFor('college')]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={18} color={colors.textTertiary} style={s.icon} />
                {selectedCollege ? (
                  <View style={s.pickerValue}>
                    <Text style={s.pickerValueName} numberOfLines={1}>{selectedCollege.name}</Text>
                    {!!selectedCollege.domain && (
                      <Text style={s.pickerValueDomain}>@{selectedCollege.domain}</Text>
                    )}
                  </View>
                ) : (
                  <Text style={s.pickerPlaceholder}>Enter or select your college name</Text>
                )}
                <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              {selectedCollege && (
                <View style={s.hint}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.info} />
                  <Text style={s.hintText}>
                    Your email must end with @{selectedCollege.domain || 'your college domain'}
                  </Text>
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
                  placeholder={
                    selectedCollege?.domain
                      ? `name@${selectedCollege.domain}`
                      : 'your.name@college.ac.in'
                  }
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
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textTertiary}
                  />
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
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                  <Ionicons
                    name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </Field>

            {/* Submit */}
            <TouchableOpacity
              style={[s.btn, isLoading && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <Text style={s.btnText}>Creating Account…</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={s.btnText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Already have an account */}
            <View style={s.loginRow}>
              <Text style={s.loginPrompt}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={s.footer}>
            By creating an account you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
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
                placeholder="Search by name or short code..."
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
              keyExtractor={item => item.name}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={s.sep} />}
              renderItem={({ item }) => {
                const active = selectedCollege?.name === item.name;
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
                    <View style={[s.shortBadge, active && s.shortBadgeActive]}>
                      <Text style={[s.shortText, active && s.shortTextActive]}>{item.short}</Text>
                    </View>
                    <View style={s.collegeInfo}>
                      <Text style={[s.collegeName, active && s.collegeNameActive]}>{item.name}</Text>
                      {!!item.domain && (
                        <Text style={s.collegeDomain}>@{item.domain}</Text>
                      )}
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

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: 56,
    paddingBottom: spacing.xxxl,
  },

  // Back button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: '#fff',
    fontWeight: typography.weights.medium,
  },

  // Header
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.extrabold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },

  // Input rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  icon:  { marginRight: spacing.sm },
  input: { flex: 1, height: 52, fontSize: typography.sizes.md, color: colors.textPrimary },

  // College picker trigger
  pickerRow:         { paddingVertical: spacing.sm, height: undefined },
  pickerPlaceholder: { flex: 1, fontSize: typography.sizes.md, color: colors.textTertiary },
  pickerValue:       { flex: 1 },
  pickerValueName:   { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  pickerValueDomain: { fontSize: typography.sizes.xs, color: colors.primary, marginTop: 1 },

  // Domain hint
  hint:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, paddingHorizontal: 2 },
  hintText: { fontSize: typography.sizes.xs, color: colors.info },

  // Submit button
  btn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
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

  // Already have account link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  loginPrompt: { fontSize: typography.sizes.md, color: colors.textSecondary },
  loginLink: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  footer: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },

  // ── College picker modal ──
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  sheetTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    margin: spacing.lg, paddingHorizontal: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.md, backgroundColor: colors.background,
    gap: spacing.sm, height: 44,
  },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary },

  collegeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md,
  },
  collegeRowActive: { backgroundColor: '#f0f7f3' },
  collegeInfo:      { flex: 1 },
  collegeName:      { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  collegeNameActive:{ color: colors.primary, fontWeight: typography.weights.semibold },
  collegeDomain:    { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 1 },

  shortBadge: {
    width: 52, height: 32, borderRadius: borderRadius.sm,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  shortBadgeActive: { backgroundColor: '#e8f5ee', borderColor: colors.primary },
  shortText:        { fontSize: 10, fontWeight: typography.weights.bold, color: colors.textSecondary },
  shortTextActive:  { color: colors.primary },

  sep: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: spacing.xl },
});
