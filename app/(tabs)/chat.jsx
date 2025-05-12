import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  account, 
  databases, 
  DATABASE_ID, 
  CHATS_COLLECTION_ID,
  USERS_COLLECTION_ID
} from '../../appwrite';

// Define consistent theme colors - matching home page
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

export default function ChatTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
        <ActivityIndicator size="large" color={COLORS.brightOrange} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.containerCenter, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.message}>Please log in to view your messages</Text>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.brightOrange} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
          
          <View style={styles.userContainer}>
            <Text style={styles.welcomeText}>
              {currentUser?.name?.split(' ')[0] || 'User'}
            </Text>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarContainerText}>
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Main Content */}
      <View style={styles.mainContent}>
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={COLORS.mediumGray} />
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
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={COLORS.brightOrange}
                colors={[COLORS.brightOrange]} 
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.mediumBlue,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brightOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.white,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.brightOrange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: 200,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
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
    color: COLORS.white,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.brightOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
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
    color: COLORS.white,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  chatListingTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});