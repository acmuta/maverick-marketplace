const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();

  const priorityInterfaces = ['en0', 'eth0', 'wlan0', 'Wi-Fi', 'Ethernet'];
  
  for (const name of priorityInterfaces) {
    if (interfaces[name]) {
      const found = interfaces[name].find(
        (iface) => iface.family === 'IPv4' && !iface.internal
      );
      if (found) return found.address;
    }
  }
  
  for (const name in interfaces) {
    const iface = interfaces[name];
    const found = iface.find(
      (iface) => iface.family === 'IPv4' && !iface.internal
    );
    if (found) return found.address;
  }
  
  console.log('Could not determine local IP address, using localhost');
  return 'localhost';
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

function createEnvFile(localIP) {
  const envExamplePath = path.join(__dirname, '.env.example');
  const envPath = path.join(__dirname, '.env');
  
  if (!fileExists(envExamplePath)) {
    console.error('Error: .env.example file not found. Make sure you are running this script from the project root.');
    return false;
  }
  
  try {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    envContent = envContent.replace(
      /EXPO_PUBLIC_APPWRITE_ENDPOINT=.*$/m,
      `EXPO_PUBLIC_APPWRITE_ENDPOINT=http://${localIP}/v1`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env file with your local IP: ${localIP}`);
    return true;
  } catch (err) {
    console.error('Error creating .env file:', err.message);
    return false;
  }
}

function updateAppwriteEnv(localIP) {
  const appwriteEnvPath = path.join(__dirname, 'appwrite', '.env');
  
  if (!fileExists(appwriteEnvPath)) {
    console.error('Error: appwrite/.env file not found. You need to set up the Appwrite environment first.');
    return false;
  }
  
  try {
    let envContent = fs.readFileSync(appwriteEnvPath, 'utf8');
    
    envContent = envContent.replace(/_APP_DOMAIN=.*/g, `_APP_DOMAIN=${localIP}:80`);
    envContent = envContent.replace(/_APP_DOMAIN_FUNCTIONS=.*/g, `_APP_DOMAIN_FUNCTIONS=functions.${localIP}`);
    envContent = envContent.replace(/_APP_DOMAIN_TARGET=.*/g, `_APP_DOMAIN_TARGET=${localIP}:80`);
    
    if (envContent.includes('_APP_OPTIONS_CORS=')) {
      envContent = envContent.replace(/_APP_OPTIONS_CORS=.*/g, '_APP_OPTIONS_CORS=enabled');
    } else {
      envContent += '\n_APP_OPTIONS_CORS=enabled';
    }
    
    if (envContent.includes('_APP_OPTIONS_ROUTER_PROTECTION=')) {
      envContent = envContent.replace(/_APP_OPTIONS_ROUTER_PROTECTION=.*/g, '_APP_OPTIONS_ROUTER_PROTECTION=disabled');
    } else {
      envContent += '\n_APP_OPTIONS_ROUTER_PROTECTION=disabled';
    }
    
    fs.writeFileSync(appwriteEnvPath, envContent);
    console.log(`✅ Updated Appwrite .env file with your local IP: ${localIP}`);
    return true;
  } catch (err) {
    console.error('Error updating Appwrite .env file:', err.message);
    return false;
  }
}

function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
}

function isAppwriteRunning() {
  try {
    const result = execSync('docker ps | grep appwrite', { encoding: 'utf8' });
    return result.includes('appwrite');
  } catch (err) {
    return false;
  }
}

function startAppwrite() {
  console.log('Starting Appwrite...');
  try {
    execSync('cd appwrite && docker-compose up -d', { stdio: 'inherit' });
    console.log('✅ Appwrite started successfully. Wait a moment for services to initialize.');
    return true;
  } catch (err) {
    console.error('Error starting Appwrite:', err.message);
    return false;
  }
}

function askYesNo(question, callback) {
  rl.question(`${question} (y/n): `, (answer) => {
    const shouldRun = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    callback(shouldRun);
  });
}

async function main() {
  console.log('🚀 Setting up Maverick Marketplace development environment 🚀');
  console.log('--------------------------------------------------------');
  
  const localIP = getLocalIP();
  console.log(`📡 Your local IP address is: ${localIP}`);
  
  const appEnvCreated = createEnvFile(localIP);
  if (!appEnvCreated) {
    console.error('Failed to create .env file. Exiting...');
    rl.close();
    return;
  }
  
  if (!isDockerRunning()) {
    console.error('❌ Docker is not running. Please start Docker Desktop or Docker daemon first.');
    rl.close();
    return;
  }
  
  const appwriteRunning = isAppwriteRunning();
  
  if (appwriteRunning) {
    console.log('✅ Appwrite is already running.');
    updateAppwriteEnv(localIP);
    
    askYesNo('Do you want to restart Appwrite with the new configuration?', (shouldRestart) => {
      if (shouldRestart) {
        execSync('cd appwrite && docker-compose down && docker-compose up -d', { stdio: 'inherit' });
        console.log('✅ Appwrite restarted with new configuration.');
      }
      
      console.log('\n🎉 Setup complete! You can now run your development server:');
      console.log('   npm start');
      rl.close();
    });
  } else {
    updateAppwriteEnv(localIP);
    
    askYesNo('Appwrite is not running. Do you want to start it now?', (shouldStart) => {
      if (shouldStart) {
        startAppwrite();
        console.log('\n⏳ Waiting for Appwrite to initialize... (this might take a minute)');
        setTimeout(() => {
          console.log('\n🎉 Setup complete! You can now run your development server:');
          console.log('   npm start');
          rl.close();
        }, 15000);
      } else {
        console.log('\nRemember to start Appwrite before running the app:');
        console.log('   cd appwrite && docker-compose up -d');
        console.log('\n🎉 Setup complete! After starting Appwrite, you can run:');
        console.log('   npm start');
        rl.close();
      }
    });
  }
}

main();