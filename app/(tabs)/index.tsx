// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Query, Models } from 'react-native-appwrite';
import { databases, storage, account, getImageUrl, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_COLLECTION_ID, IMAGES_BUCKET_ID } from '../../appwrite/config';
import ListingGrid from '../components/ListingGrid';

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
      
      // First test if we can list databases at all
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maverick Marketplace</Text>
        {loggedInUser ? (
          <Text style={styles.welcomeText}>Welcome, {loggedInUser.name}</Text>
        ) : (
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
  
      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Listings</Text>
          {error && (
            <TouchableOpacity onPress={showError}>
              <Text style={styles.errorText}>Connection Error (Tap for details)</Text>
            </TouchableOpacity>
          )}
        </View>
  
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <ListingGrid 
            listing={listings} 
            isLoading={isLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
  
      {/* Create Listing Button (only shown when logged in) */}
      {loggedInUser && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/create-listing')}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeText: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  loginText: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
  contentContainer: {
    flexGrow: 1,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});