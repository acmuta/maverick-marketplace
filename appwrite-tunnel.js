/**
 * This script sets up ngrok to tunnel both Expo AND Appwrite
 * This allows people on other networks to test your full app stack
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if ngrok is installed
const checkNgrok = () => {
  try {
    execSync('npx ngrok --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

// Install ngrok if needed
const installNgrok = async () => {
  console.log('Installing ngrok...');
  try {
    execSync('npm install --save-dev ngrok@latest', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to install ngrok:', error.message);
    return false;
  }
};

// Start ngrok tunnel for Appwrite
const startAppwriteTunnel = async () => {
  try {
    console.log('Starting ngrok tunnel for Appwrite (port 80)...');
    
    // Start ngrok in a separate process
    const ngrok = spawn('npx', ['ngrok', 'http', '80'], { 
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });
    
    let appwriteTunnelUrl = null;
    
    // Process the output to get the tunnel URL
    ngrok.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Extract the tunnel URL from ngrok output
      if (output.includes('Forwarding') && output.includes('http')) {
        const match = output.match(/(https:\/\/[a-zA-Z0-9.-]+\.ngrok\.io)/);
        if (match && match[1]) {
          appwriteTunnelUrl = match[1];
          console.log(`\n✅ Appwrite tunnel URL: ${appwriteTunnelUrl}\n`);
          updateEnvWithTunnelUrl(appwriteTunnelUrl);
        }
      }
    });
    
    // Handle process exit
    ngrok.on('close', (code) => {
      console.log(`ngrok process exited with code ${code}`);
    });
    
    // Wait for the tunnel URL
    while (!appwriteTunnelUrl) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return appwriteTunnelUrl;
  } catch (error) {
    console.error('Error starting ngrok for Appwrite:', error.message);
    return null;
  }
};

// Update the project's .env file with the tunnel URL
const updateEnvWithTunnelUrl = (tunnelUrl) => {
  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update endpoint to use ngrok URL
      envContent = envContent.replace(
        /EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g, 
        `EXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1`
      );
      
      // Make sure tunnel mode is enabled
      if (!envContent.includes('EXPO_PUBLIC_APPWRITE_TUNNEL_MODE')) {
        envContent += '\nEXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true';
      } else {
        envContent = envContent.replace(
          /EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=.*/g,
          'EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true'
        );
      }
      
      // Add public URL for Appwrite
      if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PUBLIC_URL')) {
        envContent += `\nEXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}`;
      } else {
        envContent = envContent.replace(
          /EXPO_PUBLIC_APPWRITE_PUBLIC_URL=.*/g,
          `EXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}`
        );
      }
    } else {
      // Create new .env file
      envContent = `EXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=67e728450014b2d21858
EXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace
EXPO_PUBLIC_APPWRITE_TUNNEL_MODE=true
EXPO_PUBLIC_APPWRITE_PUBLIC_URL=${tunnelUrl}
`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env file with tunnel URL: ${tunnelUrl}/v1`);
    return true;
  } catch (error) {
    console.error('Error updating .env file:', error.message);
    return false;
  }
};

// Start Expo with tunneling
const startExpoTunnel = () => {
  console.log('\n🚀 Starting Expo tunnel...');
  process.env.EXPO_ROUTER_APP_ROOT = './app';
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  
  const expo = spawn('npx', ['expo', 'start', '--tunnel'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  expo.on('close', (code) => {
    console.log(`Expo process exited with code ${code}`);
    rl.close();
  });
};

// Prepare Appwrite for accepting tunnel connections
const prepareAppwrite = () => {
  try {
    console.log('Preparing Appwrite for tunnel connection...');
    const appwriteEnvPath = path.join(__dirname, 'appwrite', '.env');
    
    if (!fs.existsSync(appwriteEnvPath)) {
      console.error('Appwrite .env file not found. Please make sure Appwrite is set up correctly.');
      return false;
    }
    
    let appwriteEnvContent = fs.readFileSync(appwriteEnvPath, 'utf8');
    
    // Make sure all necessary settings are enabled
    const requiredSettings = [
      { key: '_APP_OPTIONS_ROUTER_PROTECTION', value: 'disabled' },
      { key: '_APP_OPTIONS_FORCE_HTTPS', value: 'disabled' },
      { key: '_APP_OPTIONS_CORS', value: 'enabled' }
    ];
    
    let modified = false;
    
    for (const setting of requiredSettings) {
      if (appwriteEnvContent.includes(setting.key)) {
        const regex = new RegExp(`${setting.key}=.*`, 'g');
        const newValue = `${setting.key}=${setting.value}`;
        
        if (!appwriteEnvContent.includes(newValue)) {
          appwriteEnvContent = appwriteEnvContent.replace(regex, newValue);
          modified = true;
        }
      } else {
        appwriteEnvContent += `\n${setting.key}=${setting.value}`;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(appwriteEnvPath, appwriteEnvContent);
      console.log('✅ Updated Appwrite .env file for tunnel compatibility');
      
      return true; // Return true to indicate Appwrite needs restarting
    }
    
    console.log('✅ Appwrite already configured for tunnel compatibility');
    return false; // No changes needed
  } catch (error) {
    console.error('Error preparing Appwrite:', error.message);
    return false;
  }
};

// Restart Appwrite service
const restartAppwrite = () => {
  console.log('Restarting Appwrite...');
  try {
    execSync('cd appwrite && docker-compose down && docker-compose up -d', { stdio: 'inherit' });
    console.log('✅ Appwrite restarted successfully');
    return true;
  } catch (error) {
    console.error('Failed to restart Appwrite:', error.message);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🌐 Setting up full app tunneling (Appwrite + Expo) 🌐\n');
  console.log('This script will:');
  console.log('1. Expose your local Appwrite instance via a public URL');
  console.log('2. Update your app to use this public Appwrite URL');
  console.log('3. Start Expo with tunneling for the app itself\n');
  
  // Check if ngrok is installed
  if (!checkNgrok()) {
    console.log('ngrok is required but not found.');
    const installed = await installNgrok();
    if (!installed) {
      console.error('Failed to install ngrok. Please install it manually and try again.');
      rl.close();
      return;
    }
  }
  
  // Prepare Appwrite configuration
  const appwriteNeedsRestart = prepareAppwrite();
  
  // Ask to restart Appwrite if needed
  if (appwriteNeedsRestart) {
    rl.question('Appwrite needs to be restarted. Do you want to restart it now? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        restartAppwrite();
        console.log('Waiting for Appwrite to initialize...');
        await new Promise(resolve => setTimeout(resolve, 20000)); // 20 seconds wait
        await startBothTunnels();
      } else {
        console.log('Please restart Appwrite manually before proceeding.');
        rl.close();
      }
    });
  } else {
    await startBothTunnels();
  }
};

// Start both Appwrite and Expo tunnels
const startBothTunnels = async () => {
  // Start Appwrite tunnel
  const appwriteTunnelUrl = await startAppwriteTunnel();
  if (!appwriteTunnelUrl) {
    console.error('Failed to start Appwrite tunnel. Exiting...');
    rl.close();
    return;
  }
  
  // Start Expo tunnel
  startExpoTunnel();
};

// Run the script
main();