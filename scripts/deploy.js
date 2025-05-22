#!/usr/bin/env node
/**
 * Firebase Deployment Script for Template Exchange System
 * 
 * This script automates the deployment process for the Template Exchange System,
 * handling Firestore security rules, indexes, and Cloud Functions deployment.
 * 
 * Usage:
 *   node scripts/deploy.js [--rules] [--indexes] [--functions] [--all]
 * 
 * Options:
 *   --rules     Deploy only Firestore security rules
 *   --indexes   Deploy only Firestore indexes
 *   --functions Deploy only Cloud Functions
 *   --all       Deploy everything (default)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const prompt = require('prompt-sync')({ sigint: true });

// Configuration
const config = {
  project: process.env.FIREBASE_PROJECT_ID || '',
  functionsDir: path.resolve(__dirname, '../functions'),
  rulesFile: path.resolve(__dirname, '../firestore.rules'),
  indexesFile: path.resolve(__dirname, '../firestore.indexes.json'),
  tempFiles: [],
};

/**
 * Execute a shell command and return the output
 * @param {string} command - Command to execute
 * @param {Object} options - Options for execSync
 * @returns {string} - Command output
 */
function execCommand(command, options = {}) {
  console.log(chalk.gray(`> ${command}`));
  
  try {
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options,
    });
    
    return output.trim();
  } catch (error) {
    console.error(chalk.red(`Command failed: ${command}`));
    console.error(chalk.red(error.message));
    
    if (error.stdout) {
      console.error(chalk.yellow('stdout:'));
      console.error(error.stdout.toString());
    }
    
    if (error.stderr) {
      console.error(chalk.yellow('stderr:'));
      console.error(error.stderr.toString());
    }
    
    throw error;
  }
}

/**
 * Create a temporary file
 * @param {string} filename - File name
 * @param {string} content - File content
 * @returns {string} - Path to the created file
 */
function createTempFile(filename, content) {
  const tempPath = path.resolve(__dirname, `../temp-${filename}`);
  fs.writeFileSync(tempPath, content);
  config.tempFiles.push(tempPath);
  return tempPath;
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  for (const file of config.tempFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}

/**
 * Get Firebase project ID
 * @returns {string} - Project ID
 */
function getProjectId() {
  if (config.project) return config.project;
  
  try {
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf-8'));
    config.project = firebaserc.projects.default;
    return config.project;
  } catch (error) {
    console.error(chalk.red('Error getting Firebase project ID:'));
    console.error(chalk.red(error.message));
    
    const projectId = prompt('Enter Firebase project ID: ');
    if (!projectId) {
      throw new Error('Firebase project ID is required');
    }
    
    config.project = projectId;
    return projectId;
  }
}

/**
 * Deploy Firestore security rules
 */
async function deployRules() {
  console.log(chalk.cyan('\nDeploying Firestore security rules...'));
  
  if (!fs.existsSync(config.rulesFile)) {
    console.error(chalk.red(`Rules file not found: ${config.rulesFile}`));
    return;
  }
  
  try {
    const projectId = getProjectId();
    execCommand(`firebase deploy --only firestore:rules --project=${projectId}`);
    console.log(chalk.green('Firestore security rules deployed successfully!'));
  } catch (error) {
    console.error(chalk.red('Failed to deploy Firestore security rules'));
    throw error;
  }
}

/**
 * Deploy Firestore indexes
 */
async function deployIndexes() {
  console.log(chalk.cyan('\nDeploying Firestore indexes...'));
  
  if (!fs.existsSync(config.indexesFile)) {
    console.error(chalk.red(`Indexes file not found: ${config.indexesFile}`));
    return;
  }
  
  try {
    const projectId = getProjectId();
    execCommand(`firebase deploy --only firestore:indexes --project=${projectId}`);
    console.log(chalk.green('Firestore indexes deployed successfully!'));
  } catch (error) {
    console.error(chalk.red('Failed to deploy Firestore indexes'));
    throw error;
  }
}

/**
 * Deploy Cloud Functions
 */
async function deployFunctions() {
  console.log(chalk.cyan('\nDeploying Cloud Functions...'));
  
  if (!fs.existsSync(config.functionsDir)) {
    console.error(chalk.red(`Functions directory not found: ${config.functionsDir}`));
    return;
  }
  
  try {
    // Check if node_modules exists in functions directory
    const nodeModulesPath = path.join(config.functionsDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(chalk.yellow('Installing dependencies in functions directory...'));
      execCommand('npm install', { cwd: config.functionsDir });
    }
    
    const projectId = getProjectId();
    execCommand(`firebase deploy --only functions --project=${projectId}`);
    console.log(chalk.green('Cloud Functions deployed successfully!'));
  } catch (error) {
    console.error(chalk.red('Failed to deploy Cloud Functions'));
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.bold('\nFirebase Deployment - Template Exchange System\n'));
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const deployRulesFlag = args.includes('--rules');
    const deployIndexesFlag = args.includes('--indexes');
    const deployFunctionsFlag = args.includes('--functions');
    const deployAllFlag = args.includes('--all') || (!deployRulesFlag && !deployIndexesFlag && !deployFunctionsFlag);
    
    // Display deployment plan
    console.log(chalk.cyan('Deployment plan:'));
    console.log(`- Firestore Rules: ${deployRulesFlag || deployAllFlag ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`- Firestore Indexes: ${deployIndexesFlag || deployAllFlag ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`- Cloud Functions: ${deployFunctionsFlag || deployAllFlag ? chalk.green('Yes') : chalk.red('No')}`);
    
    const projectId = getProjectId();
    console.log(chalk.cyan(`\nTarget project: ${projectId}`));
    
    const confirm = prompt('Proceed with deployment? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Deployment cancelled'));
      process.exit(0);
    }
    
    // Deploy based on flags
    if (deployRulesFlag || deployAllFlag) {
      await deployRules();
    }
    
    if (deployIndexesFlag || deployAllFlag) {
      await deployIndexes();
    }
    
    if (deployFunctionsFlag || deployAllFlag) {
      await deployFunctions();
    }
    
    console.log(chalk.green('\nDeployment completed successfully!'));
  } catch (error) {
    console.error(chalk.red(`\nDeployment failed: ${error.message}`));
    process.exit(1);
  } finally {
    cleanupTempFiles();
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Unexpected error: ${error.message}`));
  cleanupTempFiles();
  process.exit(1);
}); 