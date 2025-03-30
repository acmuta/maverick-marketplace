import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
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
} from '../../appwrite/config';

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
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
      
      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
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
            color={!newMessage.trim() ? '#A9A9A9' : '#fff'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chatWith: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
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
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 16,
    marginRight: 40,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
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
    backgroundColor: '#e0e0e0',
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});