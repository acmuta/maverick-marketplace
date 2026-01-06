import { Client, Databases, ID, Permission, Role, Query } from 'node-appwrite';

// Environment variables set in Appwrite Console
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const DATABASE_ID = process.env.DATABASE_ID;
const CHATS_COLLECTION_ID = process.env.CHATS_COLLECTION_ID;
const LISTINGS_COLLECTION_ID = process.env.LISTINGS_COLLECTION_ID;

export default async ({ req, res, log, error }) => {
    // Get the authenticated user ID from function context
    const user_id = req.headers['x-appwrite-user-id'];

    if (!user_id) {
        error('No authenticated user');
        return res.json({ success: false, error: 'Authentication required' }, 401);
    }

    // Parse request body
    let body;
    try {
        body = JSON.parse(req.body);
    } catch (e) {
        error('Invalid JSON body');
        return res.json({ success: false, error: 'Invalid request body' }, 400);
    }

    const { listing_id, seller_id } = body;

    if (!listing_id || !seller_id) {
        error('Missing required fields');
        return res.json({ success: false, error: 'listing_id and seller_id are required' }, 400);
    }

    // The buyer is the authenticated user making this request
    const buyer_id = user_id;

    // Prevent user from chatting with themselves
    if (buyer_id === seller_id) {
        return res.json({ success: false, error: 'Cannot start chat with yourself' }, 400);
    }

    log(`Creating chat: buyer=${buyer_id}, seller=${seller_id}, listing=${listing_id}`);

    // Initialize Appwrite client with API key (server-side)
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        // Verify the listing exists and seller matches
        const listing = await databases.getDocument(DATABASE_ID, LISTINGS_COLLECTION_ID, listing_id);

        if (listing.userId !== seller_id) {
            error(`Seller mismatch: expected ${listing.userId}, got ${seller_id}`);
            return res.json({ success: false, error: 'Invalid seller for this listing' }, 400);
        }

        // Check if chat already exists between these users for this listing
        const existing_chats = await databases.listDocuments(
            DATABASE_ID,
            CHATS_COLLECTION_ID,
            [
                Query.equal('listingId', listing_id),
                Query.equal('buyerId', buyer_id),
                Query.equal('sellerId', seller_id)
            ]
        );

        if (existing_chats.documents.length > 0) {
            log(`Chat already exists: ${existing_chats.documents[0].$id}`);
            return res.json({
                success: true,
                chat_id: existing_chats.documents[0].$id,
                existing: true
            });
        }

        // Create the chat with permissions for BOTH users
        const now = new Date().toISOString();
        const chat = await databases.createDocument(
            DATABASE_ID,
            CHATS_COLLECTION_ID,
            ID.unique(),
            {
                buyerId: buyer_id,
                sellerId: seller_id,
                listingId: listing_id,
                listingTitle: listing.title,
                createdAt: now,
                updatedAt: now
            },
            [
                // Both buyer and seller can read
                Permission.read(Role.user(buyer_id)),
                Permission.read(Role.user(seller_id)),
                // Both can update (for marking messages as read, etc.)
                Permission.update(Role.user(buyer_id)),
                Permission.update(Role.user(seller_id)),
                // Only buyer (chat initiator) can delete
                Permission.delete(Role.user(buyer_id))
            ]
        );

        log(`Chat created successfully: ${chat.$id}`);
        return res.json({
            success: true,
            chat_id: chat.$id,
            existing: false
        });

    } catch (e) {
        error(`Error creating chat: ${e.message}`);
        return res.json({ success: false, error: e.message }, 500);
    }
};
