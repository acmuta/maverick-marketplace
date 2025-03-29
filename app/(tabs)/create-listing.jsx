import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ListingForm from '../components/ListingForm';

export default function CreateListingScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <ListingForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});