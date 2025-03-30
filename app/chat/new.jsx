import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ID, Query } from 'react-native-appwrite';
import { 
  account, 
  databases, 
  DATABASE_ID, 
  CHATS_COLLECTION_ID, 
  MESSAGES_COLLECTION_ID,
  LISTINGS_COLLECTION_ID,
  USERS_COLLECTION_ID
} from '../../appwrite/config';

export default function NewChatScreen() {
  const { listingId, sellerId } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [listingInfo, setListingInfo] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await account.getSession('current');
      if (session) {
        const user = await account.get();
        setCurrentUser(user);
        await fetchListingInfo();
      } else {
        setIsLoading(false);
        Alert.alert('Error', 'You must be logged in to start a chat', [
          { text: 'OK', onPress: () => router.push('/login') }
        ]);
      }
    } catch (error) {
      console.log('No active session found');
      setIsLoading(false);
      Alert.alert('Error', 'You must be logged in to start a chat', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
    }
  };

  const fetchListingInfo = async () => {
    setIsLoading(true);
    try {
      if (!listingId) {
        throw new Error('Listing ID is missing');
      }

      const listing = await databases.getDocument(
        DATABASE_ID,
        LISTINGS_COLLECTION_ID,
        listingId
      );
      
      setListingInfo(listing);
      
      const sellerIdToUse = sellerId || listing.userId;
      
      const sellerProfileResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', sellerIdToUse)]
      );
      
      if (sellerProfileResponse.documents.length > 0) {
        setSellerInfo(sellerProfileResponse.documents[0]);
      }
      
    } catch (error) {
      console.error('Error fetching listing info:', error);
      Alert.alert('Error', 'Failed to load listing information');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = async () => {
    if (!message.trim() || !currentUser || !listingInfo) {
      Alert.alert('Error', 'Please enter a message to start the chat');
      return;
    }
    
    if (listingInfo.userId === currentUser.$id) {
      Alert.alert('Error', 'You cannot chat with yourself on your own listing');
      return;
    }
    
    setIsSending(true);
    
    try {
      const chatId = ID.unique();
      const messageId = ID.unique();
      const now = new Date().toISOString();
      
      // Create a chat document
      await databases.createDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId,
        {
          listingId: listingInfo.$id,
          sellerId: listingInfo.userId,
          buyerId: currentUser.$id,
          listingTitle: listingInfo.title,
          createdAt: now,
          updatedAt: now
        }
      );
      
      await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        messageId,
        {
          chatId: chatId,
          senderId: currentUser.$id,
          content: message.trim(),
          createdAt: now,
          isRead: false
        }
      );
      
      router.push({
        pathname: '/chat/[id]',
        params: { id: chatId }
      });
      
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
      setIsSending(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>New Chat</Text>
                
                {listingInfo && (
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle}>
                      About: <Text style={styles.listingTitleText}>{listingInfo.title}</Text>
                    </Text>
                    <Text style={styles.price}>
                      Price: <Text style={styles.priceText}>${listingInfo.price?.toFixed(2)}</Text>
                    </Text>
                    {sellerInfo && (
                      <Text style={styles.seller}>
                        Seller: <Text style={styles.sellerName}>{sellerInfo.displayName}</Text>
                      </Text>
                    )}
                  </View>
                )}
              </View>
              
              <View style={styles.messageContainer}>
                <Text style={styles.messageLabel}>Your message:</Text>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type your message to the seller..."
                  multiline
                  numberOfLines={4}
                />
                
                <TouchableOpacity 
                  style={[styles.button, (!message.trim() || isSending) && styles.buttonDisabled]} 
                  onPress={startChat}
                  disabled={!message.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Message</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30, // Add padding to the bottom to ensure content is visible above keyboard
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listingInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
  },
  listingTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  listingTitleText: {
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    marginBottom: 8,
  },
  priceText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  seller: {
    fontSize: 16,
  },
  sellerName: {
    fontWeight: 'bold',
  },
  messageContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
    maxHeight: 150,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40, // Extra space at the bottom
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});