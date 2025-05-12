# Maverick Marketplace

A campus marketplace app built with React Native + Expo and integrated with Appwrite Cloud for backend services.

## Backend: Appwrite Cloud & GitHub Student Developer Pack

This project uses Appwrite Cloud for its backend. Students can often get free credits or a Pro plan trial for Appwrite through the [GitHub Student Developer Pack](https://education.github.com/pack).

### Availing the Appwrite Offer via GitHub Student Pack:

1.  **Get the GitHub Student Developer Pack:** If you haven't already, sign up at [education.github.com/pack](https://education.github.com/pack).
2.  **Find Appwrite:** Once approved, look for Appwrite in the list of offers.
3.  **Redeem the Offer:** Follow the instructions to redeem the Appwrite offer. This usually involves signing up for an Appwrite Cloud account or applying a promo code.
4.  **You will get access to Appwrite's Pro Plan** for a limited time or with certain usage credits, which is excellent for developing and testing this project.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/maverick-marketplace.git](https://github.com/yourusername/maverick-marketplace.git)
    cd maverick-marketplace
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    If you encounter peer dependency issues, you might need to run:
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Set up Appwrite Cloud Project:**
    * Go to [cloud.appwrite.io](https://cloud.appwrite.io/) and log in or create your account.
    * Create a new Project. Give it a name like "Maverick Marketplace".
    * Note your **Project ID** and the **API Endpoint URL** (e.g., `https://nyc.cloud.appwrite.io/v1` or similar, depending on the region you choose).

4.  **Create an API Key for Setup:**
    * In your Appwrite Cloud project, go to "API keys" in the left sidebar.
    * Click "Create API key".
    * Give it a name (e.g., "Admin Setup Key").
    * Grant it the following scopes:
        * `databases.read`
        * `databases.write`
        * `collections.read`
        * `collections.write`
        * `attributes.read`
        * `attributes.write`
        * `indexes.read`
        * `indexes.write`
        * `documents.read`
        * `documents.write`
        * `files.read`
        * `files.write`
        * `buckets.read`
        * `buckets.write`
    * Click "Create". Copy the **API Key Secret** immediately and store it securely. You won't be able to see it again.

5.  **Configure Environment Variables (`.env` file):**
    Create a `.env` file in the root of the `maverick-marketplace` project with the following content, replacing placeholders with your actual Appwrite Cloud details:

    ```env
    # Appwrite Cloud Configuration
    EXPO_PUBLIC_APPWRITE_ENDPOINT=YOUR_APPWRITE_CLOUD_ENDPOINT_URL # e.g., [https://nyc.cloud.appwrite.io/v1](https://nyc.cloud.appwrite.io/v1)
    EXPO_PUBLIC_APPWRITE_PROJECT_ID=YOUR_APPWRITE_CLOUD_PROJECT_ID
    EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace # Or your app's bundle ID / package name

    # API Key for setup script (this is NOT bundled with the app)
    APPWRITE_PROJECT_ID=YOUR_APPWRITE_CLOUD_PROJECT_ID # Same as above
    APPWRITE_API_KEY=YOUR_GENERATED_API_KEY_SECRET

    # These will be filled by the setup script
    EXPO_PUBLIC_DATABASE_ID=
    EXPO_PUBLIC_USERS_COLLECTION_ID=
    EXPO_PUBLIC_LISTINGS_COLLECTION_ID=
    EXPO_PUBLIC_IMAGES_COLLECTION_ID=
    EXPO_PUBLIC_IMAGES_BUCKET_ID=
    EXPO_PUBLIC_CHATS_COLLECTION_ID=
    EXPO_PUBLIC_MESSAGES_COLLECTION_ID=

    # Expo Router Configuration
    EXPO_ROUTER_APP_ROOT=./app
    EXPO_ROUTER_IMPORT_MODE=sync

    # Tunneling (optional, for development with physical devices not on local network)
    EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=false
    EXPO_PUBLIC_APPWRITE_PUBLIC_URL=
    ```

6.  **Run the Cloud Setup Script:**
    This script will connect to your Appwrite Cloud project and create the necessary database, collections, attributes, indexes, and storage bucket.
    ```bash
    node cloud-setup.js
    ```
    The script will use the `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` from your `.env` file to perform these actions. After completion, it will output the IDs for the created resources and update your `.env` file with them (e.g., `EXPO_PUBLIC_DATABASE_ID`, `EXPO_PUBLIC_LISTINGS_COLLECTION_ID`, etc.).

7.  **Register your App Platform:**
    * In your Appwrite Cloud project console, go to your "Users" collection (or any collection).
    * Navigate to the "Settings" tab of the collection.
    * Click "Add Platform".
    * Choose "Flutter" (even for React Native, this often works best for client-side SDKs if a specific RN one isn't listed prominently, or choose "Apple App" / "Android App" as appropriate).
    * **For iOS:** Enter your app's Bundle ID (e.g., `com.company.MaverickMarketPlace` as per your `.env`).
    * **For Android:** Enter your app's Package Name (e.g., `com.company.MaverickMarketPlace`).
    * **For Web:** Enter your app's hostname if you plan to deploy to web (e.g., `localhost` for development). You might need to add multiple platforms if you're developing for iOS, Android, and Web.

8.  **Start the development server:**
    ```bash
    npx expo start --clear
    ```
    Scan the QR code with the Expo Go app on your iOS or Android device, or open in a web browser/simulator.

## Environment Variables Overview

Your `.env` file is crucial. Here's a breakdown:

* `EXPO_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite Cloud project's API endpoint.
* `EXPO_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite Cloud project ID.
* `EXPO_PUBLIC_APPWRITE_PLATFORM`: Your app's bundle ID (iOS) or package name (Android). This is used by Appwrite to identify your client application.
* `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`: Used *only* by the `cloud-setup.js` script for administrative tasks. **The API Key should be kept secret and is not bundled into your app.**
* `EXPO_PUBLIC_DATABASE_ID`, `EXPO_PUBLIC_USERS_COLLECTION_ID`, etc.: These are automatically populated by the `cloud-setup.js` script and are used by your app to interact with the correct Appwrite resources.
* `EXPO_ROUTER_APP_ROOT`, `EXPO_ROUTER_IMPORT_MODE`: Configuration for Expo Router.
* `EXPO_PUBLIC_APPWRITE_TUNNEL_MODE`, `EXPO_PUBLIC_APPWRITE_PUBLIC_URL`: Optional, for advanced tunneling setups if direct local network access or Expo's default tunnel isn't suitable for Appwrite communication.

## Project Structure

* `app/`: Contains all the Expo Router application code (screens, components, layouts).
* `appwrite/config.ts`: Configures the Appwrite client SDK for your application using environment variables.
* `cloud-setup.js`: Script to provision your Appwrite Cloud database, collections, and storage.
* `.env`: Stores your project-specific environment variables (ignored by Git).

## Troubleshooting

* **"Invalid document structure" / "Unknown attribute" errors:**
    * Ensure the `cloud-setup.js` script completed successfully.
    * Verify that the Collection IDs in your `.env` file are correct and match those in your Appwrite Cloud console.
    * Check the "Attributes" tab for the relevant collection in your Appwrite console to ensure all expected attributes exist and have the correct types and keys (case-sensitive).
* **Network Errors / Failed to fetch:**
    * Double-check `EXPO_PUBLIC_APPWRITE_ENDPOINT` and `EXPO_PUBLIC_APPWRITE_PROJECT_ID` in your `.env`.
    * Ensure you have added your app's platform (iOS Bundle ID, Android Package Name) in the Appwrite project settings.
    * If using a physical device, ensure it's on the same network as your development machine if you're trying to connect to a local Appwrite instance (though this guide focuses on Cloud). For Cloud, ensure your device has internet access.
* **Permission Denied errors from Appwrite:**
    * When creating the API Key for `cloud-setup.js`, ensure all required scopes were granted.
    * For your collections, verify their general read/write permissions and document-level permissions if applicable. The `cloud-setup.js` script sets up basic permissions (e.g., any user can read listings, only authenticated users can create).