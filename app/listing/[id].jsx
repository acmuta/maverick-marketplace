import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Modal, Pressable, StatusBar, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Query } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Text, Button, useTheme, IconButton, ActivityIndicator, Avatar, Divider, Surface } from 'react-native-paper';
import { Feather, Ionicons } from '@expo/vector-icons';
import { account, databases, storage, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_COLLECTION_ID, USERS_COLLECTION_ID, IMAGES_BUCKET_ID } from '../../appwrite';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width } = Dimensions.get('window');

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [images, setImages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch User
      try { const user = await account.get(); setCurrentUser(user); } catch (e) { console.log('No user'); }

      // Fetch Listing
      const listingData = await databases.getDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, id);
      setListing(listingData);

      // Fetch Seller
      try {
        const sellerData = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, listingData.userId);
        setSeller(sellerData);
      } catch (e) {
        setSeller({ displayName: 'Unknown Seller' });
      }

      // Fetch Images
      const imgs = await databases.listDocuments(DATABASE_ID, IMAGES_COLLECTION_ID, [
        Query.equal('listingId', id),
        Query.orderAsc('order')
      ]);

      const imageUrls = imgs.documents.map(img => ({
        url: storage.getFileView(IMAGES_BUCKET_ID, img.fileId).toString(),
        id: img.$id
      }));
      setImages(imageUrls);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load listing.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to contact the seller.', [
        { text: 'Cancel' },
        { text: 'Log In', onPress: () => router.push('/login') }
      ]);
      return;
    }
    router.push({ pathname: '/chat/new', params: { listingId: listing.$id, sellerId: listing.userId } });
  };

  const handleDelete = async () => {
    Alert.alert('Delete Listing', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await databases.updateDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, id, { status: 'inactive' });
            router.back();
          } catch (e) { Alert.alert('Error', 'Failed to delete.'); }
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) return null;

  const isOwner = currentUser && currentUser.$id === listing.userId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header (Absolute) */}
        <Pressable
          style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8 }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>

        {/* Image Gallery */}
        <View style={{ height: width, backgroundColor: colors.secondaryContainer }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {images.length > 0 ? (
              images.map((img, i) => (
                <Pressable key={i} onPress={() => setSelectedImage(img.url)}>
                  <Image
                    source={{ uri: img.url }}
                    style={{ width, height: width }}
                    contentFit="cover" // Square crop
                  />
                </Pressable>
              ))
            ) : (
              <View style={{ width, height: width, justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="image" size={48} color={colors.secondary} />
              </View>
            )}
          </ScrollView>
          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 16, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' }} />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineMedium" style={{ fontWeight: '900', letterSpacing: -0.5 }}>${listing.price}</Text>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 4 }}>{listing.title}</Text>
            </View>
            <IconButton icon="heart-outline" iconColor="black" size={24} onPress={() => { }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={[styles.tag, { borderColor: colors.outline }]}>
              <Text variant="labelSmall" style={{ fontWeight: 'bold' }}>{listing.category?.toUpperCase()}</Text>
            </View>
            {listing.condition && (
              <View style={[styles.tag, { borderColor: colors.outline }]}>
                <Text variant="labelSmall" style={{ fontWeight: 'bold' }}>{listing.condition?.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Divider style={{ marginVertical: 24, backgroundColor: colors.outline }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar.Text
              size={40}
              label={seller?.displayName?.charAt(0).toUpperCase() || '?'}
              style={{ backgroundColor: colors.secondaryContainer }}
              color="black"
            />
            <View style={{ marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{seller?.displayName || 'Unknown Check User'}</Text>
              <Text variant="bodySmall" style={{ color: colors.secondary }}>Verified Student (Simulated)</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 24, backgroundColor: colors.outline }} />

          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Description</Text>
          <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant, lineHeight: 24 }}>
            {listing.description}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.secondary, marginTop: 20 }}>
            Posted {new Date(listing.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Action Footer */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, paddingBottom: insets.bottom + 16,
        backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.outline
      }}>
        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={{ flex: 1, borderRadius: 50, borderColor: colors.error }}
              textColor={colors.error}
            >
              Delete
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push(`/listing/edit/${listing.$id}`)}
              style={{ flex: 1, borderRadius: 50, backgroundColor: 'black' }}
            >
              Edit
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={handleContactSeller}
            style={{ borderRadius: 50, height: 50, justifyContent: 'center', backgroundColor: 'black' }}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            Message Seller
          </Button>
        )}
      </View>

      {/* Full Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={30} color="white" />
          </Pressable>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Image source={{ uri: selectedImage }} style={{ width: '100%', height: '80%' }} contentFit="contain" />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6
  }
});