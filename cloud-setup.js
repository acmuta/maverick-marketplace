const sdk = require('node-appwrite');
require('dotenv').config();
const fs = require('fs');

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createDatabase() {
    try {
        console.log('Creating database...');
        const db = await databases.create(
            sdk.ID.unique(),
            'marketplace'
        );
        console.log(`Database created with ID: ${db.$id}`);
        return db.$id;
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    }
}

async function createUsersCollection(databaseId) {
    try {
        console.log('Creating users collection...');
        const collection = await databases.createCollection(
            databaseId,
            'users',
            'Users',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        
        console.log('Adding attributes to users collection...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'userId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'displayName', 100, false),
            databases.createStringAttribute(databaseId, collection.$id, 'bio', 1000, false),
            databases.createStringAttribute(databaseId, collection.$id, 'avatarUrl', 255, false),
            databases.createStringAttribute(databaseId, collection.$id, 'contactEmail', 255, false),
            databases.createStringAttribute(databaseId, collection.$id, 'phoneNumber', 20, false),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'createdAt', true)
        ];
        
        await Promise.all(attributes);
        await wait(2000); // Wait for attributes to be processed
        
        console.log('Creating index for users collection...');
        await databases.createIndex(
            databaseId,
            collection.$id,
            'user_index',
            'key',
            ['userId']
        );
        
        console.log('Users collection set up successfully');
        return collection.$id;
    } catch (error) {
        console.error('Error setting up users collection:', error);
        throw error;
    }
}

async function createListingsCollection(databaseId) {
    try {
        console.log('Creating listings collection...');
        const collection = await databases.createCollection(
            databaseId,
            'listings',
            'Listings',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        
        console.log('Adding attributes to listings collection...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'title', 100, true),
            databases.createStringAttribute(databaseId, collection.$id, 'description', 5000, true),
            databases.createFloatAttribute(databaseId, collection.$id, 'price', true, 0),
            databases.createStringAttribute(databaseId, collection.$id, 'category', 50, true),
            databases.createStringAttribute(databaseId, collection.$id, 'condition', 50, false),
            databases.createStringAttribute(databaseId, collection.$id, 'location', 100, false),
            databases.createStringAttribute(databaseId, collection.$id, 'userId', 36, true),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'createdAt', true),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'updatedAt', false),
            databases.createStringAttribute(databaseId, collection.$id, 'status', 20, false, 'active')
        ];
        
        await Promise.all(attributes);
        await wait(2000);
        
        console.log('Creating indexes for listings collection...');
        const indexes = [
            databases.createIndex(
                databaseId,
                collection.$id,
                'user_listings',
                'key',
                ['userId']
            ),
            databases.createIndex(
                databaseId,
                collection.$id,
                'status_index',
                'key',
                ['status']
            ),
            databases.createIndex(
                databaseId,
                collection.$id,
                'category_index',
                'key',
                ['category']
            )
        ];
        
        await Promise.all(indexes);
        
        console.log('Listings collection set up successfully');
        return collection.$id;
    } catch (error) {
        console.error('Error setting up listings collection:', error);
        throw error;
    }
}

async function createImagesCollection(databaseId) {
    try {
        console.log('Creating images collection...');
        const collection = await databases.createCollection(
            databaseId,
            'images',
            'Images',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        
        console.log('Adding attributes to images collection...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'listingId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'fileId', 36, true),
            databases.createIntegerAttribute(databaseId, collection.$id, 'order', false, 0)
        ];
        
        await Promise.all(attributes);
        await wait(2000); 
        
        console.log('Creating index for images collection...');
        await databases.createIndex(
            databaseId,
            collection.$id,
            'listing_images',
            'key',
            ['listingId']
        );
        
        console.log('Images collection set up successfully');
        return collection.$id;
    } catch (error) {
        console.error('Error setting up images collection:', error);
        throw error;
    }
}

async function createChatsCollection(databaseId) {
    try {
        console.log('Creating chats collection...');
        const collection = await databases.createCollection(
            databaseId,
            'chats',
            'Chats',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        
        console.log('Adding attributes to chats collection...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'listingId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'sellerId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'buyerId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'listingTitle', 100, true),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'createdAt', true),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'updatedAt', true)
        ];
        
        await Promise.all(attributes);
        await wait(2000); // Wait for attributes to be processed
        
        console.log('Creating indexes for chats collection...');
        const indexes = [
            databases.createIndex(
                databaseId,
                collection.$id,
                'seller_index',
                'key',
                ['sellerId']
            ),
            databases.createIndex(
                databaseId,
                collection.$id,
                'buyer_index',
                'key',
                ['buyerId']
            ),
            databases.createIndex(
                databaseId,
                collection.$id,
                'listing_index',
                'key',
                ['listingId']
            )
        ];
        
        await Promise.all(indexes);
        
        console.log('Chats collection set up successfully');
        return collection.$id;
    } catch (error) {
        console.error('Error setting up chats collection:', error);
        throw error;
    }
}

