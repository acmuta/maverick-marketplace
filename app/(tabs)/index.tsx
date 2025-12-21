import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { databases, getImageUrl, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_BUCKET_ID } from '../../appwrite';
import ListingGrid from '../components/ListingGrid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Appbar, Text, useTheme, ActivityIndicator, FAB, Surface, IconButton } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

export default function HomeScreen() {
  const [listings, setListings] = useState<any[]>([]); // Fix state type
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user: loggedInUser } = useAuth();
  const [error, setError] = useState<string | null>(null); // Fix error type
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ITEMS_PER_PAGE = 20;
  const fetchingRef = React.useRef(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchListings();
    return () => {
      fetchingRef.current = false;
    };
  }, []);

  const fetchListings = async (loadMore = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
      setOffset(0);
      setHasMore(true);
    }
    setError(null);

    try {
      const currentOffset = loadMore ? offset : 0;

      const response = await databases.listDocuments(
        DATABASE_ID || '',
        LISTINGS_COLLECTION_ID || '',
        [
          Query.equal('status', 'active'),
          Query.orderDesc('createdAt'),
          Query.limit(ITEMS_PER_PAGE),
          Query.offset(currentOffset),
          Query.select(['$id', 'title', 'price', 'category', 'condition', 'primaryImageFileId', 'status', '$createdAt'])
        ]
      );

      const listingsWithImages = response.documents.map((listing) => {
        if (listing.primaryImageFileId) {
          listing.imageUrl = getImageUrl(
            IMAGES_BUCKET_ID || '',
            listing.primaryImageFileId || '',
            600, // Higher res for 1:1 cards
            600
          );
        }
        return listing;
      });

      if (loadMore) {
        setListings(prev => [...prev, ...listingsWithImages]);
        setOffset(currentOffset + listingsWithImages.length);
      } else {
        setListings(listingsWithImages);
        setOffset(listingsWithImages.length);
      }

      setHasMore(listingsWithImages.length === ITEMS_PER_PAGE);

    } catch (error) {
      console.error('Error fetching listings:', error);
      setError(error instanceof Error ? error.message : "Unknown error fetching listings");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchingRef.current = false;
    fetchListings(false);
  };

  const loadMoreListings = () => {
    if (!loadingMore && hasMore) {
      fetchListings(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Minimal Header */}
      <Appbar.Header style={{ backgroundColor: colors.background, elevation: 0, height: 50, borderBottomWidth: 1, borderBottomColor: colors.outline }}>
        <Appbar.Content
          title="CampusMarket"
          titleStyle={{
            color: colors.primary,
            fontWeight: '900',
            fontSize: 20,
            letterSpacing: -0.5
          }}
        />
        <IconButton icon="magnify" iconColor={colors.primary} onPress={() => router.push('/search')} />
        <IconButton icon="filter-variant" iconColor={colors.primary} onPress={() => { }} />
      </Appbar.Header>

      <View style={styles.mainContent}>
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <ListingGrid
            listing={listings}
            isLoading={isLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onLoadMore={loadMoreListings}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});