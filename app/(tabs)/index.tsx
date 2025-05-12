// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Query, Models } from 'react-native-appwrite';
import { databases, storage, account, getImageUrl, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_COLLECTION_ID, IMAGES_BUCKET_ID } from '../../appwrite';
import ListingGrid from '../components/ListingGrid';
import SearchBar from '../components/SearchBar'; // Import the new SearchBar component
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface Listing {
  $id: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Check if user is logged in
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  const checkSession = async () => {
    try {
      try {
        const session = await account.getSession('current');
        if (session) {
          const user = await account.get();
          setLoggedInUser(user);
        }
      } catch (error) {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Session error:', error);
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching with endpoint:", process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
      console.log("Project ID:", process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
      
      try {
        // Just try to fetch the listings directly
        const response = await databases.listDocuments(
          DATABASE_ID,
          LISTINGS_COLLECTION_ID,
          [
            Query.equal('status', 'active'),
            Query.orderDesc('createdAt')
          ]
        );
        
        console.log("Successfully connected to Appwrite!");
        console.log("Found listings:", response.documents.length);
        
        const listingsWithImages = await Promise.all(
          response.documents.map(async (listing) => {
            try {
              const imagesResponse = await databases.listDocuments(
                DATABASE_ID,
                IMAGES_COLLECTION_ID,
                [
                  Query.equal('listingId', listing.$id),
                  Query.orderAsc('order'),
                  Query.limit(1)
                ]
              );

              if (imagesResponse.documents.length > 0) {
                const fileId = imagesResponse.documents[0].fileId;
                try {
                  // Use the helper function to get URL
                  const imageUrl = getImageUrl(IMAGES_BUCKET_ID, fileId, 400, 300);
                  console.log("Generated image URL:", imageUrl);
                  listing.imageUrl = imageUrl;
                } catch (imgError) {
                  console.error(`Error getting file view:`, imgError);
                }
              }
              return listing;
            } catch (listingError) {
              console.error(`Error fetching images:`, listingError);
              return listing;
            }
          })
        );

        setListings(listingsWithImages);
        
      } catch (connectionError) {
        console.error("Connection error:", connectionError);
        throw new Error("Could not connect to Appwrite. Please check your project ID and endpoint.");
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError(error instanceof Error ? error.message : "Unknown error fetching listings");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const showError = () => {
    if (error) {
      Alert.alert(
        "Connection Error",
        error + "\n\nIf using tunneling, make sure to run the full tunnel script.",
        [{ text: "OK" }]
      );
    }
  };

  const navigateToSearch = () => {
    router.push('/search');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="storefront" size={24} color={COLORS.brightOrange} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Maverick Marketplace</Text>
          </View>
          
          {loggedInUser ? (
            <View style={styles.userContainer}>
              <Text style={styles.welcomeText}>
                Hi, {loggedInUser.name?.split(' ')[0]}
              </Text>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {loggedInUser.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <TouchableOpacity 
          style={styles.searchBarButton} 
          onPress={navigateToSearch}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={COLORS.mediumGray} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search listings...</Text>
        </TouchableOpacity>
      </View>
  
      {/* Main Content */}
      <View style={[styles.mainContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Listings</Text>
          {error && (
            <TouchableOpacity 
              style={styles.errorContainer}
              onPress={showError}
            >
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>Connection Error (Tap for details)</Text>
            </TouchableOpacity>
          )}
        </View>
  
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brightOrange} />
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : (
          <ListingGrid 
            listing={listings} 
            isLoading={isLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
        
        {/* Bottom padding to ensure content scrolls above tab bar */}
        <View style={styles.bottomPadding} />
      </View>
  
      {/* Create Listing Button (only shown when logged in) */}
      {loggedInUser && (
        <TouchableOpacity
          style={[styles.floatingButton, { bottom: insets.bottom + 120 }]}
          onPress={() => router.push('/create-listing')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
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
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.brightOrange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchBarButton: {
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: COLORS.mediumGray,
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: COLORS.mediumBlue,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,82,82,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bottomPadding: {
    height: 60,
  },
});