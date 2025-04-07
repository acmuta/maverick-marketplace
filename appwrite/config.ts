import { Client, Account, Databases, Storage } from 'react-native-appwrite';
import { Platform } from 'react-native';

// Create the client with basic configuration
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

// Configure the client based on platform
if (Platform.OS !== 'web') {
  // Set the platform for mobile apps
  client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);
}

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Function to get image URLs that work with both local and tunnel modes
const getImageUrl = (bucketId, fileId, width = 400, height = 300) => {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

  // If we're in tunnel mode, use the public tunnel URL for images
  if (process.env.EXPO_PUBLIC_APPWRITE_TUNNEL_MODE === 'true' && 
    process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL) {
  return `${process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL}/v1/storage/buckets/${bucketId}/files/${fileId}/preview?width=${width}&height=${height}&project=${projectId}`;
  }
  
  // Otherwise use the standard method
  return storage.getFilePreview(bucketId, fileId, width, height).toString();
};

export const DATABASE_ID = '67e72aef00071555f538';
export const USERS_COLLECTION_ID = 'users';
export const LISTINGS_COLLECTION_ID = 'listings';
export const IMAGES_COLLECTION_ID = 'images';
export const IMAGES_BUCKET_ID = 'listing-images';
export const CHATS_COLLECTION_ID = '67e834c60026698fc1c8';
export const MESSAGES_COLLECTION_ID = '67e834c90039d2a6f82f';

export { client, account, databases, storage, getImageUrl };