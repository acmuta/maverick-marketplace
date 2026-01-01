import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ID, Query, Permission, Role } from 'react-native-appwrite';
import { databases, DATABASE_ID, CHATS_COLLECTION_ID, USERS_COLLECTION_ID, LISTINGS_COLLECTION_ID } from '../../appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Text } from 'react-native-paper';

export default function NewChatScreen() {
  const { listingId, sellerId } = useLocalSearchParams();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [init, setInit] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    if (currentUser && listingId && sellerId) {
      checkAndCreateChat();
    } else if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, listingId, sellerId]);

  const checkAndCreateChat = async () => {
    try {
      // 1. Check if chat already exists
      const existingChats = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.equal('listingId', listingId),
          Query.equal('buyerId', currentUser.$id),
          Query.equal('sellerId', sellerId)
        ]
      );

      if (existingChats.documents.length > 0) {
        // Chat exists, redirect
        router.replace(`/chat/${existingChats.documents[0].$id}`);
        return;
      }

      // 2. Fetch Listing Title needed for chat metadata
      const listing = await databases.getDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, listingId);

      // 3. Create new chat with document-level permissions
      const newChat = await databases.createDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        ID.unique(),
        {
          buyerId: currentUser.$id,
          sellerId: sellerId,
          listingId: listingId,
          listingTitle: listing.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        [
          // Both buyer and seller need access to the chat
          Permission.read(Role.user(currentUser.$id)),
          Permission.read(Role.user(sellerId)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.update(Role.user(sellerId)),
          Permission.delete(Role.user(currentUser.$id)),
          Permission.delete(Role.user(sellerId))
        ]
      );

      router.replace(`/chat/${newChat.$id}`);

    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to start chat.');
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar barStyle="dark-content" />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 20, color: colors.secondary }}>Starting conversation...</Text>
    </View>
  );
}
