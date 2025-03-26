import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { ID, Models } from 'react-native-appwrite';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { account } from '../appwrite/config';

export default function Index() {
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

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

  async function login(email: string, password: string) {
    try {
      await account.createEmailPasswordSession(email, password);
      setLoggedInUser(await account.get());
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async function register(email: string, password: string, name: string) {
    try {
      await account.create(ID.unique(), email, password, name);
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Maverick Marketplace</Text>
      <Text style={styles.subtitle}>
        {loggedInUser ? `Logged in as ${loggedInUser.name}` : 'Not logged in'}
      </Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={(text) => setName(text)}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => login(email, password)}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => register(email, password, name)}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        {loggedInUser && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              try {
                await account.deleteSession('current');
                setLoggedInUser(null);
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: '100%',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
