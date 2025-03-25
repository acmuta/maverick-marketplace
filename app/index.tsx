// This should be your app/index.tsx file

import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();
  
  console.log("Root index loading, auth state:", isLoading ? "Loading" : (user ? "User exists" : "No user"));

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A24B0" />
        <Text style={{marginTop: 20}}>Checking login status...</Text>
      </View>
    );
  }

  // This is critical - explicitly check if user is null/undefined
  if (user === null || user === undefined) {
    console.log("No user found, redirecting to sign-in");
    return <Redirect href="/sign-in" />;
  }
  
  console.log("User found, redirecting to tabs");
  return <Redirect href="./(tabs)" />;
}