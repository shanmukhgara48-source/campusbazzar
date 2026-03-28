import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useFavourites } from '../../context/FavouritesContext';
import { useSellerListings } from '../../services/listingService';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, loading, logout } = useAuth();
  const { savedIds } = useFavourites();
  // Must be called unconditionally before any early return
  const { listings: myListings } = useSellerListings(user?.uid ?? '');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) return null;

  const rating       = user.rating       ?? 0;
  const reviewCount  = user.reviewCount  ?? 0;
  const totalSales   = user.totalSales   ?? 0;
  const year         = user.year         ?? '';
  const department   = user.department   ?? '';
  const memberSince  = user.memberSince  ?? '';
  const responseTime = user.responseTime ?? '';
  const isVerified   = user.isVerified   ?? false;
  const role         = user.role         ?? 'buyer';

  const menuItems = [
    { icon: 'create-outline',           label: 'Edit Profile',          onPress: () => navigation.navigate('EditProfile') },
    { icon: 'cube-outline',             label: 'Orders',                                          onPress: () => navigation.navigate('Orders') },
    { icon: 'list-outline',             label: 'My Listings',           count: myListings.length, onPress: () => navigation.navigate('SellerDashboard') },
    { icon: 'heart-outline',            label: 'Saved Items',           count: savedIds.size,     onPress: () => navigation.navigate('SavedItems') },
    { icon: 'receipt-outline',          label: 'Transaction History',                             onPress: () => navigation.navigate('TransactionHistory') },
    { icon: 'star-outline',             label: 'Reviews',               count: reviewCount ?? 0,  onPress: () => navigation.navigate('SellerDashboard') },
    { icon: 'bar-chart-outline',        label: 'Seller Dashboard',                                onPress: () => navigation.navigate('SellerDashboard') },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Safety',                               onPress: () => {} },
    { icon: 'help-circle-outline',      label: 'Help & Support',                                  onPress: () => {} },
  ];

  const bannerColors: [string, string] = ['#0f3a24', '#1a5c3a'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <LinearGradient colors={bannerColors} style={styles.banner}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=1' }}
                style={styles.avatar}
              />
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.accent }]}>
                <Ionicons name="camera" size={14} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userCollege}>
              {[user.college, department].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.badgeRow}>
              {!!year && (
                <View style={styles.yearBadge}>
                  <Text style={styles.yearText}>{year}</Text>
                </View>
              )}
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.roleText, { color: colors.textInverse }]}>{role}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          {[
            { label: 'Rating',   value: rating.toFixed(1),  icon: 'star',       color: colors.gold    },
            { label: 'Reviews',  value: reviewCount,         icon: 'chatbubble', color: colors.info    },
            { label: 'Sales',    value: totalSales,          icon: 'bag-check',  color: colors.success },
            { label: 'Listings', value: myListings.length,   icon: 'eye',        color: colors.accent  },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Member Since */}
        <View style={styles.memberRow}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          {!!memberSince && <Text style={[styles.memberText, { color: colors.textTertiary }]}>Member since {memberSince}</Text>}
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
          <Ionicons name="flash-outline" size={14} color={colors.textTertiary} />
          {!!responseTime && <Text style={[styles.memberText, { color: colors.textTertiary }]}>Responds {responseTime}</Text>}
        </View>

        {/* My Active Listings */}
        {myListings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Listings</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingsRow}>
              {myListings.slice(0, 4).map(listing => (
                <TouchableOpacity key={listing.id} style={[styles.myListingCard, { backgroundColor: colors.surface }]}>
                  <Image source={{ uri: listing.images[0] }} style={styles.myListingImg} />
                  <Text style={[styles.myListingTitle, { color: colors.textPrimary }]} numberOfLines={2}>{listing.title}</Text>
                  <Text style={[styles.myListingPrice, { color: colors.primary }]}>₹{listing.price.toLocaleString('en-IN')}</Text>
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
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              {item.count !== undefined && (
                <View style={[styles.menuCount, { backgroundColor: colors.border }]}>
                  <Text style={[styles.menuCountText, { color: colors.textSecondary }]}>{item.count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>CampusBazaar v1.0.0</Text>
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  banner:         { paddingTop: spacing.lg, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.xl },
  settingsBtn:    { alignSelf: 'flex-end', padding: spacing.xs },
  profileInfo:    { alignItems: 'center', marginTop: spacing.sm },
  avatarContainer:{ position: 'relative', marginBottom: spacing.md },
  avatar:         { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' },
  editAvatarBtn:  { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  userName:       { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: '#fff', marginBottom: 3 },
  userCollege:    { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  badgeRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  yearBadge:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  yearText:       { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4, gap: 3 },
  verifiedText:   { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },
  roleBadge:      { borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  roleText:       { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'capitalize' },
  statsRow:       { flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: -24, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.medium, gap: spacing.sm },
  statCard:       { flex: 1, alignItems: 'center', gap: 3 },
  statValue:      { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  statLabel:      { fontSize: typography.sizes.xs },
  memberRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, flexWrap: 'wrap' },
  memberText:     { fontSize: typography.sizes.xs },
  dot:            { width: 3, height: 3, borderRadius: 1.5 },
  section:        { marginBottom: spacing.xl },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  sectionTitle:   { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  seeAll:         { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  listingsRow:    { paddingHorizontal: spacing.xl, gap: spacing.md },
  myListingCard:  { width: 120, borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.small },
  myListingImg:   { width: '100%', height: 90 },
  myListingTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, padding: spacing.sm, paddingBottom: 2 },
  myListingPrice: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  statusBadge:    { marginHorizontal: spacing.sm, marginBottom: spacing.sm, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  statusText:     { fontSize: 10, fontWeight: typography.weights.semibold, textTransform: 'capitalize' },
  menuSection:    { marginHorizontal: spacing.xl, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.small },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.md },
  menuIconBox:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  menuLabel:      { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  menuCount:      { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  menuCountText:  { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.lg, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, gap: spacing.sm },
  logoutText:     { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  version:        { textAlign: 'center', fontSize: typography.sizes.xs, marginBottom: spacing.md },
});
