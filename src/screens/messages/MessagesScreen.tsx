import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessagesStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { mockConversations, CURRENT_USER_ID } from '../../data/mockData';
import { Conversation } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;
};

function ConversationItem({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const isUnread = conv.unreadCount > 0;
  const isMyMessage = conv.lastMessage.senderId === CURRENT_USER_ID;
  const timestamp = new Date(conv.lastMessage.timestamp);
  const timeStr = timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <TouchableOpacity style={[styles.convItem, isUnread && styles.convItemUnread]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: conv.otherUser.avatar }} style={styles.avatar} />
        {conv.otherUser.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
          </View>
        )}
      </View>

      <View style={styles.convContent}>
        <View style={styles.convTopRow}>
          <Text style={[styles.convName, isUnread && styles.convNameUnread]}>
            {conv.otherUser.name}
          </Text>
          <Text style={[styles.convTime, isUnread && styles.convTimeUnread]}>{timeStr}</Text>
        </View>

        <View style={styles.listingPreview}>
          <Ionicons name="pricetag-outline" size={10} color={colors.textTertiary} />
          <Text style={styles.listingTitle} numberOfLines={1}>{conv.listing.title}</Text>
          <Text style={styles.listingPrice}>₹{conv.listing.price.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.convBottomRow}>
          <View style={styles.lastMessageRow}>
            {isMyMessage && (
              <Ionicons name="checkmark-done" size={14} color={conv.lastMessage.isRead ? colors.primary : colors.textTertiary} />
            )}
            <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {conv.lastMessage.text}
            </Text>
          </View>
          {conv.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newBtn}>
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {mockConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>Start a conversation by tapping a listing</Text>
        </View>
      ) : (
        <FlatList
          data={mockConversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conv={item}
              onPress={() => navigation.navigate('Chat', {
                conversationId: item.id,
                otherUserName: item.otherUser.name,
                listingTitle: item.listing.title,
              })}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: spacing.sm,
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  convItemUnread: {
    backgroundColor: '#f0f7f3',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  convName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  convNameUnread: {
    fontWeight: typography.weights.bold,
  },
  convTime: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  convTimeUnread: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  listingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  listingTitle: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  listingPrice: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
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
  unreadCount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.xl + 54 + spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
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
});
