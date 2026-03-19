import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MessagesStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { mockChatMessages, mockConversations, CURRENT_USER_ID } from '../../data/mockData';
import { Message } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;
  route: RouteProp<MessagesStackParamList, 'Chat'>;
};

export default function ChatScreen({ navigation, route }: Props) {
  const { conversationId, otherUserName, listingTitle } = route.params;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>(
    mockChatMessages[conversationId] || []
  );
  const flatListRef = useRef<FlatList>(null);
  const conv = mockConversations.find(c => c.id === conversationId);

  const SCAM_PATTERNS = [
    /\b\d{10}\b/,
    /\botp\b/i,
    /advance/i,
    /payment\s*first/i,
    /urgent/i,
  ];

  const isUnsafe = (msg: string) => SCAM_PATTERNS.some(p => p.test(msg));

  const doSend = () => {
    const newMsg: Message = {
      id: `msg_new_${Date.now()}`,
      conversationId,
      senderId: CURRENT_USER_ID,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'text',
    };
    setMessages(prev => [...prev, newMsg]);
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    if (isUnsafe(text)) {
      Alert.alert(
        '⚠️ Unsafe Message Detected',
        'This message may be unsafe. Avoid sharing phone numbers, OTPs, or making advance payments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Anyway', style: 'destructive', onPress: doSend },
        ],
      );
      return;
    }
    doSend();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.senderId === CURRENT_USER_ID;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== item.senderId);

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isMine && (
          <View style={styles.avatarSpace}>
            {showAvatar && conv && (
              <Image source={{ uri: conv.otherUser.avatar }} style={styles.msgAvatar} />
            )}
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMine && (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={12}
                color={item.isRead ? colors.accentLight : 'rgba(255,255,255,0.6)'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {conv && (
            <Image source={{ uri: conv.otherUser.avatar }} style={styles.headerAvatar} />
          )}
          <View>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>{otherUserName}</Text>
              {conv?.otherUser.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
              )}
            </View>
            <Text style={styles.headerSub} numberOfLines={1}>{listingTitle}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Listing preview */}
      {conv && (
        <View style={styles.listingBanner}>
          <Image source={{ uri: conv.listing.images[0] }} style={styles.listingBannerImg} />
          <View style={styles.listingBannerInfo}>
            <Text style={styles.listingBannerTitle} numberOfLines={1}>{conv.listing.title}</Text>
            <Text style={styles.listingBannerPrice}>₹{conv.listing.price.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: conv.listing.status === 'active' ? colors.success : colors.warning }]} />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="attach" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={18} color={text.trim() ? '#fff' : colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  listingBannerImg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  listingBannerInfo: {
    flex: 1,
  },
  listingBannerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  listingBannerPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  avatarSpace: {
    width: 30,
    height: 30,
    marginRight: spacing.xs,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.messageSent,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.messageReceived,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextTheirs: {
    color: colors.textPrimary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 3,
  },
  bubbleTime: {
    fontSize: 10,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  bubbleTimeTheirs: {
    color: colors.textTertiary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
});
