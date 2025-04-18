/**
 * This script fixes tunneling issues on M1 Macs
 * Run it with: node m1-tunnel-fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 M1 Mac Expo Tunnel Fix 🔧');
console.log('----------------------------');
console.log('This will install ngrok locally and configure Expo to use it.\n');

// Step 1: Install ngrok as a dev dependency
console.log('Step 1: Installing @expo/ngrok as a dev dependency...');
try {
  execSync('npm install --save-dev @expo/ngrok@^4.1.0', { stdio: 'inherit' });
  console.log('✅ @expo/ngrok installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install @expo/ngrok:', error.message);
  console.log('Trying alternative installation method...');
  try {
    execSync('npm install --save-dev ngrok@^4.3.3', { stdio: 'inherit' });
    console.log('✅ ngrok installed as fallback\n');
  } catch (fallbackError) {
    console.error('❌ Failed to install ngrok as fallback:', fallbackError.message);
    process.exit(1);
  }
}

// Step 2: Create a custom tunnel script
console.log('Step 2: Creating custom tunnel script...');
const tunnelScriptPath = path.join(__dirname, 'start-tunnel.js');
const tunnelScriptContent = `
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
  console.log(\`Expo process exited with code \${code}\`);
});
`;

try {
  fs.writeFileSync(tunnelScriptPath, tunnelScriptContent);
  console.log('✅ Created start-tunnel.js script\n');
} catch (error) {
  console.error('❌ Failed to create tunnel script:', error.message);
  process.exit(1);
}

// Step 3: Update package.json
console.log('Step 3: Updating package.json...');
const packageJsonPath = path.join(__dirname, 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add our script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['start-m1-tunnel'] = 'node start-tunnel.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with new script\n');
} catch (error) {
  console.error('❌ Failed to update package.json:', error.message);
  console.log('Please manually add this script to your package.json:');
  console.log('"start-m1-tunnel": "node start-tunnel.js"');
}

// Step 4: Install dotenv if not already installed
console.log('Step 4: Making sure dotenv is installed...');
try {
  require.resolve('dotenv');
  console.log('✅ dotenv is already installed\n');
} catch (error) {
  console.log('Installing dotenv...');
  try {
    execSync('npm install --save-dev dotenv', { stdio: 'inherit' });
    console.log('✅ dotenv installed successfully\n');
  } catch (installError) {
    console.error('❌ Failed to install dotenv:', installError.message);
    console.log('Please manually install it: npm install --save-dev dotenv');
  }
}

console.log('🎉 M1 Mac Tunnel Fix Complete! 🎉');
console.log('--------------------------------');
console.log('To start your app with tunneling:');
console.log('  npm run start-m1-tunnel');
console.log('\nThis will use your local installation of ngrok instead of the global one.');