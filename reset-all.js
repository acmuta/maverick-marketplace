/**
 * DANGER: This script wipes ALL data from your Appwrite project
 * 
 * It deletes:
 * - All user accounts
 * - All documents (users, listings, images, chats, messages)
 * - All files in storage bucket
 * 
 * Run with: node reset-all.js
 * 
 * Make sure APPWRITE_API_KEY is in your .env file
 */

const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);
const users = new sdk.Users(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID;
const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;
const CHATS_COLLECTION_ID = process.env.EXPO_PUBLIC_CHATS_COLLECTION_ID;
const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID;
const IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_IMAGES_BUCKET_ID;

async function deleteAllDocuments(collectionId, collectionName) {
    try {
        console.log(`Deleting all documents from ${collectionName}...`);
        let documents = await databases.listDocuments(DATABASE_ID, collectionId, [sdk.Query.limit(100)]);
        let count = 0;

        while (documents.documents.length > 0) {
            for (const doc of documents.documents) {
                await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                count++;
            }
            documents = await databases.listDocuments(DATABASE_ID, collectionId, [sdk.Query.limit(100)]);
        }

        console.log(`   ✓ Deleted ${count} documents from ${collectionName}`);
        return count;
    } catch (error) {
        console.error(`   ✗ Error deleting from ${collectionName}:`, error.message);
        return 0;
    }
}

async function deleteAllFiles() {
    try {
        console.log('Deleting all files from storage...');
        let files = await storage.listFiles(IMAGES_BUCKET_ID, [sdk.Query.limit(100)]);
        let count = 0;

        while (files.files.length > 0) {
            for (const file of files.files) {
                await storage.deleteFile(IMAGES_BUCKET_ID, file.$id);
                count++;
            }
            files = await storage.listFiles(IMAGES_BUCKET_ID, [sdk.Query.limit(100)]);
        }

        console.log(`   ✓ Deleted ${count} files from storage`);
        return count;
    } catch (error) {
        console.error('   ✗ Error deleting files:', error.message);
        return 0;
    }
}

async function deleteAllUsers() {
    try {
        console.log('Deleting all user accounts...');
        let userList = await users.list([sdk.Query.limit(100)]);
        let count = 0;

        while (userList.users.length > 0) {
            for (const user of userList.users) {
                await users.delete(user.$id);
                count++;
            }
            userList = await users.list([sdk.Query.limit(100)]);
        }

        console.log(`   ✓ Deleted ${count} user accounts`);
        return count;
    } catch (error) {
        console.error('   ✗ Error deleting users:', error.message);
        return 0;
    }
}

async function resetAll() {
    console.log('');
    console.log('🚨 =======================================');
    console.log('   RESETTING ALL DATA');
    console.log('======================================= 🚨');
    console.log('');

    // Delete in order (dependencies first)
    await deleteAllDocuments(MESSAGES_COLLECTION_ID, 'Messages');
    await deleteAllDocuments(CHATS_COLLECTION_ID, 'Chats');
    await deleteAllDocuments(IMAGES_COLLECTION_ID, 'Images');
    await deleteAllDocuments(LISTINGS_COLLECTION_ID, 'Listings');
    await deleteAllDocuments(USERS_COLLECTION_ID, 'Users');
    await deleteAllFiles();
    await deleteAllUsers();

    console.log('');
    console.log('✅ =======================================');
    console.log('   ALL DATA WIPED!');
    console.log('======================================= ✅');
    console.log('');
    console.log('Your project is now fresh and ready for testing.');
}

resetAll();
