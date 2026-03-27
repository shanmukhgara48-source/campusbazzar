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
  chat, onPress,
}: {
  chat: FSChat;
  currentUid: string;
  onPress: () => void;
}) {
  const otherName = chat.otherUserName ?? 'Unknown';
  const unread    = chat.unreadCount ?? 0;
  const initials  = otherName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[
        s.chatItem,
        { backgroundColor: unread > 0 ? colors.primary + '10' : colors.surface },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>

      <View style={s.chatContent}>
        <View style={s.chatTopRow}>
          <Text style={[s.chatName, { fontWeight: unread > 0 ? typography.weights.bold : typography.weights.medium }]} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={[s.chatTime, { color: unread > 0 ? colors.primary : colors.textTertiary, fontWeight: unread > 0 ? typography.weights.semibold : typography.weights.regular }]}>
            {formatTime(chat.lastMessageAt)}
          </Text>
        </View>

        {!!chat.listingTitle && (
          <View style={s.listingRow}>
            <Ionicons name="pricetag-outline" size={10} color={colors.textTertiary} />
            <Text style={s.listingTitle} numberOfLines={1}>{chat.listingTitle}</Text>
          </View>
        )}

        <View style={s.chatBottomRow}>
          <Text
            style={[s.lastMessage, { color: unread > 0 ? colors.textPrimary : colors.textSecondary, fontWeight: unread > 0 ? typography.weights.semibold : typography.weights.regular }]}
            numberOfLines={1}
          >
            {chat.lastMessage || 'No messages yet'}
          </Text>
          {unread > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen({ navigation }: Props) {
  const insets    = useSafeAreaInsets();
  const { user }  = useAuth();
  const { chats, loading, error } = useUserChats(user?.uid);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
        {chats.length > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{chats.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="warning-outline" size={48} color={colors.error} />
          <Text style={s.emptyTitle}>Could not load chats</Text>
          <Text style={[s.emptySubtitle, { color: colors.error }]}>{error}</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
          <Text style={s.emptyTitle}>No messages yet</Text>
          <Text style={s.emptySubtitle}>
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
                  otherUserId:   item.otherUserId,
                  otherUserName: item.otherUserName,
                  listingTitle:  item.listingTitle ?? '',
                })
              }
            />
          )}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, gap: spacing.sm },
  headerTitle:     { flex: 1, fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  headerBadge:     { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, backgroundColor: colors.primary + '15' },
  headerBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  emptyTitle:      { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  emptySubtitle:   { fontSize: typography.sizes.sm, textAlign: 'center', color: colors.textTertiary },
  list:            { paddingTop: spacing.sm },
  chatItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  avatar:          { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0, backgroundColor: colors.primary + '25' },
  avatarText:      { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },
  chatContent:     { flex: 1, gap: 3 },
  chatTopRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName:        { flex: 1, fontSize: typography.sizes.md, marginRight: spacing.sm, color: colors.textPrimary },
  chatTime:        { fontSize: typography.sizes.xs },
  listingRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingTitle:    { fontSize: typography.sizes.xs, color: colors.textTertiary },
  chatBottomRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage:     { flex: 1, fontSize: typography.sizes.sm, marginRight: spacing.sm },
  unreadBadge:     { borderRadius: borderRadius.full, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: colors.primary },
  unreadText:      { fontSize: 11, fontWeight: typography.weights.bold, color: colors.textInverse },
  separator:       { height: 1, marginLeft: spacing.xl + 52 + spacing.md, backgroundColor: colors.borderLight },
});
