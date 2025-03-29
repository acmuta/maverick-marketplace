import { Client, Account, Databases, Storage } from 'react-native-appwrite';
import { Platform } from 'react-native';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)

 if (Platform.OS !== 'web') {
    client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);
}

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const DATABASE_ID = '67e72aef00071555f538';
export const USERS_COLLECTION_ID = 'users';
export const LISTINGS_COLLECTION_ID = 'listings';
export const IMAGES_COLLECTION_ID = 'images';
export const IMAGES_BUCKET_ID = 'listing-images';

export { client, account, databases, storage };