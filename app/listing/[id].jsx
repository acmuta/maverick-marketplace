import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Modal, Pressable, StatusBar, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Query, ID, Permission, Role } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Text, Button, useTheme, IconButton, ActivityIndicator, Avatar, Divider, Surface, Menu } from 'react-native-paper';
import { Feather, Ionicons } from '@expo/vector-icons';
import { account, databases, storage, getImageUrl, DATABASE_ID, LISTINGS_COLLECTION_ID, IMAGES_COLLECTION_ID, USERS_COLLECTION_ID, IMAGES_BUCKET_ID, REPORTS_COLLECTION_ID } from '../../appwrite';

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
  const [menuVisible, setMenuVisible] = useState(false);

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
      setImages(imgs.documents.map(img => ({ url: getImageUrl(IMAGES_BUCKET_ID, img.fileId, 800, 800), id: img.$id })));
    } catch (e) { Alert.alert('Error', 'Failed to load.'); router.back(); } finally { setIsLoading(false); }
  };

  const handleContactSeller = () => {
    if (!currentUser) return Alert.alert('Login Required', 'Please log in.', [{ text: 'Login', onPress: () => router.push('/login') }]);
    router.push({ pathname: '/chat/new', params: { listingId: listing.$id, sellerId: listing.userId } });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const imageDoc = await databases.listDocuments(
                DATABASE_ID,
                IMAGES_COLLECTION_ID,
                [Query.equal('listingId', id)]
              );

              for (const doc of imageDoc.documents) {
                try {
                  await storage.deleteFile(IMAGES_BUCKET_ID, doc.fileId);
                  await databases.deleteDocument(DATABASE_ID, IMAGES_COLLECTION_ID, doc.$id);
                } catch (e) {
                  console.error('Error deleting image:', e);
                }
              }

              await databases.deleteDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, id);
              Alert.alert('Deleted', 'Listing has been deleted.');
              router.replace('/(tabs)/profile');
            } catch (e) {
              console.error('Delete error:', e);
              Alert.alert('Error', 'Failed to delete listing.');
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    setMenuVisible(false);
    
    Alert.alert(
      'Report Listing',
      'Why are you reporting this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport('spam', 'This listing is spam') },
        { text: 'Inappropriate', onPress: () => submitReport('inappropriate', 'This listing contains inappropriate content') },
        { text: 'Scam', onPress: () => submitReport('scam', 'This listing appears to be a scam') },
        { text: 'Other', onPress: () => submitReport('other', 'Other reason') }
      ]
    );
  };

  const submitReport = async (reason, description) => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to report.');
      return;
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          reporterId: currentUser.$id,
          reportedItemType: 'listing',
          reportedItemId: listing.$id,
          reportedUserId: listing.userId,
          reason,
          description,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        [
          Permission.read(Role.user(currentUser.$id)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.delete(Role.user(currentUser.$id))
        ]
      );
      
      Alert.alert('Report Submitted', 'Thank you for reporting. We will review this listing.');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!listing) return null;

  const isOwner = currentUser && currentUser.$id === listing.userId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header (Absolute) */}
        <View style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
          <Pressable
            style={{ backgroundColor: 'white', borderRadius: 20, padding: 8, elevation: 4 }}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </Pressable>
          
          {!isOwner && currentUser && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Pressable
                  style={{ backgroundColor: 'white', borderRadius: 20, padding: 8, elevation: 4 }}
                  onPress={() => setMenuVisible(true)}
                >
                  <Feather name="more-vertical" size={24} color="black" />
                </Pressable>
              }
            >
              <Menu.Item onPress={handleReport} title="Report Listing" leadingIcon="flag" />
            </Menu>
          )}
        </View>

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
            <Button mode="outlined" onPress={handleDelete} style={{ flex: 1, borderRadius: 12, borderColor: colors.error }} textColor={colors.error}>Delete</Button>
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
