import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID, LISTINGS_COLLECTION_ID } from '../../appwrite/config';
import UserProfileForm from '../components/UserProfileForm';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  
  if (!user) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.message}>Please log in to view your profile</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity> 
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {isEditing ? (
          <UserProfileForm existingProfile={profile} onProfileSaved={profileSaved} />
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile?.displayName || user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              
              {profile && profile.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.bioLabel}>About Me</Text>
                  <Text style={styles.bio}>{profile.bio}</Text>
                </View>
              )}
              
              {profile && (profile.contactEmail || profile.phoneNumber) && (
                <View style={styles.contactSection}>
                  <Text style={styles.contactLabel}>Contact Information</Text>
                  {profile.contactEmail && (
                    <Text style={styles.contactInfo}>Email: {profile.contactEmail}</Text>
                  )}
                  {profile.phoneNumber && (
                    <Text style={styles.contactInfo}>Phone: {profile.phoneNumber}</Text>
                  )}
                </View>
              )}
            </View>
            
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
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  profileInfo: {
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  bioSection: {
    marginBottom: 16,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    marginBottom: 2,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listingsSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyListings: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
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
    borderBottomColor: '#eee',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    color: '#2196F3',
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
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  inactiveStatus: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: 200,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});