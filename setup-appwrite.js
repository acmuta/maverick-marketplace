const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

require('dotenv').config();

const client = new sdk.Client();

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1';
let PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

rl.question('Enter your Appwrite API key: ', (apiKey) => {
  if (!apiKey) {
    console.error('API key is required.');
    rl.close();
    return;
  }

  if (!PROJECT_ID) {
    rl.question('Enter your Appwrite Project ID: ', (projectId) => {
      if (!projectId) {
        console.error('Project ID is required.');
        rl.close();
        return;
      }
      PROJECT_ID = projectId;
      setupAppwrite(ENDPOINT, PROJECT_ID, apiKey);
    });
  } else {
    setupAppwrite(ENDPOINT, PROJECT_ID, apiKey);
  }
});

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function updateEnvFile(ids) {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found. Make sure to create it first with setup-dev.js');
    return false;
  }
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    Object.entries(ids).forEach(([key, value]) => {
      const envKey = `EXPO_PUBLIC_${key}`;
      if (envContent.includes(envKey)) {
        envContent = envContent.replace(new RegExp(`${envKey}=.*`, 'g'), `${envKey}=${value}`);
      } else {
        envContent += `\n${envKey}=${value}`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with new collection IDs');
    return true;
  } catch (err) {
    console.error('Error updating .env file:', err.message);
    return false;
  }
}

async function setupAppwrite(endpoint, projectId, apiKey) {
  try {
    console.log('Starting Appwrite setup...');
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Project ID: ${projectId}`);
    
    client
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new sdk.Databases(client);
    const storage = new sdk.Storage(client);
    
    console.log('Creating database...');
    const db = await databases.create(
      sdk.ID.unique(),
      'marketplace'
    );
    const databaseId = db.$id;
    console.log(`Database created with ID: ${databaseId}`);

    console.log('Creating users collection...');
    const usersCollection = await databases.createCollection(
      databaseId,
      'users',
      'users',
      [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users())
      ]
    );
    const usersCollectionId = usersCollection.$id;
    console.log(`Users collection created with ID: ${usersCollectionId}`);

    console.log('Adding attributes to users collection...');
    
    const userAttributes = [
      databases.createStringAttribute(databaseId, usersCollectionId, 'userId', 36, true),
      databases.createStringAttribute(databaseId, usersCollectionId, 'displayName', 100, false),
      databases.createStringAttribute(databaseId, usersCollectionId, 'bio', 1000, false),
      databases.createStringAttribute(databaseId, usersCollectionId, 'avatarUrl', 255, false),
      databases.createStringAttribute(databaseId, usersCollectionId, 'contactEmail', 255, false),
      databases.createStringAttribute(databaseId, usersCollectionId, 'phoneNumber', 20, false),
      databases.createDatetimeAttribute(databaseId, usersCollectionId, 'createdAt', true)
    ];
    
    await Promise.all(userAttributes);
    
    console.log('Waiting for attributes to be processed...');
    await wait(3000);
    
    console.log('Adding index to users collection...');
    try {
      await databases.createIndex(
        databaseId,
        usersCollectionId,
        'user_index',
        'key',
        ['userId']
      );
      console.log('Index created for users collection');
    } catch (error) {
      console.error('Error creating index for users collection:', error.message);
      console.log('Continuing with setup...');
    }

    console.log('Creating listings collection...');
    const listingsCollection = await databases.createCollection(
      databaseId,
      'listings',
      'listings',
      [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users())
      ]
    );
    const listingsCollectionId = listingsCollection.$id;
    console.log(`Listings collection created with ID: ${listingsCollectionId}`);

    console.log('Adding attributes to listings collection...');
    const listingAttributes = [
      databases.createStringAttribute(databaseId, listingsCollectionId, 'title', 100, true),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'description', 5000, true),
      databases.createFloatAttribute(databaseId, listingsCollectionId, 'price', true, 0),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'category', 50, true),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'condition', 50, false),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'location', 100, false),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'userId', 36, true),
      databases.createDatetimeAttribute(databaseId, listingsCollectionId, 'createdAt', true),
      databases.createDatetimeAttribute(databaseId, listingsCollectionId, 'updatedAt', false),
      databases.createStringAttribute(databaseId, listingsCollectionId, 'status', 20, false, 'active')
    ];
    
    await Promise.all(listingAttributes);

    console.log('Waiting for attributes to be processed...');
    await wait(3000);
    
    console.log('Adding indexes to listings collection...');
    try {
      const listingIndexes = [
        databases.createIndex(
          databaseId,
          listingsCollectionId,
          'user_listings',
          'key',
          ['userId']
        ),
        databases.createIndex(
          databaseId,
          listingsCollectionId,
          'status_index',
          'key',
          ['status']
        ),
        databases.createIndex(
          databaseId,
          listingsCollectionId,
          'category_index',
          'key',
          ['category']
        )
      ];
      
      await Promise.all(listingIndexes);
      console.log('Indexes created for listings collection');
    } catch (error) {
      console.error('Error creating indexes for listings collection:', error.message);
      console.log('Continuing with setup...');
    }

    // Create images collection
    console.log('Creating images collection...');
    const imagesCollection = await databases.createCollection(
      databaseId,
      'images',
      'images',
      [
        sdk.Permission.read(sdk.Role.any()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users())
      ]
    );
    const imagesCollectionId = imagesCollection.$id;
    console.log(`Images collection created with ID: ${imagesCollectionId}`);


    console.log('Adding attributes to images collection...');
    const imageAttributes = [
      databases.createStringAttribute(databaseId, imagesCollectionId, 'listingId', 36, true),
      databases.createStringAttribute(databaseId, imagesCollectionId, 'fileId', 36, true),
      databases.createIntegerAttribute(databaseId, imagesCollectionId, 'order', false, 0)
    ];
    
    await Promise.all(imageAttributes);
    

    console.log('Waiting for attributes to be processed...');
    await wait(3000);
    
    console.log('Adding index to images collection...');
    try {
      await databases.createIndex(
        databaseId,
        imagesCollectionId,
        'listing_images',
        'key',
        ['listingId']
      );
      console.log('Index created for images collection');
    } catch (error) {
      console.error('Error creating index for images collection:', error.message);
      console.log('Continuing with setup...');
    }

    console.log('Creating chats collection...');
    const chatsCollection = await databases.createCollection(
      databaseId,
      'chats',
      'chats',
      [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users())
      ]
    );
    const chatsCollectionId = chatsCollection.$id;
    console.log(`Chats collection created with ID: ${chatsCollectionId}`);


    console.log('Adding attributes to chats collection...');
    
    const chatAttributes = [
      databases.createStringAttribute(databaseId, chatsCollectionId, 'listingId', 36, true),
      databases.createStringAttribute(databaseId, chatsCollectionId, 'sellerId', 36, true),
      databases.createStringAttribute(databaseId, chatsCollectionId, 'buyerId', 36, true),
      databases.createStringAttribute(databaseId, chatsCollectionId, 'listingTitle', 100, true),
      databases.createDatetimeAttribute(databaseId, chatsCollectionId, 'createdAt', true),
      databases.createDatetimeAttribute(databaseId, chatsCollectionId, 'updatedAt', true)
    ];
    
    await Promise.all(chatAttributes);
    
    console.log('Waiting for attributes to be processed...');
    await wait(3000);
    
    console.log('Adding indexes to chats collection...');
    try {
      const chatIndexes = [
        databases.createIndex(
          databaseId,
          chatsCollectionId,
          'seller_index',
          'key',
          ['sellerId']
        ),
        databases.createIndex(
          databaseId,
          chatsCollectionId,
          'buyer_index',
          'key',
          ['buyerId']
        ),
        databases.createIndex(
          databaseId,
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

    console.log('Creating messages collection...');
    const messagesCollection = await databases.createCollection(
      databaseId,
      'messages',
      'messages',
      [
        sdk.Permission.read(sdk.Role.users()),
        sdk.Permission.create(sdk.Role.users()),
        sdk.Permission.update(sdk.Role.users())
      ]
    );
    const messagesCollectionId = messagesCollection.$id;
    console.log(`Messages collection created with ID: ${messagesCollectionId}`);

    console.log('Adding attributes to messages collection...');
    
    const messageAttributes = [
      databases.createStringAttribute(databaseId, messagesCollectionId, 'chatId', 36, true),
      databases.createStringAttribute(databaseId, messagesCollectionId, 'senderId', 36, true),
      databases.createStringAttribute(databaseId, messagesCollectionId, 'content', 2000, true),
      databases.createDatetimeAttribute(databaseId, messagesCollectionId, 'createdAt', true),
      databases.createBooleanAttribute(databaseId, messagesCollectionId, 'isRead', false, false)
    ];
    
    await Promise.all(messageAttributes);
    
    console.log('Waiting for attributes to be processed...');
    await wait(3000);
    
    console.log('Adding index to messages collection...');
    try {
      await databases.createIndex(
        databaseId,
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

    console.log('Creating storage bucket for images...');
    try {
      const bucket = await storage.createBucket(
        'listing-images',
        'listing-images',
        [
          sdk.Permission.read(sdk.Role.any()),
          sdk.Permission.create(sdk.Role.users()),
          sdk.Permission.update(sdk.Role.users()),
          sdk.Permission.delete(sdk.Role.users())
        ],
        true
      );
      console.log(`Storage bucket created with ID: ${bucket.$id}`);
    } catch (error) {
      console.error('Error creating storage bucket:', error.message);
      console.log('Continuing with setup...');
    }
    
    const ids = {
      'DATABASE_ID': databaseId,
      'USERS_COLLECTION_ID': usersCollectionId,
      'LISTINGS_COLLECTION_ID': listingsCollectionId,
      'IMAGES_COLLECTION_ID': imagesCollectionId,
      'IMAGES_BUCKET_ID': 'listing-images',
      'CHATS_COLLECTION_ID': chatsCollectionId,
      'MESSAGES_COLLECTION_ID': messagesCollectionId
    };
    
    updateEnvFile(ids);
    
    console.log('\n✅ Appwrite setup completed successfully!');
    console.log('All necessary collections and attributes have been created');
    console.log('The .env file has been updated with the new IDs');
    
    rl.close();
  } catch (error) {
    console.error('Error during setup:', error);
    rl.close();
  }
}