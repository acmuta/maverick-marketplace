import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert, StatusBar, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, ActivityIndicator, Divider, useTheme, Avatar, IconButton, Surface } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import { databases, getImageUrl, DATABASE_ID, USERS_COLLECTION_ID, LISTINGS_COLLECTION_ID, IMAGES_BUCKET_ID, Query } from '../../appwrite';
import UserProfileForm from '../components/UserProfileForm';
import LoginPrompt from '../components/LoginPrompt';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout, refreshUser, isEmailVerified, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    if (user) loadMyListings();
  }, [user]);

  const loadMyListings = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        LISTINGS_COLLECTION_ID,
        [Query.equal('userId', user.$id), Query.orderDesc('createdAt')]
      );
      setMyListings(response.documents);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadMyListings();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Log Out', onPress: async () => { await logout(); router.replace('/login'); } }
    ])
  };

  if (!user) {
    return <LoginPrompt message="Log in to view your profile" icon="person-circle-outline" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '800', color: colors.onBackground }}>Profile</Text>
        <IconButton icon="logout" iconColor={colors.error} size={20} onPress={handleLogout} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>

        {/* Profile Card */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={{ elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 10, backgroundColor: 'white', borderRadius: 50 }}>
            <Avatar.Text
              size={100}
              label={user.displayName?.charAt(0).toUpperCase() || 'U'}
              style={{ backgroundColor: colors.primaryContainer }}
              color={colors.primary}
              labelStyle={{ fontSize: 40, fontWeight: 'bold' }}
            />
          </View>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginTop: 16 }}>{user.displayName}</Text>
          <Text variant="bodyMedium" style={{ color: colors.secondary }}>{user.email}</Text>

          {/* Verification Badge - Real Status */}
          {isEmailVerified ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
              <Ionicons name="checkmark-circle" size={16} color="#166534" />
              <Text style={{ color: '#166534', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>Verified Student</Text>
            </View>
          ) : (
            <Pressable
              onPress={async () => {
                try {
                  await sendVerificationEmail();
                  Alert.alert('Email Sent', 'Check your inbox for the verification link.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to send verification email.');
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}
            >
              <Ionicons name="alert-circle" size={16} color="#92400E" />
              <Text style={{ color: '#92400E', fontWeight: 'bold', marginLeft: 4, fontSize: 12 }}>Tap to Verify Email</Text>
            </Pressable>
          )}

          <Button
            mode="text"
            onPress={() => setIsEditing(!isEditing)}
            textColor={colors.primary}
            style={{ marginTop: 8 }}
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </View>

        <View style={{ padding: 16 }}>
          {isEditing ? (
            <Surface style={{ padding: 16, borderRadius: 16, backgroundColor: 'white', elevation: 1 }}>
              <UserProfileForm existingProfile={user} onProfileSaved={() => { setIsEditing(false); handleRefresh(); }} />
            </Surface>
          ) : (
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, marginLeft: 4 }}>My Listings</Text>
              {myListings.length === 0 ? (
                <Surface style={{ padding: 24, borderRadius: 16, alignItems: 'center', backgroundColor: 'white' }}>
                  <Text style={{ color: colors.secondary }}>No listings yet.</Text>
                </Surface>
              ) : (
                myListings.map(item => {
                  const imageUrl = item.primaryImageFileId
                    ? getImageUrl(IMAGES_BUCKET_ID, item.primaryImageFileId, 100, 100)
                    : null;
                  return (
                    <Pressable
                      key={item.$id}
                      onPress={() => router.push(`/listing/${item.$id}`)}
                      style={{ marginBottom: 12, borderRadius: 16, backgroundColor: 'white', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                    >
                      <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
                        <View style={{ width: 50, height: 50, backgroundColor: colors.secondaryContainer, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={{ width: 50, height: 50 }}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <Feather name="image" size={24} color={colors.secondary} />
                          )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text variant="titleMedium" style={{ fontWeight: '600' }} numberOfLines={1}>{item.title}</Text>
                          <Text style={{ color: item.status === 'active' ? '#166534' : colors.secondary, fontWeight: 'bold', fontSize: 12 }}>
                            {item.status.toUpperCase()}
                          </Text>
                        </View>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>${item.price}</Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 }
});