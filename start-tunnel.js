
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set up environment variables
process.env.EXPO_ROUTER_APP_ROOT = './app';
process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
process.env.EXPO_NO_TUNNEL_DEV = 'false';

// Check if .env file exists and load it
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Force tunnel mode in .env
if (!process.env.EXPO_PUBLIC_APPWRITE_TUNNEL_MODE) {
  process.env.EXPO_PUBLIC_APPWRITE_TUNNEL_MODE = 'true';
}

// Start Expo with custom ngrok path
console.log('Starting Expo with tunnel...');
console.log('Note: The first connection may take longer than usual');

// Look for ngrok in node_modules
const possibleNgrokPaths = [
  path.join(__dirname, 'node_modules', '.bin', 'ngrok'),
  path.join(__dirname, 'node_modules', '@expo', 'ngrok', 'bin', 'ngrok')
];

let ngrokPath = '';
for (const path of possibleNgrokPaths) {
  if (fs.existsSync(path)) {
    ngrokPath = path;
    break;
  }
}

if (ngrokPath) {
  console.log('Using ngrok from: ' + ngrokPath);
  process.env.NGROK_PATH = ngrokPath;
}

// Start Expo with tunneling
const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
  stdio: 'inherit',
  env: process.env
});

expo.on('close', (code) => {
  console.log(`Expo process exited with code ${code}`);
});
