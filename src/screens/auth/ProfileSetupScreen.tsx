import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
  route: RouteProp<AuthStackParamList, 'ProfileSetup'>;
};

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil Engineering', 'Chemical', 'Mathematics', 'Physics', 'Other'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'PhD'];

export default function ProfileSetupScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleComplete = () => {
    if (!name.trim() || !college.trim() || !department || !year) {
      Alert.alert('Incomplete Profile', 'Please fill in all fields to continue.');
      return;
    }
    login(email);
  };

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>This helps other students trust you</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>College / University</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="school-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. IIT Bombay"
                placeholderTextColor={colors.textTertiary}
                value={college}
                onChangeText={setCollege}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Department</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowDeptPicker(!showDeptPicker)}
            >
              <Ionicons name="library-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.pickerText, department ? styles.pickerTextSelected : null]}>
                {department || 'Select department'}
              </Text>
              <Ionicons name={showDeptPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            {showDeptPicker && (
              <View style={styles.pickerDropdown}>
                {DEPARTMENTS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerOption, department === d && styles.pickerOptionSelected]}
                    onPress={() => { setDepartment(d); setShowDeptPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, department === d && styles.pickerOptionTextSelected]}>
                      {d}
                    </Text>
                    {department === d && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Year of Study</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
              <Text style={[styles.pickerText, year ? styles.pickerTextSelected : null]}>
                {year || 'Select year'}
              </Text>
              <Ionicons name={showYearPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            {showYearPicker && (
              <View style={styles.pickerDropdown}>
                {YEARS.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerOption, year === y && styles.pickerOptionSelected]}
                    onPress={() => { setYear(y); setShowYearPicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, year === y && styles.pickerOptionTextSelected]}>
                      {y}
                    </Text>
                    {year === y && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.emailDisplay}>
            <Ionicons name="mail" size={16} color={colors.primary} />
            <Text style={styles.emailDisplayText}>{email}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
            <Text style={styles.completeBtnText}>Complete Setup</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textTertiary,
  },
  pickerTextSelected: {
    color: colors.textPrimary,
  },
  pickerDropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: '#fff',
    marginTop: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerOptionSelected: {
    backgroundColor: '#f0f7f3',
  },
  pickerOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f3',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emailDisplayText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.semibold,
  },
  completeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  completeBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
});
