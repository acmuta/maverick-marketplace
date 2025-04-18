/**
 * This script fixes common dependency issues with React Navigation and Expo Router
 * Run it with: node fix-dependencies.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing React Navigation and Expo Router dependencies...');

// Function to run a command and return its output
function runCommand(command) {
  try {
    // Increased timeout for npm install, stdio: 'inherit' to see live output
    return execSync(command, { encoding: 'utf8', stdio: 'inherit', timeout: 300000 }); // 5 minutes timeout
  } catch (error) {
    console.error(`Error running command: ${command}`);
    // Don't log the full error object here as stdio: 'inherit' shows it directly
    // console.error(error.message); // Redundant if stdio: 'inherit'
    process.exit(1); // Exit if a command fails
  }
}

// Check if a package is installed (less reliable without node_modules)
function isPackageInstalled(packageName, packageJsonDeps) {
  // Check if it's listed in package.json dependencies as a proxy
  return !!packageJsonDeps[packageName];
}

// --- Script Start ---

// Read package.json first to check dependencies later
const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (e) {
  console.error(`Error reading package.json at ${packageJsonPath}`);
  process.exit(1);
}

// First, check the Expo version
console.log('Checking Expo version...');
const expoVersion = runCommand('npx expo --version'); // Keep this check
console.log(`Current Expo version: ${expoVersion || 'unknown'}`); // Note: This might be CLI version, not SDK

// List of required dependencies
const requiredDependencies = [
  '@react-navigation/native',
  '@react-navigation/bottom-tabs',
  'react-native-screens',
  'react-native-safe-area-context'
];

// Set compatible versions (ensure these are correct for your Expo SDK version)
const compatibleVersions = {
  'expo-router': '^4.0.0', // Adjust if needed for your Expo SDK
  '@react-navigation/native': '^7.0.0', // Requires newer Expo SDKs
  '@react-navigation/bottom-tabs': '^7.0.0', // Requires newer Expo SDKs
  'react-native-screens': '^4.10.0', // Use latest existing version
  'react-native-safe-area-context': '^4.8.2' // Compatible
};

// Check dependencies presence in package.json (instead of require.resolve)
console.log('\nChecking package.json for required dependencies...');
const missingFromPackageJson = requiredDependencies.filter(dep => !isPackageInstalled(dep, packageJson.dependencies));

if (missingFromPackageJson.length > 0) {
    console.log(`Dependencies missing from package.json: ${missingFromPackageJson.join(', ')}. Will add them.`);
    // Add missing ones to dependencies object for update below
    missingFromPackageJson.forEach(dep => {
        if (!packageJson.dependencies) packageJson.dependencies = {};
        packageJson.dependencies[dep] = compatibleVersions[dep]; // Add with target version
    });
} else {
    console.log('All required dependencies seem present in package.json.');
}

// *** REMOVED the problematic install step here ***

// Update package.json with compatible versions
console.log('\nUpdating package.json with compatible versions...');

let updated = false;
Object.entries(compatibleVersions).forEach(([dep, version]) => {
  // Ensure dependency exists before updating, or add if it was missing
  if (!packageJson.dependencies) packageJson.dependencies = {}; // Ensure dependencies obj exists
  
  if (packageJson.dependencies[dep] !== version || missingFromPackageJson.includes(dep)) {
    console.log(`Setting ${dep} to ${version}`);
    packageJson.dependencies[dep] = version;
    updated = true;
  }
});

if (updated) { // <--- Make sure the erroneous line is gone from here
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Package.json updated successfully.');
  } else {
    console.log('No version updates needed in package.json for specified dependencies.');
  }

// Clear cache and reinstall
console.log('\nClearing cache and reinstalling dependencies...');
runCommand('npm cache clean --force');
// No need to run rm -rf node_modules here if npm install is run next, it handles it.
// But let's keep it for good measure in case of weird states
runCommand('rm -rf node_modules'); 
console.log('\nRunning final npm install with --legacy-peer-deps...');
runCommand('npm install --legacy-peer-deps'); // Add the flag
console.log('\nCleaning Expo cache...');
// Using npx expo start --clear instead of potentially old expo-cli
runCommand('npx expo start --clear --non-interactive'); 
// Attempt to stop the non-interactive clear command cleanly (might not be necessary)
// process.kill(runCommand('pgrep -f "expo start --clear"')); // This is complex and platform dependent, safer to just let it finish or ctrl+c if needed.
console.log('Expo cache cleared (or attempted via expo start --clear).');
// runCommand('rm -rf ~/.expo'); // Keep removing global cache if needed

console.log('\n✅ Dependencies fixed successfully!');
console.log('Next steps:');
console.log('1. If any Metro bundler or Expo process is still running, stop it (Ctrl+C)');
console.log('2. Restart your development server with: npm start');
console.log('3. Try running on a simulator or device');
console.log('4. If issues persist, try `npm install --legacy-peer-deps` instead of `npm install` in the script.');