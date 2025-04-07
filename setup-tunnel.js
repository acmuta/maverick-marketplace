const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');
const readline = require('readline');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the local IP address (still needed for Appwrite docker setup)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Prioritize these network interfaces if they exist
  const priorityInterfaces = ['en0', 'eth0', 'wlan0', 'Wi-Fi', 'Ethernet'];
  
  // First try the priority interfaces
  for (const name of priorityInterfaces) {
    if (interfaces[name]) {
      const found = interfaces[name].find(
        (iface) => iface.family === 'IPv4' && !iface.internal
      );
      if (found) return found.address;
    }
  }
  
  // If priority interfaces not found, try all interfaces
  for (const name in interfaces) {
    const iface = interfaces[name];
    const found = iface.find(
      (iface) => iface.family === 'IPv4' && !iface.internal
    );
    if (found) return found.address;
  }
  
  // Fallback to localhost if no suitable interface found
  console.error('Could not determine local IP address, using localhost');
  return 'localhost';
}

// Update Appwrite .env file to allow all hosts
function updateAppwriteEnv(localIP) {
  const envPath = path.join(__dirname, 'appwrite', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('Appwrite .env file not found at:', envPath);
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update domain settings
  // We need to keep the local IP for Docker internal communication
  envContent = envContent.replace(/_APP_DOMAIN=.*/g, `_APP_DOMAIN=${localIP}:80`);
  envContent = envContent.replace(/_APP_DOMAIN_FUNCTIONS=.*/g, `_APP_DOMAIN_FUNCTIONS=functions.${localIP}`);
  envContent = envContent.replace(/_APP_DOMAIN_TARGET=.*/g, `_APP_DOMAIN_TARGET=${localIP}:80`);
  
  // Add/update settings to allow incoming connections from the tunnel
  if (envContent.includes('_APP_OPTIONS_FORCE_HTTPS')) {
    envContent = envContent.replace(/_APP_OPTIONS_FORCE_HTTPS=.*/g, '_APP_OPTIONS_FORCE_HTTPS=disabled');
  }
  
  // Ensure the router protection is disabled to allow connections from any domain
  if (envContent.includes('_APP_OPTIONS_ROUTER_PROTECTION')) {
    envContent = envContent.replace(/_APP_OPTIONS_ROUTER_PROTECTION=.*/g, '_APP_OPTIONS_ROUTER_PROTECTION=disabled');
  }
  
  // Set console whitelist settings to be permissive
  if (envContent.includes('_APP_CONSOLE_WHITELIST_ROOT')) {
    envContent = envContent.replace(/_APP_CONSOLE_WHITELIST_ROOT=.*/g, '_APP_CONSOLE_WHITELIST_ROOT=enabled');
  }
  
  // Make sure there's no CORS issues
  if (!envContent.includes('_APP_OPTIONS_CORS')) {
    envContent += '\n_APP_OPTIONS_CORS=enabled';
  } else {
    envContent = envContent.replace(/_APP_OPTIONS_CORS=.*/g, '_APP_OPTIONS_CORS=enabled');
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated Appwrite .env to work with tunnel`);
  return true;
}

// Update the app's .env file to use the local IP (tunnel will proxy to this)
function updateAppEnv(localIP) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  // For Expo tunnel to work properly, we need to:
  // 1. Point to the local Appwrite instance
  // 2. Ensure the client allows host header from tunnel URLs
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Update existing APPWRITE_ENDPOINT
    envContent = envContent.replace(/EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g, `EXPO_PUBLIC_APPWRITE_ENDPOINT=http://${localIP}/v1`);
    
    // Make sure we have a project ID
    if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PROJECT_ID')) {
      envContent += `\nEXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858`;
    }
    
    // Make sure we have a platform
    if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PLATFORM')) {
      envContent += `\nEXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace`;
    }
    
    // Add tunnel-specific setting
    if (!envContent.includes('EXPO_PUBLIC_APPWRITE_TUNNEL_MODE')) {
      envContent += `\nEXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true`;
    } else {
      envContent = envContent.replace(/EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=.*/g, `EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true`);
    }
  } else {
    // Create new .env file with necessary variables
    envContent = `EXPO_PUBLIC_APPWRITE_ENDPOINT=http://${localIP}/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace
EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true
`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated app .env with endpoint: http://${localIP}/v1 and enabled tunnel mode`);
  return true;
}

// Function to restart Appwrite
function restartAppwrite() {
  console.log('Restarting Appwrite...');
  try {
    execSync('cd appwrite && docker-compose down && docker-compose up -d', { stdio: 'inherit' });
    console.log('Appwrite restarted successfully');
    return true;
  } catch (error) {
    console.error('Failed to restart Appwrite:', error.message);
    return false;
  }
}

// Function to run a command and return its output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Check if Expo is installed and install if needed
function checkExpoCliInstalled() {
  try {
    execSync('npx expo --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('Expo CLI not found, installing...');
    try {
      execSync('npm install -g expo-cli', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.error('Failed to install Expo CLI:', installError.message);
      return false;
    }
  }
}

// Function to check forwarded ports using localtunnel
function setupExpoTunnel() {
  console.log('\n=== SETTING UP EXPO TUNNEL ===');
  console.log('This will start Expo with tunneling enabled.');
  console.log('A public URL will be generated that can be accessed from any device with internet.');
  console.log('Note: The first time you run this, you may need to authenticate with Expo.');
  
  // Now start Expo with tunneling
  console.log('\nStarting Expo with tunneling...');
  console.log('When the QR code appears, anyone can scan it to access your app from any network.');
  console.log('Press Ctrl+C to stop the server when done.\n');
  
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  
  const expo = spawn('npx', ['expo', 'start', '--tunnel'], { 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  expo.on('close', (code) => {
    console.log(`Expo tunnel process exited with code ${code}`);
    rl.close();
  });
}

// Main function
async function main() {
  console.log('=== MAVERICK MARKETPLACE TUNNEL SETUP ===');
  
  // Check if required tools are installed
  const expoInstalled = checkExpoCliInstalled();
  if (!expoInstalled) {
    console.error('Expo CLI is required for tunneling. Please install it and try again.');
    rl.close();
    return;
  }
  
  // Get local IP for Appwrite configuration
  const localIP = getLocalIP();
  console.log(`Detected local IP: ${localIP}`);
  
  // Update configuration files
  const appwriteUpdated = updateAppwriteEnv(localIP);
  const appEnvUpdated = updateAppEnv(localIP);
  
  if (!appwriteUpdated || !appEnvUpdated) {
    console.error('Failed to update configuration files');
    rl.close();
    return;
  }
  
  console.log('\nConfiguration files updated successfully');
  
  // Restart Appwrite and set up tunneling
  rl.question('Do you want to restart Appwrite and start the Expo tunnel? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      if (restartAppwrite()) {
        console.log('Waiting for Appwrite to initialize...');
        // Wait for Appwrite to be ready
        setTimeout(() => {
          setupExpoTunnel();
        }, 20000); // 20 seconds wait
      } else {
        console.error('Failed to restart Appwrite. Please restart it manually.');
        rl.close();
      }
    } else {
      console.log('\nSetup completed. To manually start the services:');
      console.log('1. Restart Appwrite: cd appwrite && docker-compose down && docker-compose up -d');
      console.log('2. Start Expo tunnel: npm run tunnel');
      rl.close();
    }
  });
}

// Run the script
main();