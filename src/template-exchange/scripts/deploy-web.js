/**
 * Deploy Web Interface Script
 * 
 * This script deploys the Template Exchange web interface to Firebase Hosting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const PROJECT_ROOT = path.join(__dirname, '../../..');

console.log('Starting template exchange web interface deployment...');

// Ensure the public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error(`Public directory not found at ${PUBLIC_DIR}`);
  process.exit(1);
}

// Ensure Firebase configuration exists
if (!fs.existsSync(path.join(PROJECT_ROOT, 'firebase.json'))) {
  console.error('Firebase configuration not found at project root');
  process.exit(1);
}

// Deploy to Firebase Hosting using the template-exchange target
try {
  console.log('Deploying to Firebase Hosting (template-exchange target)...');
  
  // Change to project root directory for deployment
  process.chdir(PROJECT_ROOT);
  
  // Deploy only the template-exchange target
  execSync('firebase deploy --only hosting:template-exchange', { stdio: 'inherit' });
  
  console.log('\nTemplate exchange web interface deployed successfully!');
  console.log('Your website is now live at: https://template-exchange-karmacash.web.app');
} catch (error) {
  console.error('Error deploying to Firebase Hosting:', error);
  process.exit(1);
} 