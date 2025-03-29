// app/listing/[id].jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { Image } from 'expo-image';
import { account, databases, storage, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_COLLECTION_ID, USERS_COLLECTION_ID, IMAGES_BUCKET_ID } from '../../appwrite/config';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We'll attempt to fetch all data, but handle errors gracefully
    fetchData();
  }, [id]);

  const checkCurrentUser = async () => {
    try {
      const user = await account.get();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.log('No user logged in');
      return null;
    }
  };

  // Separate functions to fetch each piece of data independently
  const fetchListingData = async () => {
    try {
      const listingData = await databases.getDocument(
        DATABASE_ID,
        LISTINGS_COLLECTION_ID,
        id
      );
      setListing(listingData);
      return listingData;
    } catch (error) {
      console.error('Error fetching listing data:', error);
      setError('Could not load listing details. It may be private or no longer available.');
      return null;
    }
  };

  const fetchSellerData = async (userId) => {
    if (!userId) return null;
    
    try {
      const sellerResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (sellerResponse.documents.length > 0) {
        const sellerData = sellerResponse.documents[0];
        setSeller(sellerData);
        return sellerData;
      }
      return null;
    } catch (error) {
      console.log('Could not fetch seller information:', error);
      return null;
    }
  };

  const fetchImagesData = async (listingId) => {
    if (!listingId) return [];
    
    try {
      const imagesResponse = await databases.listDocuments(
        DATABASE_ID,
        IMAGES_COLLECTION_ID,
        [
          Query.equal('listingId', listingId),
          Query.orderAsc('order')
        ]
      );

      if (imagesResponse.documents.length > 0) {
        // Generate image URLs with direct view URLs for better guest access
        const imageUrls = imagesResponse.documents.map((img, index) => {
          try {
            // Use getFileView instead of getFilePreview for better guest access
            const viewUrl = storage.getFileView(IMAGES_BUCKET_ID, img.fileId).toString();
            console.log(`Generated detail image URL: ${viewUrl}`);
            return {
              id: img.$id,
              fileId: img.fileId,
              url: viewUrl,
              order: index
            };
          } catch (urlError) {
            console.error(`Error generating URL for image ${img.fileId}:`, urlError);
            return {
              id: img.$id,
              fileId: img.fileId,
              url: null,
              order: index
            };
          }
        });
        
        setImages(imageUrls);
        return imageUrls;
      }
      
      return [];
    } catch (error) {
      console.log('Could not fetch images:', error);
      return [];
    }
  };

  // Orchestrate all data fetching, but continue even if some parts fail
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if user is logged in (don't need to wait for this)
      checkCurrentUser();
      
      // Fetch the listing data first
      const listingData = await fetchListingData();
      
      // If we can't get the listing data, we can't proceed
      if (!listingData) {
        setIsLoading(false);
        return;
      }
      
      // Now fetch seller and images in parallel
      // We can still show the listing even if these fail
      await Promise.all([
        fetchSellerData(listingData.userId),
        fetchImagesData(id)
      ]);
      
    } catch (error) {
      console.error('Unexpected error during data fetching:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleContactSeller = () => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to contact the seller', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (seller) {
      const contactMessage = `Contact ${seller.displayName || 'the seller'} at:`;
      const contactDetails = [];
      
      if (seller.contactEmail) {
        contactDetails.push(`Email: ${seller.contactEmail}`);
      }
      
      if (seller.phoneNumber) {
        contactDetails.push(`Phone: ${seller.phoneNumber}`);
      }
      
      if (contactDetails.length === 0) {
        contactDetails.push('No contact information provided.');
      }
      
      Alert.alert('Contact Information', `${contactMessage}\n\n${contactDetails.join('\n')}`);
    } else {
      Alert.alert('Contact Information', 'Seller information is not available');
    }
  };

  const deleteListing = async () => {
    if (!currentUser || !listing || currentUser.$id !== listing.userId) {
      Alert.alert('Error', 'You do not have permission to delete this listing');
      return;
    }
    
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.updateDocument(
                DATABASE_ID,
                LISTINGS_COLLECTION_ID,
                id,
                { status: 'inactive' }
              );
              
              Alert.alert('Success', 'Listing has been removed');
              router.back();
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = currentUser && currentUser.$id === listing.userId;

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={true}
        style={styles.imageGallery}
      >
        {images.length > 0 && images.some(img => img.url) ? (
          images
            .filter(image => image.url) // Only show images with valid URLs
            .map((image, index) => (
              <Image 
                key={`image-${image.fileId}-${index}`}
                source={{ 
                  uri: image.url,
                  headers: {
                    'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID
                  }
                }}
                style={styles.image} 
                contentFit="cover"
                cachePolicy="none"
                onError={(error) => console.error(`Image loading error: ${error}`)}
                onLoad={() => console.log(`Detail image loaded successfully: ${image.fileId}`)}
              />
            ))
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Images Available</Text>
          </View>
        )}
      </ScrollView>

      {/* Listing Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{listing.category}</Text>
        </View>
        
        {listing.condition && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Condition:</Text>
            <Text style={styles.infoValue}>{listing.condition}</Text>
          </View>
        )}
        
        {listing.location && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{listing.location}</Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Posted:</Text>
          <Text style={styles.infoValue}>{formatDate(listing.createdAt)}</Text>
        </View>
        
        <Text style={styles.descriptionHeader}>Description</Text>
        <Text style={styles.description}>{listing.description}</Text>
        
        {/* Seller Info */}
        <View style={styles.sellerContainer}>
          <Text style={styles.sellerHeader}>Seller Information</Text>
          <Text style={styles.sellerName}>{seller ? seller.displayName : 'Unknown Seller'}</Text>
        </View>
        
        {/* Action Buttons */}
        {isOwner ? (
          <View style={styles.ownerButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]} 
              onPress={deleteListing}
            >
              <Text style={styles.buttonText}>Delete Listing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleContactSeller}
          >
            <Text style={styles.buttonText}>Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#f44336',
  },
  imageGallery: {
    height: 300,
  },
  image: {
    width: 400,
    height: 300,
  },
  placeholderImage: {
    width: 400,
    height: 300,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sellerContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  sellerHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ownerButtons: {
    marginTop: 16,
  },
});