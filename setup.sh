#!/bin/bash

echo "Setting up Maverick Marketplace for Unix/macOS..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "WARNING: Docker is not installed or not in PATH. You'll need Docker to run Appwrite."
    echo "You can continue setup, but Appwrite won't start until Docker is installed."
    sleep 5
fi

# Run the setup script
echo "Running setup script..."
node setup-dev.js

if [ $? -ne 0 ]; then
    echo "Setup failed. Please check the error messages above."
    exit 1
fi

echo
echo "Setup completed successfully!"
echo
echo "You can now:"
echo "  1. Start Appwrite if it's not already running with: npm run restart-appwrite"
echo "  2. Set up Appwrite collections with: npm run setup-appwrite"
echo "  3. Start the development server with: npm start"
echo
echo "Press any key to exit..."
read -n 1