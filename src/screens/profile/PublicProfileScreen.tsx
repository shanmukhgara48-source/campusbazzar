import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { getUser } from '../../services/userService';
import { useSellerListings } from '../../services/listingService';
import { useSellerReviews } from '../../services/reviewService';
import { blockUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'PublicProfile'>;
  route:      RouteProp<HomeStackParamList, 'PublicProfile'>;
};

interface PublicUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  college: string;
  rating?: number;
  reviewCount?: number;
  totalSales?: number;
  isVerified?: boolean;
  bio?: string;
  createdAt?: unknown;
}

export default function PublicProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const { user: me } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile]   = useState<PublicUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [blocking, setBlocking] = useState(false);

  const { listings } = useSellerListings(userId);
  const { reviews, avgRating } = useSellerReviews(userId);

  useEffect(() => {
    getUser(userId)
      .then(u => setProfile(u as PublicUser))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Block ${profile?.name}? They won't be able to message you or see your listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            if (!me?.uid) return;
            setBlocking(true);
            try {
              await blockUser(me.uid, userId);
              Alert.alert('Blocked', `${profile?.name} has been blocked.`);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not block user.');
            } finally {
              setBlocking(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>User not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const memberSince = profile.createdAt
    ? new Date((profile.createdAt as any)?.toDate?.() ?? profile.createdAt as any).getFullYear()
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.banner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          {me?.uid !== userId && (
            <TouchableOpacity style={styles.moreBtn} onPress={handleBlock} disabled={blocking}>
              {blocking ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
              ) : (
                <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.9)" />
              )}
            </TouchableOpacity>
          )}

          <View style={styles.profileInfo}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.userName}>{profile.name}</Text>
            <Text style={styles.userCollege}>{profile.college}</Text>
            <View style={styles.badgeRow}>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified Student</Text>
                </View>
              )}
              {memberSince && (
                <View style={styles.yearBadge}>
                  <Text style={styles.yearText}>Since {memberSince}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Rating',   value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: 'star',       color: colors.gold },
            { label: 'Reviews',  value: reviews.length,                               icon: 'chatbubble', color: colors.info },
            { label: 'Listings', value: listings.length,                              icon: 'bag',        color: colors.primary },
            { label: 'Sales',    value: profile.totalSales ?? 0,                      icon: 'bag-check',  color: colors.success },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {!!profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Active Listings */}
        {listings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Listings ({listings.length})</Text>
            {listings.slice(0, 5).map(listing => (
              <TouchableOpacity
                key={listing.id}
                style={styles.listingRow}
                onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
              >
                {listing.images?.[0] ? (
                  <Image source={{ uri: listing.images[0] }} style={styles.listingThumb} />
                ) : (
                  <View style={[styles.listingThumb, styles.noImage]}>
                    <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
                  <Text style={styles.listingCategory}>{listing.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.slice(0, 5).map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {review.reviewerAvatar ? (
                    <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={[styles.reviewAvatar, styles.reviewAvatarPlaceholder]}>
                      <Text style={styles.reviewAvatarText}>{review.reviewerName?.charAt(0) ?? '?'}</Text>
                    </View>
                  )}
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={colors.gold}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {!!review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: colors.background },
  center:                 { alignItems: 'center', justifyContent: 'center' },
  errorText:              { color: colors.textSecondary, fontSize: typography.sizes.md, marginBottom: spacing.md },
  backLink:               { color: colors.primary, fontSize: typography.sizes.md },
  banner:                 { paddingTop: spacing.md, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.xl },
  backBtn:                { alignSelf: 'flex-start', padding: spacing.xs },
  moreBtn:                { position: 'absolute', top: spacing.md + spacing.xs, right: spacing.xl, padding: spacing.xs },
  profileInfo:            { alignItems: 'center', marginTop: spacing.sm },
  avatar:                 { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  avatarPlaceholder:      { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:          { fontSize: 36, fontWeight: typography.weights.bold, color: '#fff' },
  userName:               { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: '#fff', marginBottom: 3 },
  userCollege:            { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  badgeRow:               { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  verifiedBadge:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4, gap: 3 },
  verifiedText:           { fontSize: typography.sizes.xs, color: '#fff', fontWeight: typography.weights.medium },
  yearBadge:              { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  yearText:               { fontSize: typography.sizes.xs, color: '#fff' },
  statsRow:               { flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: -24, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.medium, gap: spacing.sm },
  statCard:               { flex: 1, alignItems: 'center', gap: 3 },
  statValue:              { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  statLabel:              { fontSize: typography.sizes.xs, color: colors.textTertiary },
  section:                { marginHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionTitle:           { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  bioText:                { fontSize: typography.sizes.md, color: colors.textSecondary, lineHeight: 22 },
  listingRow:             { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  listingThumb:           { width: 60, height: 60, borderRadius: borderRadius.sm, marginRight: spacing.md },
  noImage:                { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  listingInfo:            { flex: 1 },
  listingTitle:           { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: 2 },
  listingPrice:           { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },
  listingCategory:        { fontSize: typography.sizes.xs, color: colors.textTertiary, marginTop: 2 },
  reviewCard:             { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.small },
  reviewHeader:           { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  reviewAvatar:           { width: 36, height: 36, borderRadius: 18, marginRight: spacing.md },
  reviewAvatarPlaceholder:{ backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText:       { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
  reviewMeta:             { flex: 1 },
  reviewerName:           { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary, marginBottom: 2 },
  stars:                  { flexDirection: 'row', gap: 2 },
  reviewComment:          { fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 },
});
