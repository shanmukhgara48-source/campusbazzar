import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useMessages, sendMessage, markChatRead, FSMessage } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'FirebaseChat'>;
  route: RouteProp<HomeStackParamList, 'FirebaseChat'>;
};

export default function FirebaseChatScreen({ navigation, route }: Props) {
  const { chatId, otherUserName, listingTitle } = route.params;
  const { user } = useAuth();

  // Debug: both buyer and seller must print the SAME chatId
  console.log('[FirebaseChat] chatId:', chatId, '| uid:', user?.uid);
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { messages, loading, error } = useMessages(chatId);
  const flatListRef = useRef<FlatList>(null);

  // Mark this chat as read when the screen mounts and whenever new messages arrive
  useEffect(() => {
    if (user?.uid && chatId) markChatRead(chatId, user.uid).catch(console.warn);
  }, [chatId, user?.uid, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(chatId, user.uid, trimmed);
    } catch (e) {
      console.log('[FirebaseChatScreen] send error:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value: unknown) => {
    if (!value) return '';
    const date = (value as any)?.toDate?.() ?? new Date(value as string);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderMessage = ({ item }: { item: FSMessage }) => {
    const isMine = item.senderId === user?.uid;

    if (item.type === 'offer') {
      return (
        <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
          <View style={[styles.offerCard, isMine ? styles.offerCardMine : styles.offerCardTheirs]}>
            <View style={styles.offerHeader}>
              <Ionicons name="pricetag" size={13} color={isMine ? 'rgba(255,255,255,0.85)' : colors.primary} />
              <Text style={[styles.offerLabel, isMine && styles.offerLabelMine]}>Offer sent</Text>
            </View>
            <Text style={[styles.offerPrice, isMine && styles.offerPriceMine]}>
              ₹{item.offerPrice?.toLocaleString('en-IN')}
            </Text>
            {!!item.listingTitle && (
              <Text style={[styles.offerTitle, isMine && styles.offerTitleMine]} numberOfLines={1}>
                {item.listingTitle}
              </Text>
            )}
            <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.textMine : styles.textTheirs]}>
            {item.text}
          </Text>
          <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{listingTitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load messages.</Text>
          <Text style={[styles.emptyText, { fontSize: 11, marginTop: 4 }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
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
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={18} color={text.trim() ? '#fff' : colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: spacing.sm },
  headerName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  headerSub:  { fontSize: typography.sizes.xs, color: colors.textTertiary },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:  { color: colors.textTertiary, fontSize: typography.sizes.sm },
  list:       { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  row:        { flexDirection: 'row', marginBottom: spacing.xs },
  rowRight:   { justifyContent: 'flex-end' },
  rowLeft:    { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  bubbleMine:   { backgroundColor: colors.messageSent, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.messageReceived, borderBottomLeftRadius: 4 },
  bubbleText:   { fontSize: typography.sizes.md, lineHeight: 22 },
  textMine:     { color: '#fff' },
  textTheirs:   { color: colors.textPrimary },
  time:         { fontSize: 10, marginTop: 3, textAlign: 'right' },
  timeMine:     { color: 'rgba(255,255,255,0.7)' },
  timeTheirs:   { color: colors.textTertiary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1, backgroundColor: colors.background,
    borderRadius: borderRadius.lg, paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
    minHeight: 40, justifyContent: 'center',
  },
  input:          { fontSize: typography.sizes.md, color: colors.textPrimary, maxHeight: 100 },
  // ── Offer card ────────────────────────────────────────────────────────────
  offerCard: {
    maxWidth: '75%', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    minWidth: 160,
  },
  offerCardMine:   { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  offerCardTheirs: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary + '40', borderBottomLeftRadius: 4 },
  offerHeader:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  offerLabel:      { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  offerLabelMine:  { color: 'rgba(255,255,255,0.85)' },
  offerPrice:      { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.primary, marginBottom: 2 },
  offerPriceMine:  { color: '#fff' },
  offerTitle:      { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 4 },
  offerTitleMine:  { color: 'rgba(255,255,255,0.75)' },
  // ─────────────────────────────────────────────────────────────────────────
  sendBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: colors.border },
});
