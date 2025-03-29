import React, {useState} from "react";
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ID } from "react-native-appwrite";
import { databases, account, DATABASE_ID, USERS_COLLECTION_ID } from '../../appwrite/config'

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

        setIsLoading(true);
        try{
            const currentUser = await account.get();

            const profileData = {
                userId: currentUser.$id,
                displayName,
                bio,
                contactEmail,
                phoneNumber,
                createdAt: new Date().toISOString(),
            };

            if (existingProfile){
                await databases.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    existingProfile.$id,
                    profileData
                );
            } else {
                await databases.createDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    ID.unique(),
                    profileData     
                )
            }

            Alert.alert('Success', 'Profile saved successfully');
            if (onProfileSaved) onProfileSaved();
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');  
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
          />
          
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself (optional)"
            multiline
            numberOfLines={4}
          />
          
          <Text style={styles.label}>Contact Email</Text>
          <TextInput
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="Contact email address (optional)"
            keyboardType="email-address"
          />
          
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone number (optional)"
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
      },
      label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
      },
      input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
      },
      textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 10,
      },
      button: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
      },
      buttonDisabled: {
        backgroundColor: '#A9A9A9',
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
      },
    });