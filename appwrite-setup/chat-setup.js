const sdk = require('node-appwrite');

const client = new sdk.Client();

client
    .setEndpoint('http://localhost/v1')
    .setProject('67e728450014b2d21858')  // Update with your project ID
    .setKey('standard_aea5c51f24cd4daba56f4890061372862f96f92a910fa0258c81b0ba67d3c9c4d6d69aa8f06315f30b2106a55e20f3f49618b8453088803b385dd2c5292cc9ec84bd23137be8060478ef22123514bb5f27113540037be74b96ca0ea60119226d2f6c6c248c88cb84b7a723e1dd5cd9cce9036267a10a2c36ee460219371d23f3'); // Replace with your API key

const databases = new sdk.Databases(client);

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupChatCollections() {
    try {
        console.log('Starting Chat Collections setup...');
        
        // Get the existing database ID
        const DATABASE_ID = '67e72aef00071555f538';  // Update with your database ID
        console.log(`Using existing database: ${DATABASE_ID}`);

        // Create chats collection
        console.log('Creating chats collection...');
        const chatsCollection = await databases.createCollection(
            DATABASE_ID,
            sdk.ID.unique(),
            'chats',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        const chatsCollectionId = chatsCollection.$id;
        console.log(`Chats collection created with ID: ${chatsCollectionId}`);

        // Add attributes to chats collection
        console.log('Adding attributes to chats collection...');
        
        const chatAttributes = [
            databases.createStringAttribute(DATABASE_ID, chatsCollectionId, 'listingId', 36, true),
            databases.createStringAttribute(DATABASE_ID, chatsCollectionId, 'sellerId', 36, true),
            databases.createStringAttribute(DATABASE_ID, chatsCollectionId, 'buyerId', 36, true),
            databases.createStringAttribute(DATABASE_ID, chatsCollectionId, 'listingTitle', 100, true),
            databases.createDatetimeAttribute(DATABASE_ID, chatsCollectionId, 'createdAt', true),
            databases.createDatetimeAttribute(DATABASE_ID, chatsCollectionId, 'updatedAt', true)
        ];
        
        await Promise.all(chatAttributes);
        
        // Wait for attributes to be processed
        console.log('Waiting for attributes to be processed...');
        await wait(3000);
        
        console.log('Adding indexes to chats collection...');
        try {
            const chatIndexes = [
                databases.createIndex(
                    DATABASE_ID,
                    chatsCollectionId,
                    'seller_index',
                    'key',
                    ['sellerId']
                ),
                databases.createIndex(
                    DATABASE_ID,
                    chatsCollectionId,
                    'buyer_index',
                    'key',
                    ['buyerId']
                ),
                databases.createIndex(
                    DATABASE_ID,
                    chatsCollectionId,
                    'listing_index',
                    'key',
                    ['listingId']
                )
            ];
            
            await Promise.all(chatIndexes);
            console.log('Indexes created for chats collection');
        } catch (error) {
            console.error('Error creating indexes for chats collection:', error.message);
            console.log('Continuing with setup...');
        }

        // Create messages collection
        console.log('Creating messages collection...');
        const messagesCollection = await databases.createCollection(
            DATABASE_ID,
            sdk.ID.unique(),
            'messages',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        const messagesCollectionId = messagesCollection.$id;
        console.log(`Messages collection created with ID: ${messagesCollectionId}`);

        // Add attributes to messages collection
        console.log('Adding attributes to messages collection...');
        
        const messageAttributes = [
            databases.createStringAttribute(DATABASE_ID, messagesCollectionId, 'chatId', 36, true),
            databases.createStringAttribute(DATABASE_ID, messagesCollectionId, 'senderId', 36, true),
            databases.createStringAttribute(DATABASE_ID, messagesCollectionId, 'content', 2000, true),
            databases.createDatetimeAttribute(DATABASE_ID, messagesCollectionId, 'createdAt', true),
            databases.createBooleanAttribute(DATABASE_ID, messagesCollectionId, 'isRead', false, false)
        ];
        
        await Promise.all(messageAttributes);
        
        // Wait for attributes to be processed
        console.log('Waiting for attributes to be processed...');
        await wait(3000);
        
        console.log('Adding index to messages collection...');
        try {
            await databases.createIndex(
                DATABASE_ID,
                messagesCollectionId,
                'chat_index',
                'key',
                ['chatId']
            );
            console.log('Index created for messages collection');
        } catch (error) {
            console.error('Error creating index for messages collection:', error.message);
            console.log('Continuing with setup...');
        }

        console.log('\nChat setup completed successfully!');
        console.log('Database ID:', DATABASE_ID);
        console.log('Chats Collection ID:', chatsCollectionId);
        console.log('Messages Collection ID:', messagesCollectionId);
        
        console.log('\nAdd these constants to your appwrite/config.ts file:');
        console.log(`
export const CHATS_COLLECTION_ID = '${chatsCollectionId}';
export const MESSAGES_COLLECTION_ID = '${messagesCollectionId}';
        `);
    } catch (error) {
        console.error('Error during setup:', error);
    }
}

setupChatCollections();