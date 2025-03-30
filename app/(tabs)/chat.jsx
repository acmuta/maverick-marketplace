import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { Ionicons } from '@expo/vector-icons';
import { 
  account, 
  databases, 
  DATABASE_ID, 
  CHATS_COLLECTION_ID,
  USERS_COLLECTION_ID
} from '../../appwrite/config';

export default function ChatTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
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
        fetchChats(user.$id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.log('No active session found');
      setIsLoading(false);
    }
  };

  const fetchChats = async (userId) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Fetch chats where user is either buyer or seller
      const chatsResponse = await databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.orderDesc('updatedAt')
        ]
      );
      
      // Filter chats where the user is either buyer or seller
      const userChats = chatsResponse.documents.filter(
        chat => chat.buyerId === userId || chat.sellerId === userId
      );
      
      // Fetch user profiles for chat participants
      const enhancedChats = await Promise.all(
        userChats.map(async (chat) => {
          const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
          
          try {
            const userProfileResponse = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal('userId', otherUserId)]
            );
            
            const otherUserProfile = userProfileResponse.documents.length > 0 
              ? userProfileResponse.documents[0] 
              : { displayName: 'Unknown User' };
              
            return {
              ...chat,
              otherUser: {
                userId: otherUserId,
                displayName: otherUserProfile.displayName
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
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (currentUser) {
      fetchChats(currentUser.$id);
    } else {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.$id}`)}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.avatarText}>
          {item.otherUser.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.otherUser.displayName}
          </Text>
          <Text style={styles.chatTime}>{formatDate(item.updatedAt)}</Text>
        </View>
        <Text style={styles.chatListingTitle} numberOfLines={1}>
          Re: {item.listingTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.message}>Please log in to view your messages</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Your conversations with other users will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.$id}
          contentContainerStyle={styles.chatsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: 200,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  chatsList: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  chatListingTitle: {
    fontSize: 14,
    color: '#666',
  },
});