// Step 6: Create messages collection
async function createMessagesCollection(databaseId) {
    try {
        console.log('Creating messages collection...');
        const collection = await databases.createCollection(
            databaseId,
            'messages',
            'Messages',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        
        console.log('Adding attributes to messages collection...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'chatId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'senderId', 36, true),
            databases.createStringAttribute(databaseId, collection.$id, 'content', 2000, true),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'createdAt', true),
            databases.createBooleanAttribute(databaseId, collection.$id, 'isRead', false, false)
        ];
        
        await Promise.all(attributes);
        await wait(2000); // Wait for attributes to be processed
        
        console.log('Creating index for messages collection...');
        await databases.createIndex(
            databaseId,
            collection.$id,
            'chat_index',
            'key',
            ['chatId']
        );
        
        console.log('Messages collection set up successfully');
        return collection.$id;
    } catch (error) {
        console.error('Error setting up messages collection:', error);
        throw error;
    }
}

// Step 7: Create storage bucket
async function createStorageBucket() {
    try {
        console.log('Creating storage bucket...');
        const bucket = await storage.createBucket(
            'listing-images',
            'Listing Images',
            [
                sdk.Permission.read(sdk.Role.any()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users()),
                sdk.Permission.delete(sdk.Role.users())
            ],
            true  // Enable file previews
        );
        
        console.log('Storage bucket created successfully');
        return bucket.$id;
    } catch (error) {
        console.error('Error creating storage bucket:', error);
        throw error;
    }
}

// Main setup function
async function setup() {
    try {
        console.log('Starting Appwrite Cloud setup...');
        
        // Step 1: Create database
        const databaseId = await createDatabase();
        
        // Steps 2-6: Create collections
        const usersCollectionId = await createUsersCollection(databaseId);
        const listingsCollectionId = await createListingsCollection(databaseId);
        const imagesCollectionId = await createImagesCollection(databaseId);
        const chatsCollectionId = await createChatsCollection(databaseId);
        const messagesCollectionId = await createMessagesCollection(databaseId);
        
        // Step 7: Create storage bucket
        const bucketId = await createStorageBucket();
        
        // Output configuration information
        console.log('\nSetup complete! Here are your configuration values:');
        console.log('====================================================');
        console.log(`EXPO_PUBLIC_DATABASE_ID=${databaseId}`);
        console.log(`EXPO_PUBLIC_USERS_COLLECTION_ID=${usersCollectionId}`);
        console.log(`EXPO_PUBLIC_LISTINGS_COLLECTION_ID=${listingsCollectionId}`);
        console.log(`EXPO_PUBLIC_IMAGES_COLLECTION_ID=${imagesCollectionId}`);
        console.log(`EXPO_PUBLIC_CHATS_COLLECTION_ID=${chatsCollectionId}`);
        console.log(`EXPO_PUBLIC_MESSAGES_COLLECTION_ID=${messagesCollectionId}`);
        console.log(`EXPO_PUBLIC_IMAGES_BUCKET_ID=${bucketId}`);
        
        // Create example .env file
        const envContent = `# Appwrite Cloud Configuration (Student Plan)
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=${process.env.APPWRITE_PROJECT_ID}
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace

# Collection/Database IDs
EXPO_PUBLIC_DATABASE_ID=${databaseId}
EXPO_PUBLIC_USERS_COLLECTION_ID=${usersCollectionId}
EXPO_PUBLIC_LISTINGS_COLLECTION_ID=${listingsCollectionId}
EXPO_PUBLIC_IMAGES_COLLECTION_ID=${imagesCollectionId}
EXPO_PUBLIC_IMAGES_BUCKET_ID=${bucketId}
EXPO_PUBLIC_CHATS_COLLECTION_ID=${chatsCollectionId}
EXPO_PUBLIC_MESSAGES_COLLECTION_ID=${messagesCollectionId}

# Other settings
EXPO_ROUTER_APP_ROOT=./app
EXPO_ROUTER_IMPORT_MODE=sync`;

        // Save .env file
        fs.writeFileSync('.env.cloud', envContent);
        console.log('\nCreated .env.cloud file with all your configuration values.');
        console.log('Copy this file to .env to use these settings in your app.');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

// Run the setup
setup();
