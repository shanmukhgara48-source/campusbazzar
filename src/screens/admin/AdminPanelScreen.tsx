import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockUsers, mockListings } from '../../data/mockData';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'AdminPanel'>;
};

export default function AdminPanelScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'reports'>('overview');

  const totalUsers = mockUsers.length;
  const verifiedUsers = mockUsers.filter(u => u.isVerified).length;
  const activeListings = mockListings.filter(l => l.status === 'active').length;
  const totalViews = mockListings.reduce((sum, l) => sum + l.views, 0);

  const TABS = ['overview', 'users', 'listings', 'reports'] as const;

  const reportedItems = [
    { id: 'r1', type: 'listing', title: 'Suspicious pricing on laptop', reporter: 'Aisha Khan', status: 'open' },
    { id: 'r2', type: 'user', title: 'User not responding after payment', reporter: 'Dev Patel', status: 'investigating' },
    { id: 'r3', type: 'listing', title: 'Misleading item description', reporter: 'Rahul Verma', status: 'resolved' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Stats Banner */}
      <LinearGradient colors={['#0f3a24', colors.primary]} style={styles.statsBanner}>
        <Text style={styles.bannerTitle}>Platform Overview</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'people', label: 'Total Users', value: totalUsers, color: '#60a5fa' },
            { icon: 'checkmark-circle', label: 'Verified', value: verifiedUsers, color: '#4ade80' },
            { icon: 'list', label: 'Active Listings', value: activeListings, color: '#fbbf24' },
            { icon: 'eye', label: 'Total Views', value: totalViews, color: '#f87171' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {[
                { icon: 'ban', label: 'Suspend User', color: colors.error },
                { icon: 'checkmark-circle', label: 'Verify User', color: colors.success },
                { icon: 'trash', label: 'Remove Listing', color: colors.warning },
                { icon: 'mail', label: 'Send Announcement', color: colors.info },
                { icon: 'bar-chart', label: 'View Analytics', color: colors.primary },
                { icon: 'shield', label: 'Security Logs', color: '#8b5cf6' },
              ].map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionCard}
                  onPress={() => Alert.alert(action.label, 'This feature is available in full production.')}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Platform Health</Text>
            {[
              { label: 'Verified Users Rate', value: Math.round((verifiedUsers / totalUsers) * 100), color: colors.success },
              { label: 'Active Listing Rate', value: Math.round((activeListings / mockListings.length) * 100), color: colors.primary },
              { label: 'Response Rate', value: 87, color: colors.info },
              { label: 'Dispute Resolution', value: 94, color: colors.accent },
            ].map((metric, i) => (
              <View key={i} style={styles.metricRow}>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}%</Text>
                </View>
                <View style={styles.metricBarBg}>
                  <View style={[styles.metricBarFill, { width: `${metric.value}%`, backgroundColor: metric.color }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View>
            {mockUsers.map(user => (
              <View key={user.id} style={styles.userCard}>
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {user.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
                    )}
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{user.role}</Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userMeta}>{user.college} · {user.year}</Text>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.userActionBtn}
                    onPress={() => Alert.alert('User Actions', `Actions for ${user.name}`, [
                      { text: 'Suspend', style: 'destructive', onPress: () => {} },
                      { text: 'Verify', onPress: () => {} },
                      { text: 'Cancel', style: 'cancel' },
                    ])}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <View>
            {mockListings.slice(0, 6).map(listing => (
              <View key={listing.id} style={styles.listingRow}>
                <Image source={{ uri: listing.images[0] }} style={styles.listingImg} />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
                  <View style={styles.listingMeta}>
                    <Text style={styles.listingMetaText}>{listing.seller.name}</Text>
                    <View style={[styles.statusBadge, {
                      backgroundColor: listing.status === 'active' ? colors.success + '20' : colors.warning + '20'
                    }]}>
                      <Text style={[styles.statusText, {
                        color: listing.status === 'active' ? colors.success : colors.warning
                      }]}>{listing.status}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.listingActionBtn}
                  onPress={() => Alert.alert('Listing Actions', `Actions for: ${listing.title}`, [
                    { text: 'Remove', style: 'destructive', onPress: () => {} },
                    { text: 'Flag', onPress: () => {} },
                    { text: 'Feature', onPress: () => {} },
                    { text: 'Cancel', style: 'cancel' },
                  ])}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>Open Reports ({reportedItems.filter(r => r.status !== 'resolved').length})</Text>
            {reportedItems.map(report => {
              const statusColors: Record<string, string> = {
                open: colors.error,
                investigating: colors.warning,
                resolved: colors.success,
              };
              return (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportTop}>
                    <View style={[styles.reportTypeTag, { backgroundColor: colors.info + '20' }]}>
                      <Text style={[styles.reportTypeText, { color: colors.info }]}>{report.type}</Text>
                    </View>
                    <View style={[styles.reportStatusTag, { backgroundColor: statusColors[report.status] + '20' }]}>
                      <Text style={[styles.reportStatusText, { color: statusColors[report.status] }]}>
                        {report.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportReporter}>Reported by: {report.reporter}</Text>
                  {report.status !== 'resolved' && (
                    <View style={styles.reportActions}>
                      <TouchableOpacity style={styles.resolveBtn}>
                        <Text style={styles.resolveBtnText}>Resolve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.investigateBtn}>
                        <Text style={styles.investigateBtnText}>Investigate</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statsBanner: {
    padding: spacing.xl,
  },
  bannerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#fff',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  tabContent: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.small,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  metricRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  metricInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  metricValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  metricBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
    gap: spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  userActions: {},
  userActionBtn: {
    padding: spacing.xs,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.small,
  },
  listingImg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
  },
  listingInfo: { flex: 1 },
  listingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  listingPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 3,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listingMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    flex: 1,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  listingActionBtn: {
    padding: spacing.xs,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  reportTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reportTypeTag: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  reportTypeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  reportStatusTag: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  reportStatusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  reportTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  reportReporter: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  reportActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resolveBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  resolveBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  investigateBtn: {
    flex: 1,
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  investigateBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.warning,
  },
});
