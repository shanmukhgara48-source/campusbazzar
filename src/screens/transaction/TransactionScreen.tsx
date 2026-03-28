import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator, TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import {
  useTransaction, updateTransactionStatus, verifyDeliveryOtp,
  setMeetup, confirmMeetup, requestMeetupChange, TxStatus,
} from '../../services/transactionService';
import { getOrCreateChat } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import TransactionStatusBadge from '../../components/TransactionStatusBadge';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Transaction'>;
  route:      RouteProp<HomeStackParamList, 'Transaction'>;
};

const STATUS_FLOW: TxStatus[] = ['pending', 'accepted', 'meetup_set', 'completed'];

const STATUS_LABELS: Record<TxStatus, string> = {
  pending:    'Purchase Requested',
  accepted:   'Seller Accepted',
  meetup_set: 'Meetup Confirmed',
  completed:  'Handoff Complete',
  cancelled:  'Cancelled',
  disputed:   'Under Review',
};

export default function TransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { transactionId } = route.params;
  const { user } = useAuth();
  const { transaction, loading } = useTransaction(transactionId);

  const [otpInput, setOtpInput]     = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showOtpFallback, setShowOtpFallback] = useState(false);

  // ── Set-meetup state (seller) ──────────────────────────────────────────────
  const MEETUP_LOCATIONS = ['Library', 'Canteen', 'Admin Gate', 'Main Block', 'Hostel Block'];
  const MEETUP_TIMES     = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'];
  const MEETUP_DATES     = (() => {
    const dates: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    }
    return dates;
  })();
  const [smLocation,    setSmLocation]    = useState<string | null>(null);
  const [smDate,        setSmDate]        = useState<string | null>(null);
  const [smTime,        setSmTime]        = useState<string | null>(null);
  const [smSubmitting,  setSmSubmitting]  = useState(false);
  const [meetupActing,  setMeetupActing]  = useState(false);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.notFoundText}>Transaction not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const iAmBuyer    = user?.uid === transaction.buyerId;
  const currentStep = STATUS_FLOW.indexOf(transaction.status as TxStatus);

  const handleMessage = async () => {
    if (!user?.uid) return;
    if (!transaction.buyerId || !transaction.sellerId) {
      Alert.alert('Error', 'Transaction data is incomplete.');
      return;
    }
    try {
      const names: Record<string, string> = {
        [transaction.buyerId]:  transaction.buyerName  || 'Buyer',
        [transaction.sellerId]: transaction.sellerName || 'Seller',
      };
      const chatId = await getOrCreateChat(
        transaction.buyerId,
        transaction.sellerId,
        names,
        transaction.listingTitle,
      );
      navigation.navigate('FirebaseChat', {
        chatId,
        otherUserId:   iAmBuyer ? transaction.sellerId  : transaction.buyerId,
        otherUserName: iAmBuyer ? transaction.sellerName : transaction.buyerName,
        listingTitle:  transaction.listingTitle,
      });
    } catch (e: any) {
      Alert.alert('Could Not Open Chat', e?.message ?? 'Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Transaction',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Transaction',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateTransactionStatus(transaction.id, 'cancelled');
            } catch {
              Alert.alert('Error', 'Could not cancel. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Item card */}
      <View style={styles.itemCard}>
        {!!transaction.listingImage && (
          <Image source={{ uri: transaction.listingImage }} style={styles.itemImage} resizeMode="cover" />
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{transaction.listingTitle}</Text>
          <Text style={styles.finalPrice}>₹{transaction.amount.toLocaleString('en-IN')}</Text>
          <TransactionStatusBadge status={transaction.status as any} />
        </View>
      </View>

      {/* Fee paid badge */}
      {transaction.convenienceFeePaid && (
        <View style={styles.feePaidBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.feePaidText}>
            Convenience fee ₹{transaction.convenienceFee?.toLocaleString('en-IN')} paid via Razorpay
          </Text>
        </View>
      )}

      {/* Participants */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Participants</Text>
        <View style={styles.participantRow}>
          <View style={styles.participantItem}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantInitials}>
                {transaction.buyerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.participantRole}>Buyer</Text>
              <Text style={styles.participantName}>{transaction.buyerName}</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textTertiary} />
          <View style={styles.participantItem}>
            <View style={[styles.participantAvatar, { backgroundColor: colors.accent + '25' }]}>
              <Text style={[styles.participantInitials, { color: colors.accent }]}>
                {transaction.sellerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.participantRole}>Seller</Text>
              <Text style={styles.participantName}>{transaction.sellerName}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress stepper */}
      {transaction.status !== 'cancelled' && transaction.status !== 'disputed' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress</Text>
          {STATUS_FLOW.map((s, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            return (
              <View key={s} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, done && styles.stepDotDone, current && styles.stepDotCurrent]}>
                    {done
                      ? <Ionicons name="checkmark" size={12} color="#fff" />
                      : <View style={current ? styles.stepDotInner : undefined} />
                    }
                  </View>
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  current && styles.stepLabelCurrent,
                  done    && styles.stepLabelDone,
                ]}>
                  {STATUS_LABELS[s]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Meetup details */}
      {(transaction.meetupLocation || transaction.meetupTime || transaction.paymentMethod) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetup Details</Text>
          {transaction.meetupLocation && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.meetupLocation}</Text>
            </View>
          )}
          {transaction.meetupTime && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.meetupTime}</Text>
            </View>
          )}
          {transaction.paymentMethod && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
              <Text style={styles.detailText}>{transaction.paymentMethod}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── SELLER: Set meetup when accepted or change requested ───────── */}
      {!iAmBuyer &&
        (transaction.status === 'accepted' || transaction.meetupStatus === 'change_requested') &&
        transaction.status !== 'completed' &&
        transaction.status !== 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {transaction.meetupStatus === 'change_requested'
              ? 'Buyer Requested a Change'
              : 'Set Meetup Details'}
          </Text>
          {transaction.meetupStatus === 'change_requested' && (
            <Text style={styles.otpHint}>The buyer has asked you to change the meetup time or location.</Text>
          )}

          <Text style={styles.meetupPickerLabel}>Location</Text>
          <View style={styles.meetupOptionGrid}>
            {MEETUP_LOCATIONS.map(loc => (
              <TouchableOpacity
                key={loc}
                style={[styles.meetupChip, smLocation === loc && styles.meetupChipActive]}
                onPress={() => setSmLocation(loc)}
              >
                <Text style={[styles.meetupChipText, smLocation === loc && styles.meetupChipTextActive]}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.meetupPickerLabel}>Date</Text>
          <View style={styles.meetupOptionRow}>
            {MEETUP_DATES.map(date => (
              <TouchableOpacity
                key={date}
                style={[styles.meetupChip, smDate === date && styles.meetupChipActive]}
                onPress={() => setSmDate(date)}
              >
                <Text style={[styles.meetupChipText, smDate === date && styles.meetupChipTextActive]}>{date}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.meetupPickerLabel}>Time</Text>
          <View style={styles.meetupOptionGrid}>
            {MEETUP_TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.meetupChip, smTime === t && styles.meetupChipActive]}
                onPress={() => setSmTime(t)}
              >
                <Text style={[styles.meetupChipText, smTime === t && styles.meetupChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.setMeetupBtn, (!smLocation || !smDate || !smTime || smSubmitting) && { opacity: 0.5 }]}
            disabled={!smLocation || !smDate || !smTime || smSubmitting}
            activeOpacity={0.85}
            onPress={async () => {
              if (!smLocation || !smDate || !smTime) return;
              setSmSubmitting(true);
              try {
                await setMeetup(transaction.id, smLocation, `${smDate}, ${smTime}`);
                setSmLocation(null); setSmDate(null); setSmTime(null);
                Alert.alert('Meetup Set!', 'The buyer has been notified.');
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Could not set meetup.');
              } finally {
                setSmSubmitting(false);
              }
            }}
          >
            {smSubmitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="location-outline" size={18} color="#fff" /><Text style={styles.setMeetupBtnText}>Set Meetup</Text></>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── BUYER: Confirm or request change on meetup ─────────────────── */}
      {iAmBuyer &&
        transaction.status === 'meetup_set' &&
        transaction.meetupStatus === 'seller_set' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meetup Proposed</Text>
          <Text style={styles.otpHint}>Review the meetup details and confirm or ask the seller to change them.</Text>
          <View style={styles.meetupConfirmActions}>
            <TouchableOpacity
              style={[styles.confirmMeetupBtn, meetupActing && { opacity: 0.5 }]}
              disabled={meetupActing}
              activeOpacity={0.85}
              onPress={async () => {
                setMeetupActing(true);
                try {
                  await confirmMeetup(transaction.id);
                  Alert.alert('Meetup Confirmed!', 'You can now proceed to pay the convenience fee.');
                } catch (e: any) {
                  Alert.alert('Error', e?.message ?? 'Could not confirm meetup.');
                } finally {
                  setMeetupActing(false);
                }
              }}
            >
              {meetupActing
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" /><Text style={styles.confirmMeetupBtnText}>Confirm Meetup</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.changeMeetupBtn, meetupActing && { opacity: 0.5 }]}
              disabled={meetupActing}
              activeOpacity={0.85}
              onPress={async () => {
                setMeetupActing(true);
                try {
                  await requestMeetupChange(transaction.id);
                  Alert.alert('Change Requested', 'The seller will be notified to update the meetup details.');
                } catch (e: any) {
                  Alert.alert('Error', e?.message ?? 'Could not request change.');
                } finally {
                  setMeetupActing(false);
                }
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.changeMeetupBtnText}>Request Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── BUYER: Pay convenience fee after confirming meetup ─────────── */}
      {iAmBuyer &&
        transaction.meetupStatus === 'buyer_confirmed' &&
        !transaction.convenienceFeePaid &&
        transaction.status !== 'completed' &&
        transaction.status !== 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Your Booking</Text>
          <Text style={styles.otpHint}>Pay the small convenience fee to lock in your meetup and get your delivery QR code.</Text>
          <TouchableOpacity
            style={styles.payNowBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Meetup', { transactionId: transaction.id })}
          >
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={styles.payNowBtnText}>Pay Convenience Fee</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BUYER: Show QR code ────────────────────────────────────────────── */}
      {iAmBuyer &&
        transaction.convenienceFeePaid &&
        !!transaction.qrCodeData &&
        transaction.status !== 'completed' &&
        transaction.status !== 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Delivery QR Code</Text>
          <Text style={styles.otpHint}>
            Show this QR code to the seller when they hand over the item. Do not share it in advance.
          </Text>
          <View style={styles.qrWrapper}>
            <View style={styles.qrBox}>
              <QRCode
                value={transaction.qrCodeData}
                size={200}
                backgroundColor="#ffffff"
                color={colors.textPrimary}
              />
            </View>
            <View style={styles.qrProtectRow}>
              <Ionicons name="shield-checkmark" size={13} color={colors.success} />
              <Text style={styles.qrProtectText}>
                Protected by CampusBazaar · Single-use · Verified at meetup
              </Text>
            </View>
          </View>

          {/* OTP backup */}
          {!!transaction.deliveryOtp && (
            <View style={styles.otpBackup}>
              <Text style={styles.otpBackupLabel}>Backup OTP (if seller can't scan)</Text>
              <View style={styles.otpDisplay}>
                {transaction.deliveryOtp.split('').map((digit, i) => (
                  <View key={i} style={styles.otpDigitBox}>
                    <Text style={styles.otpDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── SELLER: Scan QR or enter OTP ──────────────────────────────────── */}
      {!iAmBuyer &&
        transaction.status !== 'completed' &&
        transaction.status !== 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirm Delivery</Text>
          <Text style={styles.otpHint}>
            Ask the buyer to show their QR code, then scan it to complete the handoff.
          </Text>

          {/* Primary: Scan QR */}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('QRScanner', { transactionId: transaction.id })}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={22} color="#fff" />
            <Text style={styles.scanBtnText}>Scan Buyer's QR Code</Text>
          </TouchableOpacity>

          {/* Fallback: OTP */}
          <TouchableOpacity
            style={styles.fallbackToggle}
            onPress={() => setShowOtpFallback(v => !v)}
          >
            <Ionicons
              name={showOtpFallback ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textTertiary}
            />
            <Text style={styles.fallbackToggleText}>
              {showOtpFallback ? 'Hide OTP fallback' : 'Camera not available? Use OTP instead'}
            </Text>
          </TouchableOpacity>

          {showOtpFallback && (
            <>
              <TextInput
                style={styles.otpInput}
                value={otpInput}
                onChangeText={v => setOtpInput(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="Enter 4-digit OTP"
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                style={[styles.confirmBtn, (otpInput.length < 4 || otpLoading) && { opacity: 0.5 }]}
                disabled={otpInput.length < 4 || otpLoading}
                onPress={async () => {
                  setOtpLoading(true);
                  try {
                    const ok = await verifyDeliveryOtp(transaction.id, otpInput);
                    if (ok) {
                      Alert.alert('Delivery Confirmed!', 'Transaction marked as complete. Please leave a review.');
                    } else {
                      Alert.alert('Wrong OTP', 'The code does not match. Please ask the buyer again.');
                    }
                  } catch {
                    Alert.alert('Error', 'Could not verify OTP. Please try again.');
                  } finally {
                    setOtpLoading(false);
                    setOtpInput('');
                  }
                }}
                activeOpacity={0.85}
              >
                {otpLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                     <Text style={styles.confirmBtnText}>Verify OTP &amp; Confirm</Text></>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Actions */}
      {transaction.status !== 'completed' && transaction.status !== 'cancelled' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.messageBtn} onPress={handleMessage} activeOpacity={0.85}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post-completion CTA */}
      {transaction.status === 'completed' && (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => navigation.navigate('Ratings', { userId: iAmBuyer ? transaction.sellerId : transaction.buyerId })}
          activeOpacity={0.85}
        >
          <Ionicons name="star-outline" size={18} color={colors.accent} />
          <Text style={styles.reviewBtnText}>Leave a Review</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  notFoundText: { fontSize: typography.sizes.md, color: colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  headerTitle:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },

  // Item card
  itemCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: spacing.xl, borderRadius: borderRadius.xl,
    overflow: 'hidden', ...shadows.medium,
  },
  itemImage:   { width: 100, height: 100 },
  itemInfo:    { flex: 1, padding: spacing.md, gap: spacing.xs },
  itemTitle:   { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  finalPrice:  { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },

  // Fee paid badge
  feePaidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.success + '12', borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.success + '30',
  },
  feePaidText: { fontSize: typography.sizes.sm, color: colors.success, fontWeight: typography.weights.medium },

  // Generic card
  card: {
    backgroundColor: '#fff', marginHorizontal: spacing.xl, marginBottom: spacing.md,
    borderRadius: borderRadius.xl, padding: spacing.xl, ...shadows.small,
  },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.lg },

  // Participants
  participantRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participantItem:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  participantAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '25', alignItems: 'center', justifyContent: 'center',
  },
  participantInitials: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  participantRole:     { fontSize: typography.sizes.xs, color: colors.textTertiary },
  participantName:     { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textPrimary },

  // Stepper
  stepRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 40 },
  stepLeft:        { alignItems: 'center', width: 24 },
  stepDot:         { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  stepDotDone:     { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotCurrent:  { backgroundColor: '#fff', borderColor: colors.primary },
  stepDotInner:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  stepLine:        { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  stepLineDone:    { backgroundColor: colors.primary },
  stepLabel:       { fontSize: typography.sizes.md, color: colors.textTertiary, paddingTop: 2, marginBottom: spacing.lg },
  stepLabelCurrent:{ color: colors.primary, fontWeight: typography.weights.semibold },
  stepLabelDone:   { color: colors.textSecondary },

  // Meetup details
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  detailText: { fontSize: typography.sizes.md, color: colors.textPrimary, fontWeight: typography.weights.medium },

  // QR code
  qrWrapper: { alignItems: 'center', paddingVertical: spacing.md },
  qrBox: {
    padding: spacing.lg, backgroundColor: '#fff',
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
    ...shadows.small,
  },
  qrProtectRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  qrProtectText: { fontSize: 11, color: colors.success, flex: 1, textAlign: 'center' },

  // OTP backup
  otpBackup:     { marginTop: spacing.lg, alignItems: 'center' },
  otpBackupLabel:{ fontSize: typography.sizes.xs, color: colors.textTertiary, marginBottom: spacing.sm },
  otpDisplay:    { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  otpDigitBox:   { width: 48, height: 56, borderRadius: borderRadius.md, backgroundColor: colors.primary + '10', borderWidth: 1.5, borderColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center' },
  otpDigit:      { fontSize: 28, fontWeight: typography.weights.extrabold, color: colors.primary },

  // Seller scan
  scanBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, ...shadows.small,
  },
  scanBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: '#fff' },

  fallbackToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.md, paddingVertical: spacing.sm,
  },
  fallbackToggleText: { fontSize: typography.sizes.xs, color: colors.textTertiary },

  // OTP fallback input
  otpHint:   { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md },
  otpInput:  {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: 24, fontWeight: typography.weights.bold, color: colors.textPrimary,
    textAlign: 'center', letterSpacing: 8, marginBottom: spacing.md, backgroundColor: colors.surface,
    marginTop: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  confirmBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  // Actions
  actionsRow: {
    flexDirection: 'row', gap: spacing.md,
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.md, paddingVertical: spacing.md,
  },
  messageBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  cancelBtn: {
    borderWidth: 1.5, borderColor: colors.error,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  cancelBtnText: { color: colors.error, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  // Set meetup pickers (seller)
  meetupPickerLabel:   { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  meetupOptionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  meetupOptionRow:     { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  meetupChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  meetupChipActive:     { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  meetupChipText:       { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  meetupChipTextActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  setMeetupBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.lg, ...shadows.small,
  },
  setMeetupBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  // Confirm/Change meetup (buyer)
  meetupConfirmActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  confirmMeetupBtn: {
    flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md, height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  confirmMeetupBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  changeMeetupBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: borderRadius.md, height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  changeMeetupBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  // Pay convenience fee (buyer)
  payNowBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.md, ...shadows.small,
  },
  payNowBtnText: { color: '#fff', fontSize: typography.sizes.md, fontWeight: typography.weights.bold },

  // Review
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: spacing.xl,
    borderWidth: 2, borderColor: colors.accent,
    borderRadius: borderRadius.md, paddingVertical: spacing.md, backgroundColor: '#fffbeb',
  },
  reviewBtnText: { color: colors.accent, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
