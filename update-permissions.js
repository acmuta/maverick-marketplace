/**
 * Script to FIX SECURITY: Enable documentSecurity on all collections
 * 
 * This is a CRITICAL security fix. When documentSecurity is enabled,
 * users need BOTH collection-level AND document-level permissions.
 * This prevents any user from editing/deleting any document.
 * 
 * Run this with: node update-permissions.js
 * 
 * Make sure you have APPWRITE_API_KEY in your .env file
 */

const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID;
const CHATS_COLLECTION_ID = process.env.EXPO_PUBLIC_CHATS_COLLECTION_ID;
const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID;
const IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_IMAGES_BUCKET_ID;

async function updatePermissions() {
    console.log('===========================================');
    console.log('SECURITY FIX: Enabling documentSecurity');
    console.log('===========================================\n');

    try {
        // 1. Update Users collection
        console.log('1. Updating USERS collection...');
        await databases.updateCollection(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            'Users',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true,  // documentSecurity ENABLED - users can only update their own docs
            true   // enabled
        );
        console.log('   ✓ Users collection secured\n');

        // 2. Update Listings collection
        console.log('2. Updating LISTINGS collection...');
        await databases.updateCollection(
            DATABASE_ID,
            LISTINGS_COLLECTION_ID,
            'Listings',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true,  // documentSecurity ENABLED
            true
        );
        console.log('   ✓ Listings collection secured\n');

        // 3. Update Images collection
        console.log('3. Updating IMAGES collection...');
        await databases.updateCollection(
            DATABASE_ID,
            IMAGES_COLLECTION_ID,
            'Images',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true,  // documentSecurity ENABLED
            true
        );
        console.log('   ✓ Images collection secured\n');

        // 4. Update Chats collection
        console.log('4. Updating CHATS collection...');
        await databases.updateCollection(
            DATABASE_ID,
            CHATS_COLLECTION_ID,
            'Chats',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true,  // documentSecurity ENABLED
            true
        );
        console.log('   ✓ Chats collection secured\n');

        // 5. Update Messages collection
        console.log('5. Updating MESSAGES collection...');
        await databases.updateCollection(
            DATABASE_ID,
            MESSAGES_COLLECTION_ID,
            'Messages',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true,  // documentSecurity ENABLED
            true
        );
        console.log('   ✓ Messages collection secured\n');

        console.log('===========================================');
        console.log('✅ ALL COLLECTIONS SECURED!');
        console.log('===========================================');
        console.log('\nWith documentSecurity enabled, users can only');
        console.log('update/delete documents where they have explicit');
        console.log('document-level permissions.');

    } catch (error) {
        console.error('❌ Error updating permissions:', error.message);
        console.log('\n--- MANUAL FIX INSTRUCTIONS ---');
        console.log('If the script fails, update permissions in Appwrite Console:');
        console.log('1. Go to Database > [collection] > Settings');
        console.log('2. Enable "Document Security" toggle');
        console.log('3. Repeat for all 5 collections');
    }
}

updatePermissions();
