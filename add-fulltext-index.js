// Script to add fulltext index to the listings collection
const sdk = require('node-appwrite');
require('dotenv').config(); // Make sure dotenv is installed and imported

// Initialize the Appwrite SDK
const client = new sdk.Client();
const databases = new sdk.Databases(client);

// Get database ID and collection ID from environment or directly define them
const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID;
const LISTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID || 'listings';
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY'; // Replace 'YOUR_API_KEY' with actual API key
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

console.log('Database ID:', DATABASE_ID);
console.log('Collection ID:', LISTINGS_COLLECTION_ID);
console.log('Endpoint:', ENDPOINT);
console.log('Project ID:', PROJECT_ID);

// Set your Appwrite credentials
client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

// Function to add fulltext index
async function addFulltextIndex() {
    try {
        if (!DATABASE_ID) {
            console.error('Database ID is required. Please set EXPO_PUBLIC_DATABASE_ID in your .env file');
            return;
        }
        
        if (!LISTINGS_COLLECTION_ID) {
            console.error('Collection ID is required. Please set EXPO_PUBLIC_LISTINGS_COLLECTION_ID in your .env file');
            return;
        }
        
        console.log(`Creating fulltext index for database ${DATABASE_ID} collection ${LISTINGS_COLLECTION_ID}`);
        
        // Create fulltext index for the 'title' field
        await databases.createIndex(
            DATABASE_ID,
            LISTINGS_COLLECTION_ID,
            'fulltext_title',
            'fulltext',
            ['title'],
            false // Not required to make this index unique
        );
        
        console.log('Fulltext index created successfully for title field');
        
        // Optionally, create another index for description to make it searchable
        await databases.createIndex(
            DATABASE_ID,
            LISTINGS_COLLECTION_ID,
            'fulltext_description',
            'fulltext',
            ['description'],
            false
        );
        
        console.log('Fulltext index created successfully for description field');
        
    } catch (error) {
        console.error('Error creating fulltext index:', error);
    }
}

// Run the function
addFulltextIndex();