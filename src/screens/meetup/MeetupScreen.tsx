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
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockListings } from '../../data/mockData';
import { MeetupLocation, PaymentMethod } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Meetup'>;
  route: RouteProp<HomeStackParamList, 'Meetup'>;
};

const LOCATIONS: { value: MeetupLocation; icon: string; desc: string }[] = [
  { value: 'Library', icon: 'library-outline', desc: 'Main campus library entrance' },
  { value: 'Canteen', icon: 'restaurant-outline', desc: 'Central canteen, ground floor' },
  { value: 'Admin Gate', icon: 'business-outline', desc: 'Main admin building gate' },
  { value: 'Main Block', icon: 'school-outline', desc: 'Main academic block lobby' },
  { value: 'Hostel Block', icon: 'home-outline', desc: 'Hostel common area' },
];

const PAYMENT_METHODS: { value: PaymentMethod; icon: string; desc: string }[] = [
  { value: 'Cash', icon: 'cash-outline', desc: 'Pay in cash at meetup' },
  { value: 'UPI', icon: 'phone-portrait-outline', desc: 'GPay, PhonePe, Paytm' },
  { value: 'Bank Transfer', icon: 'card-outline', desc: 'IMPS / NEFT transfer' },
];

const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'];

export default function MeetupScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listingId } = route.params;
  const listing = mockListings.find(l => l.id === listingId);
  const [location, setLocation] = useState<MeetupLocation | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!listing) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const canConfirm = location && payment && timeSlot;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      Alert.alert(
        'Meetup Requested!',
        `Your meetup request has been sent to ${listing.seller.name}.\n\nLocation: ${location}\nTime: ${timeSlot}, ${dateStr}\nPayment: ${payment}`,
        [{ text: 'OK', onPress: () => navigation.navigate('HomeMain') }]
      );
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Meetup</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Listing Summary */}
        <View style={styles.listingCard}>
          <Image source={{ uri: listing.images[0] }} style={styles.listingImg} />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
            <Text style={styles.listingPrice}>₹{listing.price.toLocaleString('en-IN')}</Text>
            <View style={styles.sellerRow}>
              <Image source={{ uri: listing.seller.avatar }} style={styles.sellerAvatar} />
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
            </View>
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateCard}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <View>
            <Text style={styles.dateLabel}>Proposed Date</Text>
            <Text style={styles.dateValue}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.changeDateBtn}>
            <Text style={styles.changeDateText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Time Slot</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, timeSlot === slot && styles.slotActive]}
                onPress={() => setTimeSlot(slot)}
              >
                <Text style={[styles.slotText, timeSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meeting Location</Text>
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc.value}
              style={[styles.optionRow, location === loc.value && styles.optionRowActive]}
              onPress={() => setLocation(loc.value)}
            >
              <View style={[styles.optionIconBox, location === loc.value && styles.optionIconBoxActive]}>
                <Ionicons name={loc.icon as any} size={20} color={location === loc.value ? '#fff' : colors.textSecondary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionName, location === loc.value && styles.optionNameActive]}>
                  {loc.value}
                </Text>
                <Text style={styles.optionDesc}>{loc.desc}</Text>
              </View>
              {location === loc.value && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment Method</Text>
          {PAYMENT_METHODS.map(pm => (
            <TouchableOpacity
              key={pm.value}
              style={[styles.optionRow, payment === pm.value && styles.optionRowActive]}
              onPress={() => setPayment(pm.value)}
            >
              <View style={[styles.optionIconBox, payment === pm.value && styles.optionIconBoxActive]}>
                <Ionicons name={pm.icon as any} size={20} color={payment === pm.value ? '#fff' : colors.textSecondary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionName, payment === pm.value && styles.optionNameActive]}>
                  {pm.value}
                </Text>
                <Text style={styles.optionDesc}>{pm.desc}</Text>
              </View>
              {payment === pm.value && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Tips */}
        <View style={styles.safetyBox}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={styles.safetyTitle}>Safety Tips</Text>
          </View>
          {[
            'Meet in public, well-lit campus locations',
            'Inspect the item before paying',
            'Bring a friend if buying high-value items',
            'Report suspicious activity to admin',
          ].map((tip, i) => (
            <View key={i} style={styles.safetyRow}>
              <View style={styles.safetyDot} />
              <Text style={styles.safetyText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, (!canConfirm || isConfirming) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || isConfirming}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.confirmBtnText}>
            {isConfirming ? 'Confirming...' : 'Confirm Meetup Request'}
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
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  listingInfo: { flex: 1 },
  listingTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  listingPrice: {
    fontSize: typography.sizes.lg,
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  dateLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  changeDateBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeDateText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: '30%',
    alignItems: 'center',
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  slotTextActive: {
    color: '#fff',
    fontWeight: typography.weights.semibold,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7f3',
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconBoxActive: {
    backgroundColor: colors.primary,
  },
  optionInfo: { flex: 1 },
  optionName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  optionNameActive: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  safetyBox: {
    backgroundColor: '#f0f7f3',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  safetyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  safetyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
});
