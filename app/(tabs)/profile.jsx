import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, LISTINGS_COLLECTION_ID } from '../../appwrite';
import UserProfileForm from '../components/UserProfileForm';

// Define consistent theme colors - matching home page
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
  successLight: 'rgba(76, 175, 80, 0.2)',
  errorLight: 'rgba(255, 82, 82, 0.2)',
  background: '#0A1929',
  cardBackground: '#0F2942',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
};

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
        
        const profileResponse = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('userId', currentUser.$id)]
        );
        
        if (profileResponse.documents.length > 0) {
          setProfile(profileResponse.documents[0]);
        }
        
        const listingsResponse = await databases.listDocuments(
          DATABASE_ID,
          LISTINGS_COLLECTION_ID,
          [
            Query.equal('userId', currentUser.$id),
            Query.orderDesc('createdAt')
          ]
        );
        
        setMyListings(listingsResponse.documents);
      } catch (error) {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setProfile(null);
      setMyListings([]);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };
  
  const profileSaved = () => {
    setIsEditing(false);
    fetchUserData();
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
        <ActivityIndicator size="large" color={COLORS.brightOrange} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={[styles.containerCenter, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.message}>Please log in to view your profile</Text>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity> 
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBlue} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="person" size={24} color={COLORS.brightOrange} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 80 }}>
        {isEditing ? (
          <UserProfileForm existingProfile={profile} onProfileSaved={profileSaved} />
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {(profile?.displayName || user.name).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{profile?.displayName || user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>
            
            {profile && profile.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.sectionLabel}>About Me</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            )}
            
            {profile && (profile.contactEmail || profile.phoneNumber) && (
              <View style={styles.contactSection}>
                <Text style={styles.sectionLabel}>Contact Information</Text>
                {profile.contactEmail && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.mediumGray} />
                    <Text style={styles.contactInfo}>{profile.contactEmail}</Text>
                  </View>
                )}
                {profile.phoneNumber && (
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={18} color={COLORS.mediumGray} />
                    <Text style={styles.contactInfo}>{profile.phoneNumber}</Text>
                  </View>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>
                {profile ? 'Edit Profile' : 'Complete Your Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* My Listings Section */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          
          {myListings.length === 0 ? (
            <View style={styles.emptyListings}>
              <Ionicons name="pricetags-outline" size={50} color={COLORS.mediumGray} />
              <Text style={styles.emptyText}>You don't have any listings yet</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/create-listing')}
              >
                <Text style={styles.createButtonText}>Create a Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listingsList}>
              {myListings.map((listing) => (
                <TouchableOpacity
                  key={listing.$id}
                  style={styles.listingItem}
                  onPress={() => router.push(`/listing/${listing.$id}`)}
                >
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle}>{listing.title}</Text>
                    <Text style={styles.listingPrice}>${listing.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.listingStatus}>
                    <Text 
                      style={[
                        styles.statusText, 
                        listing.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                      ]}
                    >
                      {listing.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Create Listing Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/create-listing')}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.white,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.brightOrange,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: 200,
  },
  loginButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    backgroundColor: COLORS.mediumBlue,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brightOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 26,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.white,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  bioSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.brightOrange,
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  contactSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 16,
    marginLeft: 8,
    color: COLORS.textPrimary,
  },
  editButton: {
    backgroundColor: COLORS.brightOrange,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listingsSection: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.white,
  },
  emptyListings: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.brightOrange,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listingsList: {
    marginBottom: 8,
  },
  listingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: COLORS.white,
  },
  listingPrice: {
    fontSize: 14,
    color: COLORS.brightOrange,
    fontWeight: '600',
  },
  listingStatus: {
    marginLeft: 8,
  },
  statusText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeStatus: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  inactiveStatus: {
    backgroundColor: COLORS.errorLight,
    color: COLORS.error,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});