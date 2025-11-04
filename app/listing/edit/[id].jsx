import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases, DATABASE_ID, LISTINGS_COLLECTION_ID } from '../../../appwrite';
import ListingForm from '../../components/ListingForm';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  darkBlue: '#0A1929',
  mediumBlue: '#0F2942',
  brightOrange: '#FF9800',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
  error: '#FF5252',
};

export default function EditListingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        LISTINGS_COLLECTION_ID,
        id
      );

      // Verify ownership
      if (!currentUser || response.userId !== currentUser.$id) {
        Alert.alert(
          'Access Denied',
          'You can only edit your own listings.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      setListing(response);
    } catch (error) {
      console.error('Error loading listing:', error);
      setError('Failed to load listing. Please try again.');
      Alert.alert(
        'Error',
        'Failed to load listing. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.brightOrange} />
          <Text style={styles.loadingText}>Loading listing...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!listing) {
    return null;
  }

  return <ListingForm existingListing={listing} isEditMode={true} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
});
