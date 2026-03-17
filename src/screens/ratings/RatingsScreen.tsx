import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockUsers, mockReviews, CURRENT_USER_ID } from '../../data/mockData';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Ratings'>;
  route: RouteProp<HomeStackParamList, 'Ratings'>;
};

export default function RatingsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;
  const seller = mockUsers.find(u => u.id === userId);
  const reviews = mockReviews.filter(r => r.sellerId === userId);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOwnProfile = userId === CURRENT_USER_ID;

  if (!seller) return null;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  const handleSubmitReview = () => {
    if (myRating === 0) { Alert.alert('Rate Required', 'Please select a star rating.'); return; }
    if (!myComment.trim()) { Alert.alert('Comment Required', 'Please write a comment.'); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Review Submitted!', 'Thank you for your feedback.', [
        { text: 'OK', onPress: () => { setMyRating(0); setMyComment(''); } }
      ]);
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Seller Card */}
        <View style={styles.sellerCard}>
          <Image source={{ uri: seller.avatar }} style={styles.avatar} />
          <View style={styles.sellerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.sellerName}>{seller.name}</Text>
              {seller.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.sellerCollege}>{seller.college}</Text>
            <Text style={styles.sellerDept}>{seller.department} · {seller.year}</Text>
          </View>
        </View>

        {/* Rating Summary */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNumber}>{seller.rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(seller.rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={i < Math.round(seller.rating) ? colors.gold : colors.textTertiary}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>{seller.reviewCount} reviews</Text>
          </View>

          <View style={styles.ratingRight}>
            {ratingDist.map(({ star, count, percent }) => (
              <View key={star} style={styles.ratingBarRow}>
                <Text style={styles.ratingBarStar}>{star}</Text>
                <Ionicons name="star" size={10} color={colors.gold} />
                <View style={styles.ratingBarBg}>
                  <View style={[styles.ratingBarFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.ratingBarCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: 'bag-check-outline', label: 'Total Sales', value: seller.totalSales },
            { icon: 'time-outline', label: 'Response', value: seller.responseTime },
            { icon: 'calendar-outline', label: 'Member Since', value: seller.memberSince },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={16} color={colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="star-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.reviewerAvatar }} style={styles.reviewAvatar} />
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <View style={styles.reviewStarsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-outline'}
                          size={13}
                          color={i < review.rating ? colors.gold : colors.textTertiary}
                        />
                      ))}
                      <Text style={styles.reviewTime}>
                        {new Date(review.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>

        {/* Write Review */}
        {!isOwnProfile && (
          <View style={styles.writeReviewSection}>
            <Text style={styles.sectionTitle}>Write a Review</Text>
            <View style={styles.starSelector}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setMyRating(star)}>
                  <Ionicons
                    name={star <= myRating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= myRating ? colors.gold : colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {myRating > 0 && (
              <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating]}
              </Text>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience with this seller..."
              placeholderTextColor={colors.textTertiary}
              value={myComment}
              onChangeText={setMyComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
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
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  sellerInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  sellerName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  verifiedText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.semibold,
  },
  sellerCollege: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sellerDept: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  ratingCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.xl,
    ...shadows.small,
  },
  ratingLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  ratingNumber: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.extrabold,
    color: colors.textPrimary,
    lineHeight: 40,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: spacing.xs,
  },
  reviewCount: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  ratingRight: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingBarStar: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    width: 8,
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  ratingBarCount: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    width: 14,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  reviewsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textTertiary,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewMeta: {},
  reviewerName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewTime: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  reviewComment: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  writeReviewSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  starSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    height: 100,
    marginBottom: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
});
