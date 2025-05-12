import { Client, Account, Databases, Storage } from 'react-native-appwrite';
import { Platform } from 'react-native';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

if (Platform.OS !== 'web') {
  client.setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM);
}

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const getImageUrl = (
  bucketId: string,
  fileId: string,
  width: number = 400,
  height: number = 300
): string => {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

  if (
    process.env.EXPO_PUBLIC_APPWRITE_TUNNEL_MODE === 'true' &&
    process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL
  ) {
    return `${process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL}/v1/storage/buckets/${bucketId}/files/${fileId}/preview?width=${width}&height=${height}&project=${projectId}`;
  }

  return storage.getFilePreview(bucketId, fileId, width, height).toString();
};

export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
export const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID;
export const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
export const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;
export const IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_IMAGES_BUCKET_ID;
export const CHATS_COLLECTION_ID = process.env.EXPO_PUBLIC_CHATS_COLLECTION_ID;
export const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID;

export { client, account, databases, storage, getImageUrl };