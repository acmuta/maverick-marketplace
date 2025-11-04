import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ID, Query } from 'react-native-appwrite';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  client,
  databases,
  DATABASE_ID,
  CHATS_COLLECTION_ID,
  MESSAGES_COLLECTION_ID,
  USERS_COLLECTION_ID
} from '../../appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

// Define consistent theme colors
const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  lightBlue: '#1565C0',
  orange: '#FF6F00', 
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  mediumGray: '#B0BEC5',
  darkGray: '#546E7A',
  error: '#FF5252',
  background: '#0A1929',
  cardBackground: '#0F2942',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
};

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { user: currentUser } = useAuth(); // Use cached user from AuthContext
  const { getCachedMessages, refreshMessages, sendMessage: sendMessageContext } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null); // Guard against duplicate subscriptions
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Load chat info and messages on mount
  useEffect(() => {
    if (currentUser && chatId) {
      loadChat();
    } else if (!currentUser) {
      setIsLoading(false);
      router.push('/login');
    }
  }, [chatId, currentUser]);

  // WebSocket subscription with duplicate prevention
  useEffect(() => {
    if (!chatId || !currentUser || subscriptionRef.current) return;

    // Guard against duplicate subscriptions
    subscriptionRef.current = true;

    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`, response => {
      if (response.events.includes(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents.*.create`)) {
        const newMsg = response.payload;

        if (newMsg.chatId === chatId) {
          // Don't add message from WebSocket if it was sent by current user
          // (it's already in the array from optimistic update)
          if (newMsg.senderId === currentUser.$id) {
            // Just replace the temp message with the real one
            setMessages(prevMessages => {
              // Find and replace any temp message
              const hasTempMessage = prevMessages.some(m => m.$id.startsWith('temp_'));
              if (hasTempMessage) {
                return prevMessages.map(m =>
                  m.$id.startsWith('temp_') && m.content === newMsg.content
                    ? newMsg
                    : m
                );
              }
              // If no temp message found, it might be from refresh, check for duplicate
              const exists = prevMessages.some(m => m.$id === newMsg.$id);
              if (exists) return prevMessages;
              return [...prevMessages, newMsg];
            });
            return; // Don't process further for own messages
          }

          // For messages from other users, check for duplicates and add
          setMessages(prevMessages => {
            const exists = prevMessages.some(m => m.$id === newMsg.$id);
            if (exists) return prevMessages;
            return [...prevMessages, newMsg];
          });

          // Mark other user's messages as read
          markMessageAsRead(newMsg.$id);

          if (flatListRef.current) {
            setTimeout(() => {
              flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      }
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe();
    };
  }, [chatId, currentUser]);

  const loadChat = async () => {
    if (!currentUser || !chatId) return;

    try {
      // Load messages from cache FIRST for instant display (non-blocking)
      const cachedMessages = await getCachedMessages(chatId);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        setIsLoading(false); // Show cached messages immediately
      }

      // Fetch chat info in parallel with message refresh
      const [_, freshMessages] = await Promise.all([
        fetchChatInfo(chatId, currentUser.$id),
        refreshMessages(chatId)
      ]);

      setMessages(freshMessages);
      setIsLoading(false); // Ensure loading is false even without cache

      // Mark unread messages as read
      const unreadMessages = freshMessages.filter(
        msg => !msg.isRead && msg.senderId !== currentUser.$id
      );
      for (const msg of unreadMessages) {
        markMessageAsRead(msg.$id);
      }

      // Scroll to bottom
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setIsLoading(false);
    }
  };
  
  const fetchChatInfo = async (chatId, userId) => {
    try {
      const chatResponse = await databases.getDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId
      );
      
      setChatInfo(chatResponse);
      
      const otherUserId = chatResponse.buyerId === userId
        ? chatResponse.sellerId
        : chatResponse.buyerId;

      try {
        // Use getDocument with account ID directly
        const otherUserProfile = await databases.getDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          otherUserId
        );

        setOtherUser({
          userId: otherUserId,
          ...otherUserProfile
        });
      } catch (error) {
        console.error('Error fetching other user profile:', error);
        setOtherUser({
          userId: otherUserId,
          displayName: 'Unknown User'
        });
      }
      
      if (chatResponse.buyerId !== userId && chatResponse.sellerId !== userId) {
        Alert.alert('Error', 'You are not authorized to view this chat');
        router.back();
      }
      
    } catch (error) {
      console.error('Error fetching chat info:', error);
      Alert.alert('Error', 'Failed to load chat information');
      router.back();
    }
  };

  // Removed fetchMessages - now using getCachedMessages and refreshMessages from ChatContext

  const markMessageAsRead = async (messageId) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        messageId,
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Send message with optimistic UI update
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Use ChatContext sendMessage with optimistic update callbacks
    await sendMessageContext(
      chatId,
      messageContent,
      // Optimistic update callback
      (optimisticMessage) => {
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);

        // Scroll to bottom
        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 100);
        }
      },
      // Success callback
      (realMessage, tempId) => {
        setMessages(prevMessages =>
          prevMessages.map(m => m.$id === tempId ? realMessage : m)
        );
      },
      // Error callback
      (error, tempId) => {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');

        // Mark message as failed
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m.$id === tempId ? { ...m, isSending: false, sendFailed: true } : m
          )
        );
      }
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const renderDateSeparator = (dateString) => {
    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateSeparatorText}>{formatDate(dateString)}</Text>
      </View>
    );
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = currentUser && item.senderId === currentUser.$id;

    const showDateSeparator = index === 0 ||
      formatDate(messages[index - 1].createdAt) !== formatDate(item.createdAt);

    return (
      <View>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
        ]}>
          <View style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            item.sendFailed && styles.failedMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>{item.content}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
              {isCurrentUser && item.isSending && (
                <ActivityIndicator size="small" color="#fff" style={styles.sendingIndicator} />
              )}
              {isCurrentUser && item.sendFailed && (
                <Ionicons name="alert-circle" size={12} color="#FF5252" style={styles.failedIcon} />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.orange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Chat Header */}
      {chatInfo && (
        <View style={[styles.chatHeader, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.chatHeaderContent}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {chatInfo.listingTitle}
            </Text>
            <Text style={styles.otherUserName}>
              {otherUser?.displayName || 'User'}
            </Text>
          </View>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.$id}
        contentContainerStyle={styles.messagesContainer}
        style={styles.messagesList}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.mediumGray}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={!newMessage.trim() ? COLORS.mediumGray : COLORS.white}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 1,
    color: COLORS.white,
  },
  otherUserName: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
    backgroundColor: COLORS.darkBlue,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: COLORS.orange,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: COLORS.mediumBlue,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    fontSize: 16,
    marginRight: 40,
  },
  currentUserText: {
    color: COLORS.white,
  },
  otherUserText: {
    color: COLORS.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  sendingIndicator: {
    marginLeft: 4,
  },
  failedIcon: {
    marginLeft: 4,
  },
  failedMessageBubble: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  dateSeparator: {
    alignItems: 'center',
    margin: 8,
  },
  dateSeparatorText: {
    backgroundColor: COLORS.mediumBlue,
    color: COLORS.brightOrange,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  messagesList: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 0 : 60, // Android needs some bottom padding
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    backgroundColor: COLORS.mediumBlue,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.darkGray,
  },
});