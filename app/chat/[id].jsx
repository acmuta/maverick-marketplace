import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { client, databases, DATABASE_ID, MESSAGES_COLLECTION_ID, CHATS_COLLECTION_ID, USERS_COLLECTION_ID } from '../../appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Appbar, Text, useTheme, Avatar, ActivityIndicator, IconButton, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const { getCachedMessages, refreshMessages, sendMessage: sendMessageContext } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    if (currentUser && chatId) {
      loadChat();
    } else if (!currentUser) {
      setIsLoading(false);
      router.push('/login');
    }
  }, [chatId, currentUser]);

  useEffect(() => {
    if (!chatId || !currentUser || subscriptionRef.current) return;
    subscriptionRef.current = true;
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`, response => {
      if (response.events.includes(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents.*.create`)) {
        const newMsg = response.payload;
        if (newMsg.chatId === chatId) {
          if (newMsg.senderId === currentUser.$id) {
            setMessages(prev => {
              if (prev.some(m => m.$id.startsWith('temp_') && m.content === newMsg.content)) {
                return prev.map(m => m.$id.startsWith('temp_') && m.content === newMsg.content ? newMsg : m);
              }
              if (prev.some(m => m.$id === newMsg.$id)) return prev;
              return [...prev, newMsg];
            });
          } else {
            setMessages(prev => prev.some(m => m.$id === newMsg.$id) ? prev : [...prev, newMsg]);
            markMessageAsRead(newMsg.$id);
          }
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    });

    return () => { subscriptionRef.current = false; unsubscribe(); };
  }, [chatId, currentUser]);

  const loadChat = async () => {
    if (!currentUser || !chatId) return;
    try {
      const cached = await getCachedMessages(chatId);
      if (cached.length > 0) { setMessages(cached); setIsLoading(false); }

      const [_, freshMessages] = await Promise.all([
        fetchChatInfo(chatId, currentUser.$id),
        refreshMessages(chatId)
      ]);
      setMessages(freshMessages);
      setIsLoading(false);
      const unread = freshMessages.filter(m => !m.isRead && m.senderId !== currentUser.$id);
      unread.forEach(m => markMessageAsRead(m.$id));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const fetchChatInfo = async (chatId, userId) => {
    try {
      const chat = await databases.getDocument(DATABASE_ID, CHATS_COLLECTION_ID, chatId);
      setChatInfo(chat);
      const otherId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
      try {
        const other = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, otherId);
        setOtherUser({ userId: otherId, ...other });
      } catch { setOtherUser({ userId: otherId, displayName: 'Unknown User' }); }
    } catch { Alert.alert('Error', 'Failed to load chat'); router.back(); }
  };

  const markMessageAsRead = async (msgId) => {
    try { await databases.updateDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, msgId, { isRead: true }); } catch (e) { }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const content = newMessage.trim();
    setNewMessage('');
    await sendMessageContext(chatId, content,
      (opt) => {
        setMessages(prev => [...prev, opt]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (real, tempId) => setMessages(prev => prev.map(m => m.$id === tempId ? real : m)),
      (err, tempId) => {
        Alert.alert('Error', 'Failed to send');
        setMessages(prev => prev.map(m => m.$id === tempId ? { ...m, isSending: false, sendFailed: true } : m));
      }
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = currentUser && item.senderId === currentUser.$id;
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginVertical: 4, paddingHorizontal: 16
      }}>
        {!isMe && (
          <Avatar.Text
            size={28}
            label={otherUser?.displayName?.charAt(0).toUpperCase() || '?'}
            style={{ backgroundColor: colors.secondaryContainer, marginRight: 8, alignSelf: 'flex-end' }}
            color={colors.primary}
          />
        )}
        <View style={{
          maxWidth: '75%',
          padding: 12,
          borderRadius: 20,
          backgroundColor: isMe ? colors.primary : colors.surface,
          borderWidth: isMe ? 0 : 1,
          borderColor: colors.outline,
          borderBottomRightRadius: isMe ? 4 : 20,
          borderBottomLeftRadius: isMe ? 20 : 4
        }}>
          <Text style={{ color: isMe ? 'white' : colors.onSurface, fontSize: 16 }}>{item.content}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.7)' : colors.secondary, marginRight: 4 }}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.isSending && <ActivityIndicator size={10} color="white" />}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.outline, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} iconColor={colors.primary} />
          <View style={{ flex: 1, marginLeft: 0 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{otherUser?.displayName || 'Chat'}</Text>
            {chatInfo && <Text variant="labelSmall" style={{ color: colors.secondary }} numberOfLines={1}>{chatInfo.listingTitle}</Text>}
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.$id}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
      />

      {/* Input */}
      <View style={{
        padding: 12,
        paddingBottom: insets.bottom + 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.outline,
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.secondary}
          multiline
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            minHeight: 40,
            maxHeight: 100,
            fontSize: 16,
            marginRight: 8
          }}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: newMessage.trim() ? colors.primary : colors.secondaryContainer,
            justifyContent: 'center', alignItems: 'center', marginBottom: 2
          }}
        >
          <Ionicons name="send" size={18} color={newMessage.trim() ? 'white' : colors.secondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({});