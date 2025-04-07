/**
 * This script sets up a complete tunnel solution for your Maverick Marketplace app
 * using localtunnel (no account required)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up LocalTunnel for Appwrite + Expo 🚀');
console.log('------------------------------------------------');
console.log('This will:');
console.log('1. Make your local Appwrite available on the internet');
console.log('2. Configure your app to use the public Appwrite URL');
console.log('3. Start Expo with tunneling for complete mobile testing\n');

// Step 1: Install localtunnel if it's not already installed
console.log('Checking if localtunnel is installed...');
try {
  execSync('npx localtunnel --version', { stdio: 'ignore' });
  console.log('✅ localtunnel is already installed\n');
} catch (error) {
  console.log('Installing localtunnel...');
  try {
    execSync('npm install -g localtunnel', { stdio: 'inherit' });
    console.log('✅ localtunnel installed successfully\n');
  } catch (installError) {
    console.error('Failed to install globally, installing locally...');
    execSync('npm install localtunnel', { stdio: 'inherit' });
    console.log('✅ localtunnel installed locally\n');
  }
}

// Step 2: Check if Appwrite is running
console.log('Checking if Appwrite is running...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost/v1/health', { encoding: 'utf8' });
  if (response.trim() === '200' || response.trim() === '401') {
    console.log('✅ Appwrite is running\n');
  } else {
    console.warn('⚠️  Appwrite may not be running properly (status code: ' + response.trim() + ')');
    console.warn('   Please make sure Appwrite is running before proceeding.\n');
  }
} catch (error) {
  console.error('❌ Could not connect to Appwrite. Make sure it\'s running on port 80.');
  console.error('   You can start it with: cd appwrite && docker-compose up -d\n');
}

// Step 3: Start localtunnel for Appwrite
console.log('Starting localtunnel for Appwrite (port 80)...');

// Function to update .env file with tunnel URL
const updateEnvFile = (tunnelUrl) => {
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update Appwrite endpoint
    if (envContent.includes('EXPO_PUBLIC_APPWRITE_ENDPOINT=')) {
      envContent = envContent.replace(
        /EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g, 
        `EXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1`
      );
    } else {
      envContent += `\nEXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1`;
    }
    
    // Ensure project ID is set
    if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PROJECT_ID=')) {
      envContent += '\nEXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858';
    }
    
    // Ensure platform is set
    if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PLATFORM=')) {
      envContent += '\nEXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace';
    }
    
    // Enable tunnel mode
    if (envContent.includes('EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=')) {
      envContent = envContent.replace(
        /EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=.*/g,
        'EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true'
      );
    } else {
      envContent += '\nEXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true';
    }
    
    // Add public URL for image handling
    if (envContent.includes('EXPO_PUBLIC_APPWRITE_PUBLIC_URL=')) {
      envContent = envContent.replace(
        /EXPO_PUBLIC_APPWRITE_PUBLIC_URL=.*/g,
        `EXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}`
      );
    } else {
      envContent += `\nEXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}`;
    }
  } else {
    // Create new .env file with all required variables
    envContent = `EXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace
EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true
EXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}
`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file with tunnel URL: ${tunnelUrl}/v1\n`);
  return true;
};

// Function to start Expo with tunneling
const startExpoTunnel = () => {
  console.log('🔄 Starting Expo tunnel...');
  console.log('📱 When the QR code appears, scan it with your device\'s camera.');
  console.log('📌 This will open your app with full connectivity to your Appwrite backend.\n');
  
  // Set required environment variables
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  
  // Start Expo with tunnel option
  const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  // Handle Expo process exit
  expo.on('close', (code) => {
    console.log(`\nExpo process exited with code ${code}`);
    console.log('Cleaning up...');
    // The localtunnel process will be terminated when the parent process exits
    process.exit();
  });
};

// Get a random subdomain to avoid conflicts
const getRandomSubdomain = () => {
  const prefix = 'maverick';
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${randomString}`;
};

// Create a specific subdomain to make the URL more recognizable
const subdomain = getRandomSubdomain();

// Start localtunnel with the specific subdomain
const lt = spawn('npx', ['localtunnel', '--port', '80', '--subdomain', subdomain], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

// Process localtunnel output to extract the URL
let tunnelUrl = null;
lt.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('your url is:')) {
    const match = output.match(/(https:\/\/[a-zA-Z0-9.-]+\.loca\.lt)/);
    if (match && match[1]) {
      tunnelUrl = match[1];
      console.log(`\n✅ Appwrite tunnel URL: ${tunnelUrl}`);
      
      // Update the .env file with the new tunnel URL
      updateEnvFile(tunnelUrl);
      
      // Start Expo with tunneling
      startExpoTunnel();
    }
  }
});

// Handle errors
lt.on('error', (error) => {
  console.error('LocalTunnel error:', error.message);
  process.exit(1);
});

// Handle unexpected exit
lt.on('close', (code) => {
  if (!tunnelUrl) {
    console.error(`LocalTunnel process exited with code ${code} before providing a URL`);
    console.log('Please try running the script again.');
    process.exit(1);
  }
});

// Handle script termination (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\nShutting down tunnels...');
  process.exit();
});