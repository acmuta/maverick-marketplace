/**
 * Global Tunneling Script for Maverick Marketplace - M1 Mac Version
 * This script creates a public URL for your app accessible from anywhere
 * Special version for M1 Macs that works around common ngrok issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a yes/no question
function askYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run a command and return the result
async function runCommand(command) {
  try {
    const { stdout, stderr } = await exec(command);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error };
  }
}

// Upgrade ngrok config if needed
async function upgradeNgrokConfig() {
  console.log('Attempting to upgrade ngrok configuration...');
  
  // Check if ngrok is installed globally
  const ngrokGlobalCheck = await runCommand('which ngrok || echo "not found"');
  
  if (ngrokGlobalCheck.stdout.trim() !== 'not found') {
    // Ngrok is installed globally, try to upgrade the config
    try {
      execSync('ngrok config upgrade', { stdio: 'inherit' });
      console.log('✅ Ngrok configuration upgraded successfully');
      return true;
    } catch (err) {
      console.log('❌ Unable to upgrade ngrok config automatically');
    }
  }
  
  // Try to fix the config file directly
  const homeDir = require('os').homedir();
  const configPath = path.join(homeDir, '.ngrok2', 'ngrok.yml');
  
  if (fs.existsSync(configPath)) {
    console.log('Found ngrok config file, attempting to fix...');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Add version if it doesn't exist
    if (!configContent.includes('version:')) {
      configContent = 'version: 2\n' + configContent;
      fs.writeFileSync(configPath, configContent);
      console.log('✅ Added version to ngrok config file');
      return true;
    }
  } else {
    // Create a minimal config file
    try {
      if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }
      fs.writeFileSync(configPath, 'version: 2\n');
      console.log('✅ Created new ngrok config file');
      return true;
    } catch (err) {
      console.log('❌ Unable to create ngrok config file', err.message);
    }
  }
  
  return false;
}

// Install or reinstall ngrok
async function installOrReinstallNgrok() {
  console.log('Installing/reinstalling ngrok...');
  
  try {
    // Remove ngrok first if it exists
    try {
      execSync('npm uninstall -g ngrok', { stdio: 'ignore' });
      execSync('npm uninstall ngrok', { stdio: 'ignore' });
    } catch (err) {
      // Ignore errors from uninstall
    }
    
    // Install ngrok locally
    execSync('npm install --save-dev ngrok@latest', { stdio: 'inherit' });
    console.log('✅ Ngrok installed successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to install ngrok:', err.message);
    return false;
  }
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
async function restartAppwrite() {
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

// Start Expo in tunnel mode
function startExpoTunnel() {
  console.log('\n🚀 Starting Expo with global tunneling...');
  console.log('When the QR code appears, anyone can scan it to access your app from any network.');
  
  // Set required environment variables
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  
  // On M1 Mac, we use a slightly different approach for tunneling
  const expoProcess = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });
  
  // Handle process exit
  expoProcess.on('close', (code) => {
    console.log(`\nExpo process exited with code ${code}`);
    process.exit();
  });
}

// Create a tunnel for Appwrite using localtunnel (alternative to ngrok)
async function createLocalTunnel() {
  console.log('Starting localtunnel for Appwrite (port 80)...');
  
  try {
    // Check if localtunnel is installed
    try {
      require.resolve('localtunnel');
    } catch (err) {
      console.log('Installing localtunnel...');
      execSync('npm install --save-dev localtunnel', { stdio: 'inherit' });
    }
    
    // Use localtunnel
    const lt = require('localtunnel');
    const tunnel = await lt({ port: 80 });
    
    console.log(`✅ Global tunnel created successfully: ${tunnel.url}`);
    
    // Keep the tunnel open
    tunnel.on('close', () => {
      console.log('Localtunnel closed');
    });
    
    return tunnel.url;
  } catch (err) {
    console.error('❌ Failed to create localtunnel:', err.message);
    return null;
  }
}

// Try to create ngrok tunnel with fallback to localtunnel
async function createTunnel() {
  try {
    // Try ngrok first
    console.log('Starting ngrok tunnel for Appwrite (port 80)...');
    
    // Check if ngrok module is installed
    try {
      require.resolve('ngrok');
    } catch (err) {
      const shouldInstall = await askYesNo('Ngrok is not installed. Install it now?');
      if (shouldInstall) {
        await installOrReinstallNgrok();
      } else {
        return await createLocalTunnel(); // Fallback to localtunnel
      }
    }
    
    try {
      // Try to use ngrok
      const ngrok = require('ngrok');
      const url = await ngrok.connect({
        addr: 80,
        // You might need to add your ngrok auth token here for a more stable URL
        // authtoken: 'your-ngrok-auth-token',
      });
      
      console.log(`✅ Global tunnel created successfully with ngrok: ${url}`);
      return url;
    } catch (err) {
      console.error('Error with ngrok:', err.message);
      
      if (err.message.includes('Error reading configuration file') || 
          err.message.includes('version property is required')) {
        
        const configFixed = await upgradeNgrokConfig();
        if (configFixed) {
          console.log('Trying ngrok again after fixing configuration...');
          try {
            // Clear require cache to reload ngrok with the new config
            delete require.cache[require.resolve('ngrok')];
            const ngrok = require('ngrok');
            const url = await ngrok.connect({ addr: 80 });
            console.log(`✅ Global tunnel created successfully with ngrok: ${url}`);
            return url;
          } catch (retryErr) {
            console.error('Still having issues with ngrok after fixing config:', retryErr.message);
          }
        }
        
        // Ask to reinstall ngrok
        const shouldReinstall = await askYesNo('Would you like to try reinstalling ngrok?');
        if (shouldReinstall) {
          const reinstalled = await installOrReinstallNgrok();
          if (reinstalled) {
            console.log('Trying ngrok again after reinstalling...');
            try {
              // Clear require cache to reload ngrok
              delete require.cache[require.resolve('ngrok')];
              const ngrok = require('ngrok');
              const url = await ngrok.connect({ addr: 80 });
              console.log(`✅ Global tunnel created successfully with ngrok: ${url}`);
              return url;
            } catch (retryErr) {
              console.error('Still having issues with ngrok after reinstalling:', retryErr.message);
            }
          }
        }
      }
      
      // Fallback to localtunnel if ngrok fails
      console.log('Falling back to localtunnel...');
      return await createLocalTunnel();
    }
  } catch (err) {
    console.error('Error creating tunnel:', err.message);
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

// Main function
async function main() {
  console.log('🌐 M1 Mac - Setting up global access for Maverick Marketplace 🌐');
  console.log('--------------------------------------------------------');
  
  // Update Appwrite config to allow external connections
  updateAppwriteEnv();
  
  // Check if Appwrite is running
  if (!isAppwriteRunning()) {
    console.log('❌ Appwrite is not running.');
    const startAppwrite = await askYesNo('Do you want to start Appwrite now?');
    if (startAppwrite) {
      await restartAppwrite();
      console.log('Waiting for Appwrite to initialize...');
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    } else {
      console.log('Please start Appwrite first, then run this script again.');
      rl.close();
      return;
    }
  } else {
    // If Appwrite is running, ask to restart with new configuration
    const restartAppwriteNow = await askYesNo('Appwrite is already running. Restart with new configuration?');
    if (restartAppwriteNow) {
      await restartAppwrite();
      console.log('Waiting for Appwrite to initialize...');
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    }
  }
  
  // Create tunnel
  const tunnelUrl = await createTunnel();
  if (!tunnelUrl) {
    console.error('❌ Failed to create tunnel. Exiting...');
    rl.close();
    return;
  }
  
  // Update .env file with tunnel URL
  updateEnvWithNgrokUrl(tunnelUrl);
  
  console.log('\n🔗 Global Access Information:');
  console.log('---------------------------');
  console.log(`Appwrite is now accessible at: ${tunnelUrl}`);
  console.log('This URL will work from any network or device.');
  
  // Start Expo
  const shouldStartExpo = await askYesNo('Start Expo with global tunnel access?');
  if (shouldStartExpo) {
    startExpoTunnel();
  } else {
    console.log('\nYou can start Expo later with: npm run tunnel');
    console.log('The global access URL will be valid until you stop the tunnel process.');
    rl.close();
  }
}

// Run the main function
main().catch(err => {
  console.error('An error occurred:', err);
  rl.close();
});