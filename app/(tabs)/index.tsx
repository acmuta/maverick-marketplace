import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Models } from 'react-native-appwrite';
import React, { useState, useEffect } from 'react';
import { account } from '../../appwrite/config';

export default function TabIndex() {
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if there's an active session
        try {
          const session = await account.getSession('current');
          if (session) {
            const user = await account.get();
            setLoggedInUser(user);
          }
        } catch (sessionError) {
          // No active session, this is expected for new users
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Session error:', error);
      }
    };
    
    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maverick Marketplace</Text>
      <Text style={styles.welcomeText}>
        {loggedInUser 
          ? `Welcome back, ${loggedInUser.name}!` 
          : 'Please log in to continue'}
      </Text>
      <Text style={styles.infoText}>
        This is the home screen of your Maverick Marketplace app.
      </Text>
      <Text style={styles.infoText}>
        You can now start building your marketplace features here.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#555',
  },
});

