const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to run commands with output displayed
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return null;
  }
}

// Function to update .env file with new URL
function updateEnvFile(tunnelUrl) {
  const envPath = path.join(__dirname, '.env');
  
  // Create or read existing .env file
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add Appwrite endpoint
  if (envContent.includes('EXPO_PUBLIC_APPWRITE_ENDPOINT=')) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_APPWRITE_ENDPOINT=.*/g,
      `EXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1`
    );
  } else {
    envContent += `\nEXPO_PUBLIC_APPWRITE_ENDPOINT=${tunnelUrl}/v1`;
  }
  
  // Update or add tunneling flags
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
  
  // Make sure we have Expo router settings
  if (!envContent.includes('EXPO_ROUTER_APP_ROOT=')) {
    envContent += '\nEXPO_ROUTER_APP_ROOT=./app';
  }
  
  if (!envContent.includes('EXPO_ROUTER_IMPORT_MODE=')) {
    envContent += '\nEXPO_ROUTER_IMPORT_MODE=sync';
  }
  
  // Make sure we have a project ID
  if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PROJECT_ID=')) {
    envContent += '\nEXPO_PUBLIC_APPWRITE_PROJECT_ID=67e334db001b3a5acbf2';
  }
  
  // Make sure we have a platform
  if (!envContent.includes('EXPO_PUBLIC_APPWRITE_PLATFORM=')) {
    envContent += '\nEXPO_PUBLIC_APPWRITE_PLATFORM=com.company.MaverickMarketPlace';
  }
  
  // Write updated content to .env file
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated .env file with tunnel URL: ${tunnelUrl}`);
}

// Try localtunnel (more reliable than ngrok in many environments)
async function tryLocalTunnel() {
  console.log('Trying localtunnel...');
  
  // Install localtunnel if needed
  try {
    runCommand('npm install --save-dev localtunnel');
  } catch (error) {
    console.log('Could not install localtunnel, but continuing anyway...');
  }
  
  // Generate random subdomain
  const subdomain = `maverick-${Math.random().toString(36).substring(2, 8)}`;
  
  return new Promise((resolve, reject) => {
    // Start localtunnel process
    const lt = spawn('npx', ['localtunnel', '--port', '80', '--subdomain', subdomain], {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });
    
    let tunnelUrl = null;
    let timeoutId = setTimeout(() => {
      if (!tunnelUrl) {
        lt.kill();
        reject(new Error('Localtunnel timeout after 30 seconds'));
      }
    }, 30000);
    
    lt.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('your url is:')) {
        const match = output.match(/(https:\/\/[a-zA-Z0-9.-]+\.loca\.lt)/);
        if (match && match[1]) {
          tunnelUrl = match[1];
          clearTimeout(timeoutId);
          
          console.log(`✅ Localtunnel created: ${tunnelUrl}`);
          
          // Keep the tunnel process running to maintain the connection
          console.log('Keeping tunnel open. DO NOT CLOSE THIS TERMINAL WINDOW!');
          console.log('Open a new terminal window and run: npm run win-tunnel');
          
          resolve({ url: tunnelUrl, process: lt });
        }
      }
    });
    
    lt.on('close', (code) => {
      if (!tunnelUrl) {
        clearTimeout(timeoutId);
        reject(new Error(`Localtunnel process exited with code ${code}`));
      }
    });
  });
}

// Try SSH tunneling with serveo.net (requires no installation)
async function tryServeo() {
  console.log('Trying Serveo SSH tunneling (no installation required)...');
  
  return new Promise((resolve, reject) => {
    // Start SSH tunnel to serveo.net
    const ssh = spawn('ssh', ['-R', '80:localhost:80', 'serveo.net'], {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });
    
    let tunnelUrl = null;
    let timeoutId = setTimeout(() => {
      if (!tunnelUrl) {
        ssh.kill();
        reject(new Error('Serveo timeout after 30 seconds'));
      }
    }, 30000);
    
    ssh.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      // Look for Serveo URL in output
      const match = output.match(/(https?:\/\/[a-zA-Z0-9.-]+\.serveo\.net)/);
      if (match && match[1]) {
        tunnelUrl = match[1];
        clearTimeout(timeoutId);
        
        console.log(`✅ Serveo tunnel created: ${tunnelUrl}`);
        
        console.log('Keeping tunnel open. DO NOT CLOSE THIS TERMINAL WINDOW!');
        console.log('Open a new terminal window and run: npm run win-tunnel');
        
        resolve({ url: tunnelUrl, process: ssh });
      }
    });
    
    ssh.on('close', (code) => {
      if (!tunnelUrl) {
        clearTimeout(timeoutId);
        reject(new Error(`Serveo process exited with code ${code}`));
      }
    });
  });
}

// Main function to try different tunneling methods
async function main() {
  console.log('🚀 Maverick Marketplace Reliable Tunneling 🚀');
  console.log('-------------------------------------------');
  
  // Try to set up a tunnel with different methods
  let tunnel = null;
  
  try {
    // Try localtunnel first (most reliable)
    tunnel = await tryLocalTunnel();
  } catch (ltError) {
    console.log(`🔄 Localtunnel failed: ${ltError.message}`);
    console.log('Trying alternative methods...');
    
    try {
      // Try Serveo as a backup
      tunnel = await tryServeo();
    } catch (serveoError) {
      console.error(`🔄 Serveo failed: ${serveoError.message}`);
      console.error('❌ All tunneling methods failed.');
      console.error('Please check your network settings, firewall, or try again later.');
      process.exit(1);
    }
  }
  
  // Update .env file if we have a tunnel
  if (tunnel && tunnel.url) {
    updateEnvFile(tunnel.url);
    
    // Keep the script running to maintain the tunnel
    console.log('\n🎉 Tunnel is ready and .env file has been updated!');
    console.log('\n📱 TO TEST YOUR APP:');
    console.log('1. Open a NEW terminal window');
    console.log('2. Run: npm run win-tunnel');
    console.log('3. Keep THIS terminal window open to maintain the tunnel');
    
    // Handle termination
    process.on('SIGINT', () => {
      console.log('\nShutting down tunnel...');
      if (tunnel.process) {
        tunnel.process.kill();
      }
      process.exit();
    });
  }
}

// Run the main function
main().catch(err => {
  console.error('Error in tunneling script:', err);
});