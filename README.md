# Maverick Marketplace

A campus marketplace app built with React Native + Expo and integrated with Appwrite for backend services.

## Cross-Platform Environment Setup

This project is configured to work consistently across different development environments (Windows, macOS, Linux) by using centralized environment variables.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/maverick-marketplace.git
   cd maverick-marketplace
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup your development environment**

   We've created a setup script that will configure your environment for you:

   ```bash
   # For Mac/Linux:
   npm run setup

   # For Windows:
   npm run win-setup
   ```

   This script will:
   - Detect your local IP address
   - Create a `.env` file with your local configuration
   - Update the Appwrite configuration to work with your IP
   - Ask if you want to start Appwrite using Docker

4. **Set up Appwrite backend**

   After the development setup is complete, you need to configure the Appwrite collections:

   ```bash
   npm run setup-appwrite
   ```

   This script will:
   - Create all necessary collections in Appwrite
   - Set up proper attributes and indexes
   - Create the storage bucket for listing images
   - Update your `.env` file with all the generated IDs

5. **Start the development server**

   ```bash
   # For Mac/Linux:
   npm start
   
   # For Windows:
   npm run win-start
   ```

   To run on a local network (for testing on physical devices):

   ```bash
   # For Mac/Linux:
   npm run network
   
   # For Windows:
   npm run win-network
   ```

## Environment Configuration

The app uses a `.env` file to store all configuration. The setup script creates this for you, but you can modify it if needed:

```
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=http://your-ip-address/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace

# Appwrite Collection/Database IDs 
EXPO_PUBLIC_DATABASE_ID=your-database-id
EXPO_PUBLIC_USERS_COLLECTION_ID=users
EXPO_PUBLIC_LISTINGS_COLLECTION_ID=listings
EXPO_PUBLIC_IMAGES_COLLECTION_ID=images
EXPO_PUBLIC_IMAGES_BUCKET_ID=listing-images
EXPO_PUBLIC_CHATS_COLLECTION_ID=your-chats-collection-id
EXPO_PUBLIC_MESSAGES_COLLECTION_ID=your-messages-collection-id
```

## Testing on Physical Devices

To test on physical devices in the same network:

1. Run the network script:
   ```bash
   # For Mac/Linux:
   npm run network
   
   # For Windows:
   npm run win-network
   ```

2. Scan the QR code with your device's camera or Expo Go app.

## Tunneling (Remote Testing)

For testing from outside your local network:

```bash
# For Mac/Linux:
npm run tunnel

# For Windows:
npm run win-tunnel
```

## Managing Appwrite

To restart Appwrite after configuration changes:

```bash
npm run restart-appwrite
```

## Project Structure

- `app/`: The Expo Router application code
- `appwrite/`: Appwrite configuration and Docker setup
- `setup-*.js`: Setup scripts for development environment

## Troubleshooting

### IP Address Issues

If you change networks or IP addresses, run the setup script again:

```bash
npm run setup
```

### Appwrite Connection Problems

If you're having trouble connecting to Appwrite, make sure:

1. Docker is running
2. Appwrite containers are running
3. Your IP address is correctly set in both `.env` files
4. You've updated your environment with the correct collection IDs

To check Appwrite status:

```bash
docker ps | grep appwrite
```

To restart Appwrite:

```bash
npm run restart-appwrite
```