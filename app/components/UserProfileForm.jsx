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

  const saveProfile = async () => { /* ... same logic ... */ };

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