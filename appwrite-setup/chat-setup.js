const sdk = require('node-appwrite');

const client = new sdk.Client();

client
    .setEndpoint('http://localhost/v1')
    .setProject('67e4b3a30013f83c7a98')  // Update with your project ID
    .setKey('standard_99b485055b59d0b52f040c27588a4fd7438e8a13e3706bdfbfc00fddd2775f7b5eb9fb4bdb450a6dc3979acce59768e312e7236bd7697e7b163831679dff03a71928f8104404c052ba24573f969cf9d05b4d363fa83269a51076ec6aa8f62ddaf7699cbaac1e5cbea68d3df8641779ce9a321eaea16a2efc31f5a8f2498192c0'); // Replace with your API key

const databases = new sdk.Databases(client);

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupChatCollections() {
    try {
        console.log('Starting Chat Collections setup...');
        
        // Get the existing database ID
        const DATABASE_ID = '67fc14630023511bae40';  // Update with your database ID
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