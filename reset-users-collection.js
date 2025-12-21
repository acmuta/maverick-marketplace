const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function resetUsersCollection() {
    const databaseId = process.env.EXPO_PUBLIC_DATABASE_ID;
    const collectionId = 'users';

    console.log('========================================');
    console.log('  RESETTING USERS COLLECTION');
    console.log('========================================\n');

    try {
        console.log('Step 1: Deleting existing Users collection...');
        await databases.deleteCollection(databaseId, collectionId);
        console.log('✓ Users collection deleted successfully');
        console.log('  (All user documents have been removed)');

        // Wait for deletion to complete
        await wait(2000);

        console.log('\nStep 2: Creating new Users collection...');
        const collection = await databases.createCollection(
            databaseId,
            collectionId,
            'Users',
            [
                sdk.Permission.read(sdk.Role.users()),
                sdk.Permission.create(sdk.Role.users()),
                sdk.Permission.update(sdk.Role.users())
            ]
        );
        console.log('✓ Users collection created');

        console.log('\nStep 3: Adding attributes (without userId field)...');
        const attributes = [
            databases.createStringAttribute(databaseId, collection.$id, 'displayName', 100, true),
            databases.createStringAttribute(databaseId, collection.$id, 'bio', 1000, false),
            databases.createStringAttribute(databaseId, collection.$id, 'avatarUrl', 255, false),
            databases.createStringAttribute(databaseId, collection.$id, 'contactEmail', 255, false),
            databases.createStringAttribute(databaseId, collection.$id, 'phoneNumber', 20, false),
            databases.createDatetimeAttribute(databaseId, collection.$id, 'createdAt', true)
        ];

        await Promise.all(attributes);
        console.log('✓ Attributes added:');
        console.log('  - displayName (string, required)');
        console.log('  - bio (string, optional)');
        console.log('  - avatarUrl (string, optional)');
        console.log('  - contactEmail (string, optional)');
        console.log('  - phoneNumber (string, optional)');
        console.log('  - createdAt (datetime, required)');

        // Wait for attributes to be processed
        await wait(2000);

        console.log('\n========================================');
        console.log('  ✓✓✓ SUCCESS! ✓✓✓');
        console.log('========================================');
        console.log('\nUsers collection has been reset successfully!');
        console.log('\nNEXT STEPS:');
        console.log('1. Application code has been updated to use account.$id as document ID');
        console.log('2. Test the registration flow');
        console.log('3. Verify profiles are created correctly');
        console.log('4. Test messaging and listing features\n');

    } catch (error) {
        console.error('\n========================================');
        console.error('  ❌ ERROR OCCURRED');
        console.error('========================================');
        console.error('\nFailed to reset Users collection:');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
        console.error('\nPlease check:');
        console.error('1. Your .env file has the correct credentials');
        console.error('2. APPWRITE_API_KEY has sufficient permissions');
        console.error('3. Database ID and collection ID are correct\n');
        process.exit(1);
    }
}

// Run the reset
resetUsersCollection();
