import React from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { mockListings, CURRENT_USER_ID } from '../../data/mockData';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout, switchRole } = useAuth();

  if (!user) return null;

  const myListings = mockListings.filter(l => l.sellerId === CURRENT_USER_ID);
  const totalViews = myListings.reduce((sum, l) => sum + l.views, 0);

  const menuItems = [
    { icon: 'list-outline', label: 'My Listings', count: myListings.length, onPress: () => {} },
    { icon: 'heart-outline', label: 'Saved Items', count: 3, onPress: () => {} },
    { icon: 'star-outline', label: 'Reviews', count: user.reviewCount, onPress: () => navigation.navigate('SellerDashboard') },
    { icon: 'bar-chart-outline', label: 'Seller Dashboard', onPress: () => navigation.navigate('SellerDashboard') },
    { icon: 'notifications-outline', label: 'Notification Settings', onPress: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Safety', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
  ];

  if (user.role === 'admin') {
    menuItems.splice(4, 0, {
      icon: 'settings-outline',
      label: 'Admin Panel',
      onPress: () => navigation.navigate('AdminPanel'),
    });
  }

  const handleRoleSwitch = () => {
    Alert.alert(
      'Switch Role',
      'Choose your role:',
      [
        { text: 'Buyer', onPress: () => switchRole('buyer') },
        { text: 'Seller', onPress: () => switchRole('seller') },
        { text: 'Admin', onPress: () => switchRole('admin') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.banner}>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=1' }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userCollege}>{user.college} · {user.department}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>{user.year}</Text>
              </View>
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              <TouchableOpacity style={styles.roleBadge} onPress={handleRoleSwitch}>
                <Text style={styles.roleText}>{user.role}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Rating', value: user.rating.toFixed(1), icon: 'star', color: colors.gold },
            { label: 'Reviews', value: user.reviewCount, icon: 'chatbubble', color: colors.info },
            { label: 'Sales', value: user.totalSales, icon: 'bag-check', color: colors.success },
            { label: 'Views', value: totalViews, icon: 'eye', color: colors.accent },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Member Since */}
        <View style={styles.memberRow}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.memberText}>Member since {user.memberSince}</Text>
          <View style={styles.dot} />
          <Ionicons name="flash-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.memberText}>Responds {user.responseTime}</Text>
        </View>

        {/* My Active Listings */}
        {myListings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Listings</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsRow}>
              {myListings.slice(0, 4).map(listing => (
                <TouchableOpacity key={listing.id} style={styles.myListingCard}>
                  <Image source={{ uri: listing.images[0] }} style={styles.myListingImg} />
                  <Text style={styles.myListingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.myListingPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: listing.status === 'active' ? colors.success + '20' : colors.warning + '20' }]}>
                    <Text style={[styles.statusText, { color: listing.status === 'active' ? colors.success : colors.warning }]}>
                      {listing.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.85}>
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.count !== undefined && (
                <View style={styles.menuCount}>
                  <Text style={styles.menuCountText}>{item.count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
          ]);
        }}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CampusBazaar v1.0.0</Text>
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
  banner: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  settingsBtn: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#fff',
    marginBottom: 3,
  },
  userCollege: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  yearBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  yearText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.medium,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: typography.sizes.xs,
    color: '#fff',
    fontWeight: typography.weights.medium,
  },
  roleBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#fff',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: -24,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    flexWrap: 'wrap',
  },
  memberText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textTertiary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  listingsRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  myListingCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  myListingImg: {
    width: '100%',
    height: 90,
  },
  myListingTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    padding: spacing.sm,
    paddingBottom: 2,
  },
  myListingPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  statusBadge: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    textTransform: 'capitalize',
  },
  menuSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  menuCount: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  menuCountText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
});
