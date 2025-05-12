import { Client, Account, Databases, Storage } from 'react-native-appwrite';
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

export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
export const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID;
export const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
export const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;
export const IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_IMAGES_BUCKET_ID;
export const CHATS_COLLECTION_ID = process.env.EXPO_PUBLIC_CHATS_COLLECTION_ID;
export const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID;


export const getImageUrl = (
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
    return `<span class="math-inline">\{process\.env\.EXPO\_PUBLIC\_APPWRITE\_PUBLIC\_URL\}/v1/storage/buckets/</span>{bucketId}/files/<span class="math-inline">\{fileId\}/preview?width\=</span>{width}&height=<span class="math-inline">\{height\}&project\=</span>{projectId}`;
  }
  if (!storage || !bucketId || !fileId) {
    console.warn('getImageUrl called with invalid params, returning placeholder or empty string.');
    return '';
  }
  try {
    return storage.getFilePreview(bucketId, fileId, width, height).toString();
  } catch (error) {
    console.error("Error generating file preview URL:", error);
    return '';
  }
};

export { client, account, databases, storage };