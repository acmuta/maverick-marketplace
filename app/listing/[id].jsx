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

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      try { const user = await account.get(); setCurrentUser(user); } catch (e) { }
      const listingData = await databases.getDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, id);
      setListing(listingData);
      try {
        const sellerData = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, listingData.userId);
        setSeller(sellerData);
      } catch (e) { setSeller({ displayName: 'Unknown' }); }

      const imgs = await databases.listDocuments(DATABASE_ID, IMAGES_COLLECTION_ID, [Query.equal('listingId', id), Query.orderAsc('order')]);
      setImages(imgs.documents.map(img => ({ url: storage.getFileView(IMAGES_BUCKET_ID, img.fileId).toString(), id: img.$id })));
    } catch (e) { Alert.alert('Error', 'Failed to load.'); router.back(); } finally { setIsLoading(false); }
  };

  const handleContactSeller = () => {
    if (!currentUser) return Alert.alert('Login Required', 'Please log in.', [{ text: 'Login', onPress: () => router.push('/login') }]);
    router.push({ pathname: '/chat/new', params: { listingId: listing.$id, sellerId: listing.userId } });
  };

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!listing) return null;

  const isOwner = currentUser && currentUser.$id === listing.userId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header (Absolute) */}
        <Pressable
          style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10, backgroundColor: 'white', borderRadius: 20, padding: 8, elevation: 4 }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </Pressable>

        {/* Image Gallery */}
        <View style={{ height: width, backgroundColor: '#E5E7EB' }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {images.length > 0 ? images.map((img, i) => (
              <Pressable key={i} onPress={() => setSelectedImage(img.url)}>
                <Image source={{ uri: img.url }} style={{ width, height: width }} contentFit="cover" />
              </Pressable>
            )) : (
              <View style={{ width, height: width, justifyContent: 'center', alignItems: 'center' }}><Feather name="image" size={48} color="gray" /></View>
            )}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={{ padding: 20 }}>
          <Text variant="displaySmall" style={{ color: colors.primary, fontWeight: '800' }}>${listing.price}</Text>
          <Text variant="headlineSmall" style={{ fontWeight: '700', marginTop: 4, lineHeight: 32 }}>{listing.title}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{ backgroundColor: '#E0E7FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>{listing.category?.toUpperCase()}</Text>
            </View>
            {listing.condition && (
              <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: colors.secondary, fontWeight: 'bold', fontSize: 12 }}>{listing.condition?.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Divider style={{ marginVertical: 24 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar.Text size={48} label={seller?.displayName?.charAt(0).toUpperCase()} style={{ backgroundColor: colors.primaryContainer }} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{seller?.displayName}</Text>
              <Text variant="bodySmall" style={{ color: colors.secondary }}>Verified Student</Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 24 }} />

          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>Description</Text>
          <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant, lineHeight: 24 }}>{listing.description}</Text>
        </View>
      </ScrollView>

      {/* Sticky Action Footer */}
      <Surface style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: insets.bottom + 16, backgroundColor: 'white', elevation: 8 }}>
        {isOwner ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button mode="outlined" onPress={() => { }} style={{ flex: 1, borderRadius: 12, borderColor: colors.error }} textColor={colors.error}>Delete</Button>
            <Button mode="contained" onPress={() => router.push(`/listing/edit/${listing.$id}`)} style={{ flex: 1, borderRadius: 12 }}>Edit</Button>
          </View>
        ) : (
          <Button mode="contained" onPress={handleContactSeller} style={{ borderRadius: 12 }} contentStyle={{ height: 50 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
            Message Seller
          </Button>
        )}
      </Surface>

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <Pressable style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }} onPress={() => setSelectedImage(null)}><Ionicons name="close" size={30} color="white" /></Pressable>
          <View style={{ flex: 1, justifyContent: 'center' }}><Image source={{ uri: selectedImage }} style={{ width: '100%', height: '80%' }} contentFit="contain" /></View>
        </View>
      </Modal>
    </View>
  );
}