import React, { useState } from "react";
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../../appwrite';

// Define consistent theme colors - matching the profile page
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

export default function UserProfileForm({ existingProfile, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [contactEmail, setContactEmail] = useState(existingProfile?.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    if (displayName.trim().length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = await account.get();

      const profileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        contactEmail: contactEmail.trim(),
        phoneNumber: phoneNumber.trim(),
      };

      // Update the profile document using account ID as document ID
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        currentUser.$id,
        profileData
      );

      Alert.alert('Success', 'Profile saved successfully');
      if (onProfileSaved) onProfileSaved();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Display Name *</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your display name"
        placeholderTextColor={COLORS.mediumGray}
      />
      
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us about yourself (optional)"
        placeholderTextColor={COLORS.mediumGray}
        multiline
        numberOfLines={4}
      />
      
      <Text style={styles.label}>Contact Email</Text>
      <TextInput
        style={styles.input}
        value={contactEmail}
        onChangeText={setContactEmail}
        placeholder="Contact email address (optional)"
        placeholderTextColor={COLORS.mediumGray}
        keyboardType="email-address"
      />
      
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Phone number (optional)"
        placeholderTextColor={COLORS.mediumGray}
        keyboardType="phone-pad"
      />
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={saveProfile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {existingProfile ? 'Update Profile' : 'Create Profile'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: COLORS.white,
  },
  input: {
    height: 40,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  button: {
    backgroundColor: COLORS.brightOrange,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});