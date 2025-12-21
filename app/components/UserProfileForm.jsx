import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { account, databases, DATABASE_ID, USERS_COLLECTION_ID } from '../../appwrite';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

export default function UserProfileForm({ existingProfile, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(existingProfile?.displayName || '');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [contactEmail, setContactEmail] = useState(existingProfile?.contactEmail || '');
  const [phoneNumber, setPhoneNumber] = useState(existingProfile?.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const saveProfile = async () => {
    if (!displayName.trim()) { Alert.alert('Error', 'Display name is required'); return; }
    if (displayName.trim().length < 2) { Alert.alert('Error', 'Display name must be at least 2 characters'); return; }

    setIsLoading(true);
    try {
      const currentUser = await account.get();
      const profileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        contactEmail: contactEmail.trim(),
        phoneNumber: phoneNumber.trim(),
      };
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUser.$id, profileData);
      Alert.alert('Success', 'Profile saved successfully');
      if (onProfileSaved) onProfileSaved();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Display Name *"
        value={displayName}
        onChangeText={setDisplayName}
        mode="flat"
        style={styles.input}
        placeholder="Your display name"
        underlineColor={colors.outline}
        activeUnderlineColor={colors.primary}
        contentStyle={{ paddingHorizontal: 0 }}
        theme={{ colors: { background: 'transparent' } }}
      />

      <TextInput
        label="Bio"
        value={bio}
        onChangeText={setBio}
        mode="flat"
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Tell us about yourself (optional)"
        underlineColor={colors.outline}
        activeUnderlineColor={colors.primary}
        contentStyle={{ paddingHorizontal: 0 }}
        theme={{ colors: { background: 'transparent' } }}
      />

      <TextInput
        label="Contact Email"
        value={contactEmail}
        onChangeText={setContactEmail}
        mode="flat"
        style={styles.input}
        placeholder="Contact email address (optional)"
        keyboardType="email-address"
        autoCapitalize="none"
        underlineColor={colors.outline}
        activeUnderlineColor={colors.primary}
        contentStyle={{ paddingHorizontal: 0 }}
        theme={{ colors: { background: 'transparent' } }}
      />

      <TextInput
        label="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        mode="flat"
        style={styles.input}
        placeholder="Phone number (optional)"
        keyboardType="phone-pad"
        underlineColor={colors.outline}
        activeUnderlineColor={colors.primary}
        contentStyle={{ paddingHorizontal: 0 }}
        theme={{ colors: { background: 'transparent' } }}
      />

      <Button
        mode="contained"
        onPress={saveProfile}
        loading={isLoading}
        disabled={isLoading}
        style={[styles.button, { backgroundColor: colors.primary }]}
        labelStyle={{ fontWeight: 'bold' }}
      >
        {existingProfile ? 'Update Profile' : 'Create Profile'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    margin: 0,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    borderRadius: 50,
    height: 50,
    justifyContent: 'center',
  },
});