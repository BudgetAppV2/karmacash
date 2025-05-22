#!/usr/bin/env node
/**
 * Deployment Script for Template Exchange System
 * 
 * This script automates the deployment of the Template Exchange System to Firebase.
 * It deploys Firestore security rules, indexes, and Cloud Functions.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  projectRoot: path.resolve(__dirname, '../../..'),
  functionsDir: path.resolve(__dirname, '../functions'),
  firebaseDir: path.resolve(__dirname, '../firebase'),
  tempDir: path.resolve(__dirname, '../.temp'),
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Execute a shell command and log the output
 * @param {string} command - Command to execute
 * @param {string} cwd - Working directory
 * @param {boolean} logOutput - Whether to log command output
 * @returns {string} - Command output
 */
function execCommand(command, cwd = CONFIG.projectRoot, logOutput = true) {
  console.log(`${COLORS.cyan}Executing:${COLORS.reset} ${command}`);
  
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: logOutput ? 'inherit' : 'pipe',
      encoding: 'utf-8'
    });
    
    return output || '';
  } catch (error) {
    console.error(`${COLORS.red}Command failed:${COLORS.reset} ${command}`);
    console.error(error.toString());
    process.exit(1);
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean} - Whether file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

/**
 * Create a temporary firebase.json file for deployment
 */
function createTempFirebaseConfig() {
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(CONFIG.tempDir)) {
    fs.mkdirSync(CONFIG.tempDir, { recursive: true });
  }
  
  // Define paths for Firebase files
  const firebaseJsonPath = path.join(CONFIG.firebaseDir, 'firebase.json');
  const firestoreRulesPath = path.join(CONFIG.firebaseDir, 'firestore.rules');
  const firestoreIndexesPath = path.join(CONFIG.firebaseDir, 'firestore.indexes.json');
  
  // Verify required files exist
  if (!fileExists(firebaseJsonPath)) {
    console.error(`${COLORS.red}Error: File not found: ${firebaseJsonPath}${COLORS.reset}`);
    process.exit(1);
  }
  
  if (!fileExists(firestoreRulesPath)) {
    console.error(`${COLORS.red}Error: Firestore rules file not found: ${firestoreRulesPath}${COLORS.reset}`);
    process.exit(1);
  }
  
  // Create default indexes file if it doesn't exist
  if (!fileExists(firestoreIndexesPath)) {
    console.log(`${COLORS.yellow}Warning: Firestore indexes file not found, creating default${COLORS.reset}`);
    fs.writeFileSync(firestoreIndexesPath, JSON.stringify({
      "indexes": [],
      "fieldOverrides": []
    }, null, 2));
  }
  
  // Read source firebase.json
  const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf-8'));
  
  // Update paths to be relative to project root
  if (!firebaseJson.firestore) {
    firebaseJson.firestore = {};
  }
  
  // Set rules path
  firebaseJson.firestore.rules = path.relative(
    CONFIG.projectRoot,
    firestoreRulesPath
  );
  
  // Set indexes path
  firebaseJson.firestore.indexes = path.relative(
    CONFIG.projectRoot,
    firestoreIndexesPath
  );
  
  // Add functions configuration if it doesn't exist
  if (!firebaseJson.functions) {
    firebaseJson.functions = {
      "source": path.relative(CONFIG.projectRoot, CONFIG.functionsDir),
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "runtime": "nodejs18"
    };
  }
  
  // Remove lint predeploy if it exists
  if (firebaseJson.functions && firebaseJson.functions.predeploy) {
    delete firebaseJson.functions.predeploy;
  }
  
  // Write the temporary firebase.json
  const tempFirebaseJsonPath = path.join(CONFIG.projectRoot, 'firebase.json');
  fs.writeFileSync(tempFirebaseJsonPath, JSON.stringify(firebaseJson, null, 2));
  
  console.log(`${COLORS.green}Created temporary firebase.json for deployment${COLORS.reset}`);
  console.log(`Rules path: ${firebaseJson.firestore.rules}`);
  console.log(`Indexes path: ${firebaseJson.firestore.indexes}`);
  console.log(`Functions source: ${firebaseJson.functions ? firebaseJson.functions.source : 'not configured'}`);
  
  return tempFirebaseJsonPath;
}

/**
 * Clean up temporary files
 * @param {string} tempFirebaseJsonPath - Path to the temporary firebase.json
 */
function cleanup(tempFirebaseJsonPath) {
  if (fs.existsSync(tempFirebaseJsonPath)) {
    fs.unlinkSync(tempFirebaseJsonPath);
  }
  
  console.log(`${COLORS.green}Cleaned up temporary files${COLORS.reset}`);
}

/**
 * Check if Firebase CLI is installed
 */
function checkFirebaseCLI() {
  try {
    execCommand('firebase --version', CONFIG.projectRoot, false);
  } catch (error) {
    console.error(`${COLORS.red}Firebase CLI not found. Please install it with:${COLORS.reset}`);
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
}

/**
 * Install dependencies
 */
function installDependencies() {
  console.log(`${COLORS.magenta}Installing dependencies for functions...${COLORS.reset}`);
  execCommand('npm install', CONFIG.functionsDir);
}

/**
 * Deploy Firestore rules and indexes
 */
function deployFirestore() {
  console.log(`${COLORS.magenta}Deploying Firestore rules and indexes...${COLORS.reset}`);
  execCommand('firebase deploy --only firestore');
}

/**
 * Deploy Cloud Functions
 */
function deployFunctions() {
  console.log(`${COLORS.magenta}Deploying Cloud Functions...${COLORS.reset}`);
  execCommand('firebase deploy --only functions');
}

/**
 * Main deployment function
 */
async function deploy() {
  console.log(`${COLORS.blue}Starting deployment of Template Exchange System${COLORS.reset}`);
  
  // Check prerequisites
  checkFirebaseCLI();
  
  // Create temporary firebase.json
  const tempFirebaseJsonPath = createTempFirebaseConfig();
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const deployRules = args.includes('--rules') || args.includes('--all') || args.length === 0;
    const deployFuncs = args.includes('--functions') || args.includes('--all') || args.length === 0;
    
    // Install dependencies
    installDependencies();
    
    // Deploy based on arguments
    if (deployRules) {
      deployFirestore();
    }
    
    if (deployFuncs) {
      deployFunctions();
    }
    
    console.log(`${COLORS.green}Deployment completed successfully!${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}Deployment failed:${COLORS.reset} ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up
    cleanup(tempFirebaseJsonPath);
  }
}

// Run the deployment
deploy(); 