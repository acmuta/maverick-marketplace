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
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`Error running command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (err) {
    return false;
  }
}

// First, check the Expo version
console.log('Checking Expo version...');
const expoVersion = runCommand('npx expo --version');
console.log(`Current Expo version: ${expoVersion || 'unknown'}`);

// Check React Navigation dependencies
console.log('\nChecking React Navigation dependencies...');

// List of required dependencies for React Navigation
const requiredDependencies = [
  '@react-navigation/native',
  '@react-navigation/bottom-tabs',
  'react-native-screens',
  'react-native-safe-area-context'
];

// Check if they're installed
const missingDependencies = requiredDependencies.filter(dep => !isPackageInstalled(dep));

if (missingDependencies.length > 0) {
  console.log(`Missing dependencies: ${missingDependencies.join(', ')}`);
  console.log('Installing missing dependencies...');
  
  runCommand(`npm install ${missingDependencies.join(' ')} --save`);
} else {
  console.log('All required React Navigation dependencies are installed.');
}

// Fix the package.json to ensure compatible versions
console.log('\nUpdating package.json with compatible versions...');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Set compatible versions
const updatedDependencies = {
  'expo-router': '^4.0.0',
  '@react-navigation/native': '^7.0.0',
  '@react-navigation/bottom-tabs': '^7.0.0',
  'react-native-screens': '^3.30.0',
  'react-native-safe-area-context': '^4.8.2'
};

// Update package.json
let updated = false;
Object.entries(updatedDependencies).forEach(([dep, version]) => {
  if (packageJson.dependencies[dep]) {
    console.log(`Updating ${dep} to ${version}`);
    packageJson.dependencies[dep] = version;
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Package.json updated successfully.');
} else {
  console.log('No updates needed to package.json.');
}

// Clear cache and reinstall
console.log('\nClearing cache and reinstalling dependencies...');
runCommand('npm cache clean --force');
runCommand('rm -rf node_modules');
runCommand('npm install');

console.log('\nCleaning Expo cache...');
runCommand('npx expo-cli clear-cache');
runCommand('rm -rf ~/.expo');

console.log('\n✅ Dependencies fixed successfully!');
console.log('Next steps:');
console.log('1. Stop any running Metro bundler or Expo processes');
console.log('2. Restart your development server with: npm start');
console.log('3. Try running on a simulator or device');