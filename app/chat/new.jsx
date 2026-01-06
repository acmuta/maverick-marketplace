import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { databases, functions, DATABASE_ID, CHATS_COLLECTION_ID } from '../../appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, Text } from 'react-native-paper';

// Function ID deployed to Appwrite Cloud
const CREATE_CHAT_FUNCTION_ID = 'create-chat';

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
      console.log('DEBUG - Creating chat via function:');
      console.log('  currentUser.$id:', currentUser.$id);
      console.log('  sellerId:', sellerId);
      console.log('  listingId:', listingId);

      // 1. Check if chat already exists (quick client-side check)
      const existing_chats = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.equal('listingId', listingId),
          Query.equal('buyerId', currentUser.$id),
          Query.equal('sellerId', sellerId)
        ]
      );

      if (existing_chats.documents.length > 0) {
        console.log('  Existing chat found:', existing_chats.documents[0].$id);
        router.replace(`/chat/${existing_chats.documents[0].$id}`);
        return;
      }

      // 2. Call Appwrite Function to create chat with proper permissions
      // The function uses Server SDK which can set permissions for both users
      console.log('  Calling create-chat function...');
      const execution = await functions.createExecution(
        CREATE_CHAT_FUNCTION_ID,
        JSON.stringify({
          listing_id: listingId,
          seller_id: sellerId
        }),
        false,  // async = false (wait for result)
        '/',    // path
        'POST'  // method
      );

      console.log('  Function response status:', execution.responseStatusCode);
      console.log('  Function response:', execution.responseBody);

      // Parse the response
      const response = JSON.parse(execution.responseBody);

      if (response.success) {
        console.log('  Chat created/found:', response.chat_id);
        router.replace(`/chat/${response.chat_id}`);
      } else {
        throw new Error(response.error || 'Failed to create chat');
      }

    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
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
