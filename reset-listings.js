const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function deleteAllListings() {
    const databaseId = process.env.EXPO_PUBLIC_DATABASE_ID;
    const listingsCollectionId = process.env.EXPO_PUBLIC_LISTINGS_COLLECTION_ID;

    console.log('========================================');
    console.log('  DELETING ALL LISTINGS');
    console.log('========================================\n');

    try {
        // Fetch all listings
        let allDeleted = false;
        let totalDeleted = 0;

        while (!allDeleted) {
            const response = await databases.listDocuments(
                databaseId,
                listingsCollectionId,
                [sdk.Query.limit(100)] // Delete in batches of 100
            );

            if (response.documents.length === 0) {
                allDeleted = true;
                break;
            }

            console.log(`Found ${response.documents.length} listings to delete...`);

            // Delete each listing
            for (const listing of response.documents) {
                try {
                    await databases.deleteDocument(
                        databaseId,
                        listingsCollectionId,
                        listing.$id
                    );
                    totalDeleted++;
                    process.stdout.write(`\rDeleted ${totalDeleted} listings...`);
                } catch (error) {
                    console.error(`\nFailed to delete listing ${listing.$id}:`, error.message);
                }
            }
        }

        console.log('\n\n========================================');
        console.log('  ✓✓✓ SUCCESS! ✓✓✓');
        console.log('========================================');
        console.log(`\nDeleted ${totalDeleted} listings total`);
        console.log('\nNEXT STEPS:');
        console.log('1. In the app, tap your profile icon');
        console.log('2. Log out');
        console.log('3. Register a new account with your name');
        console.log('4. Create new listings\n');

    } catch (error) {
        console.error('\n========================================');
        console.error('  ❌ ERROR OCCURRED');
        console.error('========================================');
        console.error('\nFailed to delete listings:');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the deletion
deleteAllListings();
