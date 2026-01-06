import { Client, Account, Databases, Storage, Functions, Query, ID, Permission, Role } from 'react-native-appwrite';
import { Platform } from 'react-native';

const appwriteEndpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const appwritePlatform = process.env.EXPO_PUBLIC_APPWRITE_PLATFORM;

if (!appwriteEndpoint) {
  console.error("Appwrite endpoint is not set. Check EXPO_PUBLIC_APPWRITE_ENDPOINT in .env");
}
if (!appwriteProjectId) {
  console.error("Appwrite project ID is not set. Check EXPO_PUBLIC_APPWRITE_PROJECT_ID in .env");
}


const client = new Client()
  .setEndpoint(appwriteEndpoint)
  .setProject(appwriteProjectId);

if (Platform.OS !== 'web' && appwritePlatform) {
  client.setPlatform(appwritePlatform);
} else if (Platform.OS !== 'web' && !appwritePlatform) {
  console.warn("Appwrite platform not set for native, Appwrite calls might fail for native-specific features.");
}


const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
export const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID;
export const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
export const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;
export const IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_IMAGES_BUCKET_ID;
export const CHATS_COLLECTION_ID = process.env.EXPO_PUBLIC_CHATS_COLLECTION_ID;
export const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID;
export const VERIFICATION_CODES_COLLECTION_ID = process.env.EXPO_PUBLIC_VERIFICATION_CODES_COLLECTION_ID;
export const REPORTS_COLLECTION_ID = process.env.EXPO_PUBLIC_REPORTS_COLLECTION_ID;
export const BLOCKED_USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_BLOCKED_USERS_COLLECTION_ID;


export const getImageUrl = (
  bucketId: string,
  fileId: string,
  width: number = 400,
  height: number = 300
): string => {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;

  // Check for tunnel mode - use public URL if set
  if (
    process.env.EXPO_PUBLIC_APPWRITE_TUNNEL_MODE === 'true' &&
    process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL
  ) {
    return `${process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_URL}/v1/storage/buckets/${bucketId}/files/${fileId}/preview?width=${width}&height=${height}&project=${projectId}`;
  }

  // Validate params
  if (!bucketId || !fileId || !endpoint || !projectId) {
    console.warn('getImageUrl: missing params', { bucketId, fileId, endpoint: !!endpoint, projectId: !!projectId });
    return '';
  }

  // Construct URL - endpoint already includes /v1, so just append the rest
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?width=${width}&height=${height}&project=${projectId}`;
};

export { client, account, databases, storage, functions, Query, ID, Permission, Role };