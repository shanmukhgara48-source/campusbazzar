import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ],
    );
  };

  const navSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline',           label: 'Edit Profile',    onPress: () => navigation.navigate('EditProfile') },
        { icon: 'shield-checkmark-outline', label: 'ID Verification', onPress: () => navigation.navigate('IDVerification') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => navigation.navigate('Terms') },
        { icon: 'ban-outline',           label: 'Prohibited Items',   onPress: () => navigation.navigate('ProhibitedItems') },
      ],
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {user && (
          <View style={s.userRow}>
            <View style={s.userAvatar}>
              <Text style={s.userInitial}>
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={s.userName}>{user.name || 'User'}</Text>
              <Text style={s.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        {navSections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.row, i < section.items.length - 1 && s.rowBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                >
                  <View style={s.rowIcon}>
                    <Ionicons name={item.icon as any} size={19} color={colors.primary} />
                  </View>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>CampusBazaar v1.0.0</Text>
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  content:      { padding: spacing.xl },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.xl, ...shadows.small,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  userInitial:  { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary },
  userName:     { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  userEmail:    { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  section:      { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold,
    color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sectionCard:  { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', ...shadows.small },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  rowBorder:    { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel:     { flex: 1, fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error + '30',
    marginBottom: spacing.lg,
  },
  logoutText:   { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.error },
  version:      { textAlign: 'center', fontSize: typography.sizes.xs, color: colors.textTertiary },
});
