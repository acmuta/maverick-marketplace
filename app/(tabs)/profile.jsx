import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { databases, DATABASE_ID, USERS_COLLECTION_ID, LISTINGS_COLLECTION_ID } from '../../appwrite';
import UserProfileForm from '../components/UserProfileForm';
import { useAuth } from '../contexts/AuthContext';
import { Text, useTheme, Avatar, Button, Divider, ActivityIndicator, IconButton, Surface } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout: authLogout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    if (!user) return;

    setIsLoadingData(true);
    try {
      try {
        const userProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id);
        setProfile(userProfile);
      } catch (profileError) {
        if (profileError.code === 404) {
          try {
            const newProfile = await databases.createDocument(
              DATABASE_ID, USERS_COLLECTION_ID, user.$id,
              {
                displayName: user.name || 'New User',
                bio: '', avatarUrl: '', contactEmail: user.email || '', phoneNumber: '',
                createdAt: new Date().toISOString(),
              }
            );
            setProfile(newProfile);
          } catch (e) { console.error(e); }
        }
      }

      const listingsResponse = await databases.listDocuments(
        DATABASE_ID, LISTINGS_COLLECTION_ID,
        [Query.equal('userId', user.$id), Query.orderDesc('createdAt')]
      );
      setMyListings(listingsResponse.documents);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      setProfile(null);
      setMyListings([]);
      router.push('/login');
    } catch (error) { console.error(error); }
  };

  const profileSaved = () => {
    setIsEditing(false);
    fetchUserData();
  };

  if (!user) {
    return (
      <View style={[styles.containerCenter, { backgroundColor: colors.background }]}>
        <Button mode="contained" onPress={() => router.push('/login')}>Log In</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Minimal Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>My Profile</Text>
        <Button mode="text" onPress={handleLogout} textColor={colors.error}>Logout</Button>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {isEditing ? (
          <View style={{ padding: 16 }}>
            <UserProfileForm existingProfile={profile} onProfileSaved={profileSaved} />
            <Button mode="outlined" style={{ marginTop: 10 }} onPress={() => setIsEditing(false)}>Cancel</Button>
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <View>
                <Avatar.Text size={80} label={(profile?.displayName || user.name).charAt(0).toUpperCase()} style={{ backgroundColor: colors.secondaryContainer }} color={colors.primary} />
                {/* Simulated .edu verification badge */}
                {user.email.endsWith('.edu') && (
                  <View style={[styles.badge, { backgroundColor: '#22c55e', borderColor: colors.background }]}>
                    <Feather name="check" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={{ marginTop: 16, alignItems: 'center' }}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{profile?.displayName || user.name}</Text>
                <Text variant="bodyMedium" style={{ color: colors.secondary }}>{user.email}</Text>
              </View>

              <Button
                mode="outlined"
                style={{ marginTop: 16, borderColor: colors.outline, width: 150 }}
                textColor={colors.primary}
                onPress={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </View>

            {profile?.bio ? (
              <View style={[styles.section, { borderTopColor: colors.outline }]}>
                <Text variant="bodyLarge">{profile.bio}</Text>
              </View>
            ) : null}

            <View style={[styles.section, { borderTopColor: colors.outline }]}>
              <Text variant="titleMedium" style={{ fontWeight: '900', marginBottom: 16 }}>My Listings</Text>
              {myListings.map((listing) => (
                <TouchableOpacity key={listing.$id} onPress={() => router.push(`/listing/${listing.$id}`)} style={[styles.listingRow, { borderBottomColor: colors.outline }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{listing.title}</Text>
                    <Text variant="bodySmall" style={{ color: listing.status === 'active' ? '#22c55e' : colors.error }}>{listing.status.toUpperCase()}</Text>
                  </View>
                  <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>${listing.price.toFixed(0)}</Text>
                  <Feather name="chevron-right" size={20} color={colors.secondary} />
                </TouchableOpacity>
              ))}
              {myListings.length === 0 && (
                <Text variant="bodyMedium" style={{ color: colors.secondary, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No listings yet.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  profileHeader: { alignItems: 'center', padding: 32 },
  badge: { position: 'absolute', bottom: 0, right: 0, padding: 4, borderRadius: 10, borderWidth: 2 },
  section: { padding: 20, borderTopWidth: 1 },
  listingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, gap: 10 },
});