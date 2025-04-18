/**
 * Global Tunneling Script for Maverick Marketplace
 * This script creates a public URL for your app accessible from anywhere
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (err) {
    return false;
  }
}

// Install required packages if needed
async function installRequiredPackages() {
  const packages = ['ngrok', 'dotenv'];
  const missingPackages = packages.filter(pkg => !isPackageInstalled(pkg));
  
  if (missingPackages.length > 0) {
    console.log(`Installing required packages: ${missingPackages.join(', ')}...`);
    try {
      execSync(`npm install --save-dev ${missingPackages.join(' ')}`, { stdio: 'inherit' });
      console.log('✅ Packages installed successfully');
    } catch (err) {
      console.error('Failed to install packages:', err.message);
      return false;
    }
  }
  
  return true;
}

// Update .env file with ngrok URL
function updateEnvWithNgrokUrl(ngrokUrl) {
  const envPath = path.join(__dirname, '.env');
  
  // Load existing .env file or create a new one
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add the tunneling variables
  if (envContent.includes('EXPO_PUBLIC_APPWRITE_ENDPOINT=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g,
      `EXPO_PUBLIC_APPWRITE_ENDPOINT=${ngrokUrl}/v1`
    );
  } else {
    envContent += `\nEXPO_PUBLIC_APPWRITE_ENDPOINT=${ngrokUrl}/v1`;
  }
  
  // Add tunnel mode flags
  if (envContent.includes('EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=.*/g,
      'EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true'
    );
  } else {
    envContent += '\nEXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true';
  }
  
  // Set public URL for handling images
  if (envContent.includes('EXPO_PUBLIC_APPWRITE_PUBLIC_URL=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_APPWRITE_PUBLIC_URL=.*/g,
      `EXPO_PUBLIC_APPWRITE_PUBLIC_URL=${ngrokUrl}`
    );
  } else {
    envContent += `\nEXPO_PUBLIC_APPWRITE_PUBLIC_URL=${ngrokUrl}`;
  }
  
  // Add proper Expo Router configuration
  if (!envContent.includes('EXPO_ROUTER_APP_ROOT=')) {
    envContent += '\nEXPO_ROUTER_APP_ROOT=./app';
  }
  
  if (!envContent.includes('EXPO_ROUTER_IMPORT_MODE=')) {
    envContent += '\nEXPO_ROUTER_IMPORT_MODE=sync';
  }
  
  // Write the updated content
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file with tunnel URL: ${ngrokUrl}`);
}

// Update Appwrite .env file to accept external connections
function updateAppwriteEnv() {
  const appwriteEnvPath = path.join(__dirname, 'appwrite', '.env');
  
  if (!fs.existsSync(appwriteEnvPath)) {
    console.error('❌ Appwrite .env file not found. Please make sure Appwrite is set up correctly.');
    return false;
  }
  
  let appwriteEnvContent = fs.readFileSync(appwriteEnvPath, 'utf8');
  
  // Disable router protection to allow tunneling
  if (appwriteEnvContent.includes('_APP_OPTIONS_ROUTER_PROTECTION=')) {
    appwriteEnvContent = appwriteEnvContent.replace(
      /_APP_OPTIONS_ROUTER_PROTECTION=.*/g,
      '_APP_OPTIONS_ROUTER_PROTECTION=disabled'
    );
  } else {
    appwriteEnvContent += '\n_APP_OPTIONS_ROUTER_PROTECTION=disabled';
  }
  
  // Make sure CORS is enabled
  if (appwriteEnvContent.includes('_APP_OPTIONS_CORS=')) {
    appwriteEnvContent = appwriteEnvContent.replace(
      /_APP_OPTIONS_CORS=.*/g,
      '_APP_OPTIONS_CORS=enabled'
    );
  } else {
    appwriteEnvContent += '\n_APP_OPTIONS_CORS=enabled';
  }
  
  // Disable HTTPS forcing (for development)
  if (appwriteEnvContent.includes('_APP_OPTIONS_FORCE_HTTPS=')) {
    appwriteEnvContent = appwriteEnvContent.replace(
      /_APP_OPTIONS_FORCE_HTTPS=.*/g,
      '_APP_OPTIONS_FORCE_HTTPS=disabled'
    );
  }
  
  fs.writeFileSync(appwriteEnvPath, appwriteEnvContent);
  console.log('✅ Updated Appwrite .env to allow external connections');
  return true;
}

// Restart Appwrite with the new configuration
function restartAppwrite() {
  console.log('Restarting Appwrite with new configuration...');
  try {
    execSync('cd appwrite && docker-compose down && docker-compose up -d', { stdio: 'inherit' });
    console.log('✅ Appwrite restarted successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to restart Appwrite:', err.message);
    return false;
  }
}

// Create a global tunnel with ngrok
async function createNgrokTunnel() {
  try {
    console.log('Starting ngrok tunnel for Appwrite (port 80)...');
    
    // Use dynamic import for ngrok
    const ngrok = require('ngrok');
    
    // Start the tunnel
    const url = await ngrok.connect({
      addr: 80,
      // You might need to add your ngrok auth token here if you want a more stable URL
      // authtoken: 'your-ngrok-auth-token',
    });
    
    console.log(`✅ Global tunnel created successfully: ${url}`);
    return url;
  } catch (err) {
    console.error('❌ Failed to create ngrok tunnel:', err.message);
    console.log('Try running: npm install ngrok@latest');
    return null;
  }
}

// Check if Appwrite is running
function isAppwriteRunning() {
  try {
    const result = execSync('docker ps | grep appwrite', { encoding: 'utf8' });
    return result.includes('appwrite');
  } catch (err) {
    return false;
  }
}

// Start Expo in tunnel mode
function startExpoTunnel() {
  console.log('\n🚀 Starting Expo with global tunneling...');
  console.log('When the QR code appears, anyone can scan it to access your app from any network.');
  
  // Set required environment variables
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  
  // Start Expo with global tunnel
  const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });
  
  // Handle process exit
  expo.on('close', (code) => {
    console.log(`\nExpo process exited with code ${code}`);
    process.exit();
  });
}

// Main function
async function main() {
  console.log('🌐 Setting up global access for Maverick Marketplace 🌐');
  console.log('--------------------------------------------------');
  
  // First, install required packages
  const packagesInstalled = await installRequiredPackages();
  if (!packagesInstalled) {
    console.error('❌ Failed to install required packages. Exiting...');
    rl.close();
    return;
  }
  
  // Update Appwrite config to allow external connections
  updateAppwriteEnv();
  
  // Check if Appwrite is running
  if (!isAppwriteRunning()) {
    console.log('❌ Appwrite is not running.');
    rl.question('Do you want to start Appwrite now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        restartAppwrite();
        console.log('Waiting for Appwrite to initialize...');
        setTimeout(continueSetup, 15000); // Wait 15 seconds for Appwrite to start
      } else {
        console.log('Please start Appwrite first, then run this script again.');
        rl.close();
      }
    });
  } else {
    // If Appwrite is running, ask to restart with new configuration
    rl.question('Appwrite is already running. Restart with new configuration? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        restartAppwrite();
        console.log('Waiting for Appwrite to initialize...');
        setTimeout(continueSetup, 15000); // Wait 15 seconds for Appwrite to restart
      } else {
        continueSetup();
      }
    });
  }
}

// Continue setup after Appwrite is ready
async function continueSetup() {
  try {
    // Create global tunnel with ngrok
    const ngrokUrl = await createNgrokTunnel();
    if (!ngrokUrl) {
      console.error('❌ Failed to create tunnel. Exiting...');
      rl.close();
      return;
    }
    
    // Update .env file with ngrok URL
    updateEnvWithNgrokUrl(ngrokUrl);
    
    console.log('\n🔗 Global Access Information:');
    console.log('---------------------------');
    console.log(`Appwrite is now accessible at: ${ngrokUrl}`);
    console.log('This URL will work from any network or device.');
    console.log('\nIMPORTANT: This URL will change each time you run this script.');
    console.log('For a persistent URL, you can sign up for a free ngrok account');
    console.log('and add your auth token to this script.\n');
    
    // Start Expo
    rl.question('Start Expo with global tunnel access? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        startExpoTunnel();
      } else {
        console.log('\nYou can start Expo later with: npm run tunnel');
        console.log('The global access URL will be valid until you stop the ngrok process.');
        rl.close();
      }
    });
  } catch (err) {
    console.error('❌ An error occurred during setup:', err.message);
    rl.close();
  }
}

// Run the main function
main();