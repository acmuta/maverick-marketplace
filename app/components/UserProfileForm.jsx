import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../../appwrite';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { showError, ErrorMessages } from '../utils/errorHandler';

export default function UserProfileForm({ existingProfile, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [contactEmail, setContactEmail] = useState(existingProfile?.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const saveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update Appwrite account name
      await account.updateName(displayName);

      // 2. Update user document in users collection if it exists
      // We try/catch this part separately in case the user doc is missing or permissions issue
      try {
        if (existingProfile.$id) {
          // If existingProfile is the Auth user object, it has $id.
          // However, we should be updating the *Users Collection* document if we have custom fields like bio/phoneNumber.
          // But 'existingProfile' passed from ProfileScreen is the 'user' object from AuthContext (which is Account object).
          // If we want to store Bio/Phone, we need a document in 'users' collection.
          // Let's assume there is a 'users' collection with same ID as user $id.

          // First check if document exists, if not create it, if yes update it.
          // But normally we should expect it to exist if we are editing.
          // Let's try update, if fails, maybe create? 
          // For now, let's just try updating the collection document.

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

      Alert.alert('Success', 'Profile updated!');
      if (onProfileSaved) onProfileSaved();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(ErrorMessages.UPDATE_FAILED, error);
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