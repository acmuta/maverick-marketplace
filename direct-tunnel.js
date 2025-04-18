const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create Express app for simplified proxying
const app = express();
const PORT = 8000;

// Install required packages if not already installed
try {
  require.resolve('express');
  require.resolve('http-proxy-middleware');
} catch (err) {
  console.log('Installing required packages...');
  require('child_process').execSync('npm install express http-proxy-middleware', {
    stdio: 'inherit'
  });
  console.log('Packages installed. Restarting script...');
  require('child_process').spawn(process.argv[0], process.argv.slice(1), {
    stdio: 'inherit',
    detached: true
  });
  process.exit(0);
}

// Proxy all requests to local Appwrite
app.use('/', createProxyMiddleware({
  target: 'http://localhost',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Start the proxy server
const server = app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
  console.log('Now forward this port using your preferred method:');
  console.log('- Use "npx localtunnel --port 8000" in another terminal');
  console.log('- Or use "ssh -R 80:localhost:8000 serveo.net" if localtunnel fails');
  console.log('\nUpdate your .env file to use the tunnel URL + /v1 for EXPO_PUBLIC_APPWRITE_ENDPOINT');
});

// Handle termination
process.on('SIGINT', () => {
  console.log('Shutting down proxy server...');
  server.close();
  process.exit();
});