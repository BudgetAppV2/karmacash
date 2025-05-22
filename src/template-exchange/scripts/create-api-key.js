/**
 * API Key Generation Script
 * 
 * This script generates and stores an API key in Firestore for use with the Template Exchange System.
 * Run this script to create a new API key for authenticating with the API.
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Default path to service account key file, can be overridden via command line
let serviceAccountPath = path.resolve(__dirname, '../../../firebase-credentials.json');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  serviceAccountPath = path.resolve(args[0]);
}

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at ${serviceAccountPath}`);
  console.error('Please provide a valid path to your service account key file.');
  console.error('Usage: node create-api-key.js [path/to/serviceAccountKey.json]');
  process.exit(1);
}

// Load service account credentials
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Generate a random API key
function generateApiKey() {
  return crypto.randomBytes(24).toString('hex');
}

// Store the API key in Firestore
async function storeApiKey() {
  try {
    const db = admin.firestore();
    
    // Generate a new API key
    const apiKey = generateApiKey();
    
    // Store the API key in the config/api_keys document
    await db.collection('config').doc('api_keys').set({
      key: apiKey,
      created: admin.firestore.FieldValue.serverTimestamp(),
      description: 'Template Exchange System API Key'
    });
    
    console.log('API key created successfully!');
    console.log('API Key:', apiKey);
    console.log('\nIMPORTANT: Store this key securely. It will be needed for API authentication.');
    
    // Provide instructions for usage
    console.log('\nUsage instructions:');
    console.log('1. Add this key to your environment variables as TEMPLATE_API_KEY');
    console.log('2. Or include it in API requests as the x-api-key header');
    
    return apiKey;
  } catch (error) {
    console.error('Error creating API key:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('Creating API key for Template Exchange System...');
  
  try {
    await storeApiKey();
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 