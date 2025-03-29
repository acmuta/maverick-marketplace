import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { account } from '../../appwrite/config';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Models } from 'react-native-appwrite';

export default function ProfileScreen() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert('Logout Failed', 'Could not log out');
    }
  };

  return (
    <View style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={50} color="#fff" />
        </View>
        
        {user ? (
          <Text style={styles.userName}>{user.name}</Text>
        ) : (
          <Text style={styles.userName}>Loading...</Text>
        )}
        
        {user?.email && (
          <Text style={styles.userEmail}>{user.email}</Text>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={20} color="white" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatar: {
    backgroundColor: '#2196F3',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});