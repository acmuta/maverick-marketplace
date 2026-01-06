import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../../appwrite';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { showError, ErrorMessages } from '../utils/errorHandler';
import { useSnackbar } from './SnackbarManager';

export default function UserProfileForm({ existingProfile, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [contactEmail, setContactEmail] = useState(existingProfile?.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();
  const { showSnackbar } = useSnackbar();

  const saveProfile = async () => {
    if (!displayName.trim()) {
      showSnackbar('Display name cannot be empty', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update Appwrite account name
      await account.updateName(displayName);

      // 2. Update user document in users collection if it exists
      try {
        if (existingProfile.$id) {
          await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            existingProfile.$id,
            {
              displayName: displayName,
              bio: bio,
              contactEmail: contactEmail,
              phoneNumber: phoneNumber
            }
          );
        }
      } catch (docError) {
        console.log('Error updating user document:', docError);
        // If document doesn't exist, create it
        if (docError.code === 404) {
          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            existingProfile.$id,
            {
              displayName: displayName,
              bio: bio,
              contactEmail: contactEmail,
              phoneNumber: phoneNumber
            }
          );
        }
      }

      showSnackbar('Profile updated successfully!', 'success');
      if (onProfileSaved) onProfileSaved();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(ErrorMessages.UPDATE_FAILED, error);
      showSnackbar('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextInput label="Display Name" value={displayName} onChangeText={setDisplayName} mode="flat" style={styles.input} underlineColor="transparent" activeUnderlineColor="transparent" />
      <TextInput label="Bio" value={bio} onChangeText={setBio} mode="flat" style={[styles.input, { height: 100 }]} multiline numberOfLines={3} underlineColor="transparent" activeUnderlineColor="transparent" />
      <TextInput label="Contact Email" value={contactEmail} onChangeText={setContactEmail} mode="flat" style={styles.input} keyboardType="email-address" underlineColor="transparent" activeUnderlineColor="transparent" />
      <TextInput label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} mode="flat" style={styles.input} keyboardType="phone-pad" underlineColor="transparent" activeUnderlineColor="transparent" />

      <Button mode="contained" onPress={saveProfile} loading={isLoading} style={{ marginTop: 16, borderRadius: 12 }} contentStyle={{ height: 50 }}>
        Save Profile
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 12, backgroundColor: '#F9FAFB', borderRadius: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
});