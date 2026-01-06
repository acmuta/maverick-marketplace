import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ID, Query, Permission, Role } from 'react-native-appwrite';
import { databases, DATABASE_ID, CHATS_COLLECTION_ID, MESSAGES_COLLECTION_ID, USERS_COLLECTION_ID } from '../../appwrite';
import { useAuth } from './AuthContext';

const ChatContext = createContext({
  chats: [],
  isLoadingChats: true,
  getCachedMessages: async () => [],
  refreshMessages: async () => { },
  sendMessage: async () => { },
  refreshChats: async () => { },
  clearCache: async () => { },
});

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [messageCache, setMessageCache] = useState({}); // In-memory cache for fast access

  // Cache expiration time (5 minutes)
  const CACHE_EXPIRATION = 5 * 60 * 1000;

  // Load cached chats on mount and clear on logout
  useEffect(() => {
    if (user) {
      loadCachedChats();
    } else {
      // User logged out - clear all cache
      setChats([]);
      setMessageCache({});
      setIsLoadingChats(false);

      // Clear AsyncStorage cache
      clearCacheOnLogout();
    }
  }, [user]);

  const clearCacheOnLogout = async () => {
    try {
      // Clear all chat and message caches
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key =>
        key.startsWith('user_chats_') || key.startsWith('chat_messages_')
      );
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
      }
    } catch (error) {
      console.error('Error clearing cache on logout:', error);
    }
  };

  // Load chats from cache
  const loadCachedChats = async () => {
    if (!user) return;

    try {
      // First, try to load from cache for instant display
      const cachedChats = await AsyncStorage.getItem(`user_chats_${user.$id}`);
      if (cachedChats) {
        const parsed = JSON.parse(cachedChats);
        setChats(parsed.chats);
        setIsLoadingChats(false); // Show cached data immediately

        // Check if cache is expired
        const now = Date.now();
        if (now - parsed.timestamp > CACHE_EXPIRATION) {
          // Cache expired, refresh in background
          refreshChats();
        }
      } else {
        // No cache, fetch from API
        await refreshChats();
      }
    } catch (error) {
      console.error('Error loading cached chats:', error);
      await refreshChats();
    }
  };

  // Refresh chats from API
  const refreshChats = async () => {
    if (!user) {
      setIsLoadingChats(false);
      return;
    }

    try {
      const [buyerChatsResponse, sellerChatsResponse] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          CHATS_COLLECTION_ID,
          [
            Query.equal('buyerId', user.$id),
            Query.orderDesc('updatedAt')
          ]
        ),
        databases.listDocuments(
          DATABASE_ID,
          CHATS_COLLECTION_ID,
          [
            Query.equal('sellerId', user.$id),
            Query.orderDesc('updatedAt')
          ]
        )
      ]);

      const chatMap = new Map();
      [...buyerChatsResponse.documents, ...sellerChatsResponse.documents].forEach(chat => {
        chatMap.set(chat.$id, chat);
      });
      const userChats = Array.from(chatMap.values()).sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      // Fetch user profiles for chat participants
      const enhancedChats = await Promise.all(
        userChats.map(async (chat) => {
          const otherUserId = chat.buyerId === user.$id ? chat.sellerId : chat.buyerId;

          try {
            const otherUserProfile = await databases.getDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              otherUserId
            );

            return {
              ...chat,
              otherUser: {
                userId: otherUserId,
                displayName: otherUserProfile.displayName || 'Unknown User'
              }
            };
          } catch (error) {
            console.log(`Error fetching profile for user ${otherUserId}:`, error);
            return {
              ...chat,
              otherUser: {
                userId: otherUserId,
                displayName: 'Unknown User'
              }
            };
          }
        })
      );

      setChats(enhancedChats);

      // Update cache
      await AsyncStorage.setItem(
        `user_chats_${user.$id}`,
        JSON.stringify({
          chats: enhancedChats,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Get cached messages for a specific chat
  const getCachedMessages = useCallback(async (chatId) => {
    if (!user) return [];

    try {
      // First check in-memory cache
      if (messageCache[chatId]) {
        const cached = messageCache[chatId];
        const now = Date.now();

        // Return cached messages if not expired
        if (now - cached.timestamp < CACHE_EXPIRATION) {
          return cached.messages;
        }
      }

      // Load from AsyncStorage
      const cachedMessages = await AsyncStorage.getItem(`chat_messages_${chatId}`);
      if (cachedMessages) {
        const parsed = JSON.parse(cachedMessages);

        // Update in-memory cache
        setMessageCache(prev => ({
          ...prev,
          [chatId]: {
            messages: parsed.messages,
            timestamp: parsed.timestamp
          }
        }));

        return parsed.messages;
      }

      return [];
    } catch (error) {
      console.error('Error getting cached messages:', error);
      return [];
    }
  }, [user, messageCache]);

  // Refresh messages from API and update cache
  const refreshMessages = useCallback(async (chatId) => {
    if (!user) return [];

    try {
      const messagesResponse = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [
          Query.equal('chatId', chatId),
          Query.orderAsc('createdAt'),
          Query.limit(100) // Last 100 messages
        ]
      );

      const messages = messagesResponse.documents;

      // Update in-memory cache
      setMessageCache(prev => ({
        ...prev,
        [chatId]: {
          messages,
          timestamp: Date.now()
        }
      }));

      // Update AsyncStorage cache
      await AsyncStorage.setItem(
        `chat_messages_${chatId}`,
        JSON.stringify({
          messages,
          timestamp: Date.now()
        })
      );

      return messages;
    } catch (error) {
      console.error('Error refreshing messages:', error);
      return [];
    }
  }, [user]);

  // Send message with optimistic update
  const sendMessage = useCallback(async (chatId, content, onOptimisticUpdate, onSuccess, onError) => {
    if (!user || !content.trim()) return null;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      $id: tempId,
      chatId,
      senderId: user.$id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true
    };

    // Call optimistic update callback (for UI)
    if (onOptimisticUpdate) {
      onOptimisticUpdate(optimisticMessage);
    }

    // Update in-memory cache with optimistic message
    if (messageCache[chatId]) {
      setMessageCache(prev => ({
        ...prev,
        [chatId]: {
          messages: [...prev[chatId].messages, optimisticMessage],
          timestamp: Date.now()
        }
      }));
    }

    try {
      // Send to API
      const messageData = {
        chatId,
        senderId: user.$id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        isRead: false
      };

      const realMessage = await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData,
        [
          // Message sender has full access
          Permission.read(Role.users()),  // Both chat participants can read
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );

      // Update chat's updatedAt timestamp
      await databases.updateDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId,
        { updatedAt: new Date().toISOString() }
      );

      // Update in-memory cache with real message
      if (messageCache[chatId]) {
        setMessageCache(prev => ({
          ...prev,
          [chatId]: {
            messages: prev[chatId].messages.map(m =>
              m.$id === tempId ? realMessage : m
            ),
            timestamp: Date.now()
          }
        }));

        // Update AsyncStorage cache
        const updatedMessages = messageCache[chatId].messages.map(m =>
          m.$id === tempId ? realMessage : m
        );
        await AsyncStorage.setItem(
          `chat_messages_${chatId}`,
          JSON.stringify({
            messages: updatedMessages,
            timestamp: Date.now()
          })
        );
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(realMessage, tempId);
      }

      return realMessage;
    } catch (error) {
      console.error('Error sending message:', error);

      // Mark message as failed in cache
      if (messageCache[chatId]) {
        setMessageCache(prev => ({
          ...prev,
          [chatId]: {
            messages: prev[chatId].messages.map(m =>
              m.$id === tempId ? { ...m, isSending: false, sendFailed: true } : m
            ),
            timestamp: Date.now()
          }
        }));
      }

      // Call error callback
      if (onError) {
        onError(error, tempId);
      }

      return null;
    }
  }, [user, messageCache]);

  // Clear all cache (on logout)
  const clearCache = async () => {
    if (!user) return;

    try {
      // Clear chats cache
      await AsyncStorage.removeItem(`user_chats_${user.$id}`);

      // Clear all message caches for this user's chats
      const keys = await AsyncStorage.getAllKeys();
      const messageCacheKeys = keys.filter(key => key.startsWith('chat_messages_'));
      await AsyncStorage.multiRemove(messageCacheKeys);

      // Clear in-memory cache
      setMessageCache({});
      setChats([]);
    } catch (error) {
      console.error('Error clearing chat cache:', error);
    }
  };

  const value = {
    chats,
    isLoadingChats,
    getCachedMessages,
    refreshMessages,
    sendMessage,
    refreshChats,
    clearCache,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
