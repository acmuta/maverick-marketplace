import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import { Image } from 'expo-image';
import { 
  account, 
  databases, 
  storage, 
  DATABASE_ID, 
  LISTINGS_COLLECTION_ID, 
  IMAGES_COLLECTION_ID, 
  USERS_COLLECTION_ID, 
  IMAGES_BUCKET_ID 
} from '../../appwrite';
import { Ionicons } from '@expo/vector-icons';

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
  success: '#4CAF50',
  background: '#0A1929',
  cardBackground: '#0F2942',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
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
        const imageUrls = imagesResponse.documents.map((img, index) => {
          try {
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

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      checkCurrentUser();
      const listingData = await fetchListingData();
      
      if (!listingData) {
        setIsLoading(false);
        return;
      }
      
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

    if (listing.userId === currentUser.$id) {
      Alert.alert('Error', 'This is your own listing');
      return;
    }

    router.push({
      pathname: '/chat/new',
      params: {
        listingId: listing.$id,
        sellerId: listing.userId
      }
    });

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
        <ActivityIndicator size="large" color={COLORS.orange} />
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
      <View style={styles.galleryContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={true}
          style={styles.imageGallery}
        >
          {images.length > 0 && images.some(img => img.url) ? (
            images
              .filter(image => image.url)
              .map((image, index) => (
                <TouchableOpacity 
                  key={`img-container-${index}`} 
                  style={{ width }}
                  onPress={() => setSelectedImage(image.url)}
                >
                  <Image 
                    source={{ 
                      uri: image.url,
                      headers: {
                        'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID
                      }
                    }}
                    style={styles.image}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))
          ) : (
            <View style={[styles.placeholderImage, { width }]}>
              <Text style={styles.placeholderText}>No Images Available</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.modalBackground} 
            onPress={() => setSelectedImage(null)}
          />
          <View style={styles.fullImageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              contentFit="contain"
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.messageButton]} 
              onPress={handleContactSeller}
            >
              <Ionicons name="chatbubble-outline" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Message Seller</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContactSeller}
            >
              <Ionicons name="information-circle-outline" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Contact Info</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.darkBlue,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.error,
  },
  galleryContainer: {
    height: 300,
  },
  imageGallery: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    height: 300,
    backgroundColor: COLORS.mediumBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: COLORS.darkBlue,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.white,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.orange,
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
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
    color: COLORS.white,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.white,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    color: COLORS.textPrimary,
  },
  sellerContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.mediumBlue,
    borderRadius: 8,
  },
  sellerHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.white,
  },
  sellerName: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  messageButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: COLORS.orange,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.lightBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  ownerButtons: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullImageContainer: {
    width: '100%',
    height: '80%',
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
});