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
import { 
  client,
  databases, 
  account, 
  DATABASE_ID, 
  CHATS_COLLECTION_ID, 
  MESSAGES_COLLECTION_ID, 
  USERS_COLLECTION_ID 
} from '../../appwrite';

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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const flatListRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`, response => {
      if (response.events.includes(`databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents.*.create`)) {
        const newMsg = response.payload;
        
        if (newMsg.chatId === chatId) {
          setMessages(prevMessages => [...prevMessages, newMsg]);
          
          if (currentUser && newMsg.senderId !== currentUser.$id) {
            markMessageAsRead(newMsg.$id);
          }
          
          if (flatListRef.current) {
            setTimeout(() => {
              flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [chatId, currentUser]);

  const checkSession = async () => {
    try {
      const session = await account.getSession('current');
      if (session) {
        const user = await account.get();
        setCurrentUser(user);
        await fetchChatInfo(chatId, user.$id);
        await fetchMessages(chatId);
      } else {
        setIsLoading(false);
        router.push('/login');
      }
    } catch (error) {
      console.log('No active session found');
      setIsLoading(false);
      router.push('/login');
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
      
      const userProfileResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', otherUserId)]
      );
      
      if (userProfileResponse.documents.length > 0) {
        setOtherUser({
          userId: otherUserId,
          ...userProfileResponse.documents[0]
        });
      } else {
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

  const fetchMessages = async (chatId) => {
    setIsLoading(true);
    try {
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('chatId', chatId),
          Query.orderAsc('createdAt')
        ]
      );
      
      setMessages(messagesResponse.documents);
      
      if (currentUser) {
        const unreadMessages = messagesResponse.documents.filter(
          msg => !msg.isRead && msg.senderId !== currentUser.$id
        );
        
        for (const msg of unreadMessages) {
          markMessageAsRead(msg.$id);
        }
      }
      
      if (flatListRef.current && messagesResponse.documents.length > 0) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    
    try {
      const messageData = {
        chatId: chatId,
        senderId: currentUser.$id,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      setNewMessage('');
      
      await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );
      
      await databases.updateDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId,
        { updatedAt: new Date().toISOString() }
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
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
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
          ]}>
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>{item.content}</Text>
            <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
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
    <View style={styles.container}>
      {/* Chat Header */}
      {chatInfo && (
        <View style={styles.chatHeader}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {chatInfo.listingTitle}
          </Text>
          <Text style={styles.chatWith}>
            Chat with {otherUser?.displayName || 'User'}
          </Text>
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
      />
      
      {/* Keyboard Avoiding Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.mediumGray}
            multiline
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
    </View>
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
    padding: 16,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.white,
  },
  chatWith: {
    fontSize: 14,
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
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
    position: 'absolute',
    bottom: 4,
    right: 8,
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