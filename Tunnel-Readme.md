# Maverick Marketplace Developer Setup

This guide explains how to set up the Maverick Marketplace app for development, including tunneling for remote testing.

## 1. Basic Setup

```bash
# Clone the repository
git clone [your-repo-url]
cd maverick-marketplace

# Install dependencies
npm install

# Create .env file
```

## 2. Start Appwrite Backend

```bash
# Start Appwrite containers
cd appwrite
docker-compose up -d
cd ..

# Wait for Appwrite to initialize (about 30 seconds)
```

## 3. Set Up Remote Testing with Tunneling

### Option A: SSH Tunneling (Recommended)

```bash
# Start SSH tunnel (in a separate terminal)
ssh -R 80:localhost:80 serveo.net

# Note the URL generated (e.g., https://xyz123.serveo.net)
# Update your .env file:
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://xyz123.serveo.net/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace
EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true
EXPO_PUBLIC_APPWRITE_PUBLIC_URL=https://xyz123.serveo.net

# Start Expo (in another terminal)
npx expo start --tunnel
```

### Option B: LocalTunnel (Alternative)

```bash
# Install the script files from the repo
# Then run:
node localtunnel-appwrite.js
```

## 4. M1 Mac Specific Issues

If you're using an M1 Mac and encounter tunneling issues:

```bash
# Run the M1 fix script:
node m1-tunnel-fix.js

# Start the app with:
npm run start-m1-tunnel
```

If you encounter ngrok errors about authentication on M1 Macs, use the SSH tunneling method above.