import { Account, Client, ID, Databases, Storage, Query } from 'appwrite';
import { 
    EXPO_PUBLIC_APPWRITE_ENDPOINT,
    EXPO_PUBLIC_APPWRITE_PROJECT_ID
  } from '@env';
const client = new Client();

client
  .setEndpoint(EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(EXPO_PUBLIC_APPWRITE_PROJECT_ID);

console.log('Appwrite configured with:', {
  endpoint: EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: EXPO_PUBLIC_APPWRITE_PROJECT_ID
});
export const account = new Account(client);

export const databases = new Databases(client);

export const storage = new Storage(client);

export const isValidUTAEmail = (email) => {
  return email.endsWith('@mavs.uta.edu');
};


export const registerUser = async (email, password, name) => {
  if (!isValidUTAEmail(email)) {
    throw new Error('Only @mavs.uta.edu email addresses are allowed to register');
  }

  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      name
    );
    
    if (newAccount) {
      await account.createEmailPasswordSession(email, password);
    }
    
    return newAccount;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    return await account.createEmailPasswordSession(email, password);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    return await account.deleteSessions('current');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};