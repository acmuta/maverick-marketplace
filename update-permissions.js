/**
 * Script to update Appwrite collection permissions to allow delete
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

const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;
const IMAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_IMAGES_COLLECTION_ID;

async function updatePermissions() {
    try {
        console.log('Updating listings collection permissions...');
        await databases.updateCollection(
            DATABASE_ID,
            LISTINGS_COLLECTION_ID,
            'Listings',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())  // Added delete permission
            ],
            true,  // Document security enabled
            true   // Collection enabled
        );
        console.log('Listings collection updated successfully!');

        console.log('Updating images collection permissions...');
        await databases.updateCollection(
            DATABASE_ID,
            IMAGES_COLLECTION_ID,
            'Images',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())  // Added delete permission
            ],
            true,  // Document security enabled
            true   // Collection enabled
        );
        console.log('Images collection updated successfully!');

        console.log('\nDone! Delete permissions have been added to both collections.');
        console.log('You can now delete listings from the app.');

    } catch (error) {
        console.error('Error updating permissions:', error);
        console.log('\nAlternative: You can update permissions manually in the Appwrite Console:');
        console.log('1. Go to your Appwrite Console');
        console.log('2. Navigate to Databases > Your Database > Listings collection');
        console.log('3. Go to Settings tab');
        console.log('4. In Permissions, add delete(users) permission');
        console.log('5. Repeat for Images collection');
    }
}

updatePermissions();
