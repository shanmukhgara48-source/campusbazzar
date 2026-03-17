import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings } from '../../data/mockData';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Offer'>;
  route: RouteProp<HomeStackParamList, 'Offer'>;
};

export default function OfferScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listingId } = route.params;
  const listing = mockListings.find(l => l.id === listingId);
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!listing) return null;

  const suggested = [
    Math.round(listing.price * 0.85),
    Math.round(listing.price * 0.9),
    Math.round(listing.price * 0.95),
  ];

  const handleSubmit = () => {
    const amount = parseInt(offerAmount);
    if (!offerAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid offer amount.');
      return;
    }
    if (amount > listing.price) {
      Alert.alert('High Offer', 'Your offer is above the asking price. Consider buying directly.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Offer Sent!',
        `Your offer of ₹${amount.toLocaleString('en-IN')} has been sent to ${listing.seller.name}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  const discount = offerAmount && parseInt(offerAmount) > 0
    ? Math.round(((listing.price - parseInt(offerAmount)) / listing.price) * 100)
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make an Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Listing Summary */}
        <View style={styles.listingCard}>
          <Image source={{ uri: listing.images[0] }} style={styles.listingImg} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
            <Text style={styles.askingPrice}>Asking: ₹{listing.price.toLocaleString('en-IN')}</Text>
            <View style={styles.sellerRow}>
              <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
              {listing.seller.isVerified && (
                <Ionicons name="checkmark-circle" size={13} color={colors.verified} />
              )}
            </View>
          </View>
        </View>

        {/* Offer Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Offer Amount</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
              autoFocus
            />
            {discount !== null && discount > 0 && (
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>{discount}% off</Text>
              </View>
            )}
          </View>

          {/* Suggested amounts */}
          <Text style={styles.suggestionLabel}>Quick suggestions</Text>
          <View style={styles.suggestionsRow}>
            {suggested.map((amt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionPill, offerAmount === String(amt) && styles.suggestionPillActive]}
                onPress={() => setOfferAmount(String(amt))}
              >
                <Text style={[styles.suggestionText, offerAmount === String(amt) && styles.suggestionTextActive]}>
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.suggestionPercent, offerAmount === String(amt) && styles.suggestionTextActive]}>
                  {Math.round(((listing.price - amt) / listing.price) * 100)}% off
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Message (optional)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Explain your offer — condition concerns, bulk purchase, etc."
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Offer Tips</Text>
          {[
            'Be respectful — don\'t lowball too much',
            'Explain why you\'re offering less',
            'Sellers can counter-offer back',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={14} color={colors.accent} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Ionicons name="pricetag-outline" size={20} color="#fff" />
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Sending...' : 'Send Offer'}
          </Text>
        </TouchableOpacity>

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
  content: {
    padding: spacing.xl,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.small,
  },
  listingImg: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  askingPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sellerName: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    height: 64,
    gap: spacing.sm,
  },
  currencySymbol: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  discountTag: {
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  discountTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  suggestionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  suggestionPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  suggestionPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  suggestionPercent: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  suggestionTextActive: {
    color: '#fff',
  },
  messageInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    height: 100,
  },
  tipsBox: {
    backgroundColor: '#fffbeb',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#92400e',
    marginBottom: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.sizes.xs,
    color: '#78350f',
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
});
