import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { mockNotifications } from '../../data/mockData';
import { Notification, NotificationType } from '../../types';

const iconMap: Record<NotificationType, { name: string; color: string; bg: string }> = {
  message:        { name: 'chatbubble',       color: colors.info,    bg: '#eff6ff' },
  offer:          { name: 'pricetag',         color: colors.accent,  bg: '#fffbeb' },
  review:         { name: 'star',             color: colors.gold,    bg: '#fefce8' },
  listing_view:   { name: 'eye',              color: colors.primary, bg: '#f0fdf4' },
  sale:           { name: 'checkmark-circle', color: colors.success, bg: '#f0fdf4' },
  wishlist_match: { name: 'notifications',    color: colors.primary, bg: '#e8f5ee' },
  system:         { name: 'information-circle', color: colors.textSecondary, bg: colors.background },
};

function NotificationItem({ notif, onPress }: { notif: Notification; onPress: () => void }) {
  const icon = iconMap[notif.type];
  const timestamp = new Date(notif.timestamp);
  const now = new Date();
  const diffHours = Math.round((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
  const timeAgo = diffHours < 1 ? 'Just now'
    : diffHours < 24 ? `${diffHours}h ago`
    : `${Math.round(diffHours / 24)}d ago`;

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
        <Text style={styles.notifTime}>{timeAgo}</Text>
      </View>
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const grouped = {
    today: notifications.filter(n => {
      const d = new Date(n.timestamp);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }),
    earlier: notifications.filter(n => {
      const d = new Date(n.timestamp);
      const now = new Date();
      return d.toDateString() !== now.toDateString();
    }),
  };

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
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <View>
            {grouped.today.length > 0 && (
              <View>
                <Text style={styles.groupLabel}>Today</Text>
                {grouped.today.map(n => (
                  <NotificationItem key={n.id} notif={n} onPress={() => markRead(n.id)} />
                ))}
              </View>
            )}
            {grouped.earlier.length > 0 && (
              <View>
                <Text style={styles.groupLabel}>Earlier</Text>
                {grouped.earlier.map(n => (
                  <NotificationItem key={n.id} notif={n} onPress={() => markRead(n.id)} />
                ))}
              </View>
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
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
