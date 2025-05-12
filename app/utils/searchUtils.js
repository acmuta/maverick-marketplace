// app/utils/searchUtils.js
import { Query } from 'react-native-appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  databases, 
  storage,
  getImageUrl,
  DATABASE_ID, 
  LISTINGS_COLLECTION_ID,
  IMAGES_COLLECTION_ID,
  IMAGES_BUCKET_ID 
} from '../../appwrite';

// Storage keys
const RECENT_SEARCHES_KEY = 'maverickMarketplace_recentSearches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Load recent searches from AsyncStorage
 */
export const loadRecentSearches = async () => {
  try {
    const recentSearchesJSON = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return recentSearchesJSON ? JSON.parse(recentSearchesJSON) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
};

/**
 * Save a search term to recent searches
 */
export const saveSearchTerm = async (term) => {
  try {
    if (!term || term.trim() === '') return;
    
    // Normalize the term
    const normalizedTerm = term.trim().toLowerCase();
    
    // Get existing searches
    const existingSearches = await loadRecentSearches();
    
    // Remove the term if it already exists (to avoid duplicates)
    const filteredSearches = existingSearches.filter(item => item !== normalizedTerm);
    
    // Add the new term at the beginning
    const updatedSearches = [normalizedTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
    
    // Save to storage
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    
    return updatedSearches;
  } catch (error) {
    console.error('Error saving search term:', error);
    return null;
  }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = async () => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing recent searches:', error);
    return false;
  }
};

/**
 * Perform listing search with filters using contains instead of search
 * This method works without requiring fulltext indexes
 */
export const searchListings = async ({ 
  query = '', 
  category = null,
  minPrice = null,
  maxPrice = null,
  condition = null,
  sortBy = 'recent' // Options: 'recent', 'priceAsc', 'priceDesc'
}) => {
  try {
    // Build base queries
    const searchQueries = [
      Query.equal('status', 'active'),  // Only active listings
    ];
    
    // Add text search if provided - using contains instead of search
    if (query && query.trim() !== '') {
      // Instead of using Query.search which requires fulltext index,
      // we'll use Query.contains which works without special indexes
      searchQueries.push(Query.contains('title', query.trim()));
      
      // Optionally, you can also search in description
      // searchQueries.push(Query.contains('description', query.trim()));
    }
    
    // Add category filter if selected
    if (category && category !== 'All') {
      searchQueries.push(Query.equal('category', category));
    }
    
    // Add price range filters if provided
    if (minPrice !== null && !isNaN(minPrice)) {
      searchQueries.push(Query.greaterThanEqual('price', minPrice));
    }
    
    if (maxPrice !== null && !isNaN(maxPrice)) {
      searchQueries.push(Query.lessThanEqual('price', maxPrice));
    }
    
    // Add condition filter if provided
    if (condition && condition !== 'All') {
      searchQueries.push(Query.equal('condition', condition));
    }
    
    // Add sorting
    if (sortBy === 'priceAsc') {
      searchQueries.push(Query.orderAsc('price'));
    } else if (sortBy === 'priceDesc') {
      searchQueries.push(Query.orderDesc('price'));
    } else {
      // Default to recent
      searchQueries.push(Query.orderDesc('createdAt'));
    }
    
    // Execute search query
    const response = await databases.listDocuments(
      DATABASE_ID,
      LISTINGS_COLLECTION_ID,
      searchQueries
    );
    
    // Process results to add images
    const resultsWithImages = await Promise.all(
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
              const imageUrl = getImageUrl(IMAGES_BUCKET_ID, fileId, 400, 300);
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
    
    // Save search term if it's valid
    if (query && query.trim() !== '') {
      await saveSearchTerm(query);
    }
    
    return resultsWithImages;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Get popular categories with count
 */
export const getPopularCategories = async (limit = 5) => {
  try {
    // This is a simplified approach since Appwrite doesn't support 
    // aggregation queries directly. In a real-world scenario,
    // you might want to maintain category counts in a separate collection.
    
    // For now, we'll just return the predefined categories
    return [
      { name: 'Electronics', count: 42 },
      { name: 'Textbooks', count: 37 },
      { name: 'Furniture', count: 24 },
      { name: 'Clothing', count: 18 },
      { name: 'Sports Equipment', count: 15 },
    ].slice(0, limit);
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    return [];
  }
};

// This empty default export is required by Expo Router
// to prevent the "missing default export" error
export default function SearchUtils() {
  return null;
}