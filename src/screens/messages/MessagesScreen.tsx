import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useUserChats, FSChat } from '../../services/chatService';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;
};

function formatTime(value: unknown): string {
  if (!value) return '';
  const date = (value as any)?.toDate?.() ?? new Date(value as string);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return `${Math.floor(diffMins / 1440)}d`;
}

function ChatItem({
  chat,
  currentUid,
  onPress,
}: {
  chat: FSChat;
  currentUid: string;
  onPress: () => void;
}) {
  const otherUid = chat.participants.find(p => p !== currentUid) ?? '';
  const otherName = chat.participantNames?.[otherUid] ?? 'Unknown';
  const unread = chat.unreadCounts?.[currentUid] ?? 0;
  const initials = otherName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.chatItem, unread > 0 && styles.chatItemUnread]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Avatar — initials fallback since we don't store avatar URLs in chat doc */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={[styles.chatName, unread > 0 && styles.chatNameUnread]} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={[styles.chatTime, unread > 0 && styles.chatTimeUnread]}>
            {formatTime(chat.lastMessageAt)}
          </Text>
        </View>

        {!!chat.listingTitle && (
          <View style={styles.listingRow}>
            <Ionicons name="pricetag-outline" size={10} color={colors.textTertiary} />
            <Text style={styles.listingTitle} numberOfLines={1}>{chat.listingTitle}</Text>
          </View>
        )}

        <View style={styles.chatBottomRow}>
          <Text
            style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {chat.lastMessage || 'No messages yet'}
          </Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { chats, loading, error } = useUserChats(user?.uid);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {chats.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{chats.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Could not load chats</Text>
          <Text style={[styles.emptySubtitle, { color: colors.error }]}>{error}</Text>
          {error.includes('index') && (
            <Text style={styles.emptySubtitle}>
              A Firestore composite index is missing.{'\n'}
              Deploy firestore.indexes.json to fix this.
            </Text>
          )}
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation by tapping Message on a listing
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatItem
              chat={item}
              currentUid={user?.uid ?? ''}
              onPress={() =>
                navigation.navigate('FirebaseChat', {
                  chatId:        item.id,
                  otherUserId:   item.participants.find(p => p !== user?.uid) ?? '',
                  otherUserName: item.participantNames?.[
                    item.participants.find(p => p !== user?.uid) ?? ''
                  ] ?? 'Unknown',
                  listingTitle:  item.listingTitle ?? '',
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerBadge: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  headerBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
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
  list: {
    paddingTop: spacing.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  chatItemUnread: {
    backgroundColor: '#f0f9f4',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  chatContent: {
    flex: 1,
    gap: 3,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  chatNameUnread: {
    fontWeight: typography.weights.bold,
  },
  chatTime: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  chatTimeUnread: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingTitle: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  lastMessageUnread: {
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.xl + 52 + spacing.md,
  },
});
