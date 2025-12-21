import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { databases, DATABASE_ID, LISTINGS_COLLECTION_ID } from '../../../appwrite';
import ListingForm from '../../components/ListingForm';
import { useAuth } from '../../contexts/AuthContext';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading listing...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
