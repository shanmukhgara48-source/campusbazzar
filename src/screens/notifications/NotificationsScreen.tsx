import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  FSNotification,
  FSNotifType,
} from '../../services/notificationsService';

const iconMap: Record<FSNotifType, { name: string; color: string; bg: string }> = {
  message:        { name: 'chatbubble',         color: colors.info,          bg: '#eff6ff' },
  offer:          { name: 'pricetag',            color: colors.accent,        bg: '#fffbeb' },
  review:         { name: 'star',                color: colors.gold,          bg: '#fefce8' },
  listing_view:   { name: 'eye',                 color: colors.primary,       bg: '#f0fdf4' },
  sale:           { name: 'checkmark-circle',    color: colors.success,       bg: '#f0fdf4' },
  wishlist_match: { name: 'notifications',       color: colors.primary,       bg: '#e8f5ee' },
  system:         { name: 'information-circle',  color: colors.textSecondary, bg: colors.background },
};

function timeAgo(value: unknown): string {
  if (!value) return '';
  const date = (value as any)?.toDate?.() ?? new Date(value as string);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function NotificationItem({
  notif,
  onPress,
}: {
  notif: FSNotification;
  onPress: () => void;
}) {
  const icon = iconMap[notif.type] ?? iconMap.system;
  return (
    <TouchableOpacity
      style={[styles.notifItem, !notif.isRead && styles.notifItemUnread]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name as any} size={20} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]}>
          {notif.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
      </View>
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, unreadCount, loading } = useNotifications(user?.uid);

  const handleMarkRead = (notif: FSNotification) => {
    if (!notif.isRead) markNotificationRead(notif.id).catch(console.warn);
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    markAllNotificationsRead(unreadIds).catch(console.warn);
  };

  // Group into Today vs Earlier
  const today = new Date().toDateString();
  const grouped = notifications.reduce<{ today: FSNotification[]; earlier: FSNotification[] }>(
    (acc, n) => {
      const d = (n.createdAt as any)?.toDate?.() ?? new Date(n.createdAt as string);
      if (d.toDateString() === today) acc.today.push(n);
      else acc.earlier.push(n);
      return acc;
    },
    { today: [], earlier: [] },
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            We'll notify you about messages, offers, and activity
          </Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={() => (
            <View>
              {grouped.today.length > 0 && (
                <View>
                  <Text style={styles.groupLabel}>Today</Text>
                  {grouped.today.map(n => (
                    <NotificationItem key={n.id} notif={n} onPress={() => handleMarkRead(n)} />
                  ))}
                </View>
              )}
              {grouped.earlier.length > 0 && (
                <View>
                  <Text style={styles.groupLabel}>Earlier</Text>
                  {grouped.earlier.map(n => (
                    <NotificationItem key={n.id} notif={n} onPress={() => handleMarkRead(n)} />
                  ))}
                </View>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  markAllBtn: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  markAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  groupLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  notifItemUnread: {
    backgroundColor: '#f8fffe',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  notifTitleUnread: {
    fontWeight: typography.weights.bold,
  },
  notifBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    flexShrink: 0,
  },
});
