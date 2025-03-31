const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Get the local IP address that can be accessed by other devices on the network
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

// Update Appwrite .env file with the correct IP
function updateAppwriteEnv(localIP) {
  const envPath = path.join(__dirname, 'appwrite', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('Appwrite .env file not found at:', envPath);
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update domain settings
  envContent = envContent.replace(/_APP_DOMAIN=.*/g, `_APP_DOMAIN=${localIP}:80`);
  envContent = envContent.replace(/_APP_DOMAIN_FUNCTIONS=.*/g, `_APP_DOMAIN_FUNCTIONS=functions.${localIP}`);
  envContent = envContent.replace(/_APP_DOMAIN_TARGET=.*/g, `_APP_DOMAIN_TARGET=${localIP}:80`);
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated Appwrite .env with IP: ${localIP}`);
  return true;
}

// Update the app's .env file with the correct IP
function updateAppEnv(localIP) {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Update existing APPWRITE_ENDPOINT
    envContent = envContent.replace(/EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g, `EXPO_PUBLIC_APPWRITE_ENDPOINT=http://${localIP}/v1`);
  } else {
    // Create new .env file with necessary variables
    envContent = `EXPO_PUBLIC_APPWRITE_ENDPOINT=http://${localIP}/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace
`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated app .env with IP: ${localIP}`);
  return true;
}

// Restart Appwrite with the new configuration
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

// Start the Expo development server
function startExpo() {
  console.log('Starting Expo server...');
  try {
    // Use spawn to keep the process running
    const { spawn } = require('child_process');
    
    // Use 'npm run start-network' instead of direct expo command
    // This ensures we use the script defined in package.json
    const expo = spawn('npm', ['run', 'start-network'], { 
      stdio: 'inherit'
    });
    
    // Handle process exit
    expo.on('close', (code) => {
      console.log(`Expo process exited with code ${code}`);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to start Expo:', error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Setting up Maverick Marketplace for network access...');
  
  // Get local IP
  const localIP = getLocalIP();
  console.log(`Detected local IP: ${localIP}`);
  
  // Update configuration files
  const appwriteUpdated = updateAppwriteEnv(localIP);
  const appEnvUpdated = updateAppEnv(localIP);
  
  if (appwriteUpdated && appEnvUpdated) {
    console.log('Configuration files updated successfully');
    
    // Ask user if they want to restart services
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Do you want to restart Appwrite and start Expo? (y/n): ', (answer) => {
      readline.close();
      if (answer.toLowerCase() === 'y') {
        if (restartAppwrite()) {
          console.log('Waiting for Appwrite to initialize...');
          // Wait 20 seconds for Appwrite to initialize
          setTimeout(() => {
            startExpo();
          }, 20000);
        }
      } else {
        console.log('Configuration updated. Please restart services manually:');
        console.log('1. Restart Appwrite: cd appwrite && docker-compose down && docker-compose up -d');
        console.log('2. Start Expo: npx expo start --host');
      }
    });
  } else {
    console.error('Failed to update configuration files');
  }
}

// Run the script
main();