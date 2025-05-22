#!/usr/bin/env node

/**
 * Store API Key Utility
 * 
 * This script stores the Template Exchange API key securely.
 * It will prompt for the API key if not provided as an argument.
 */

const { storeApiKey } = require('./cursor-ai-commands');
const chalk = require('chalk');
const readline = require('readline');

/**
 * Prompts for an API key in the terminal
 * @returns {Promise<string>} The entered API key
 */
async function promptForApiKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(chalk.cyan('Enter your Template Exchange API key: '), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.bold('Template Exchange API Key Storage Utility\n'));
    
    // Get API key from command line argument or prompt
    let apiKey = process.argv[2];
    
    if (!apiKey) {
      apiKey = await promptForApiKey();
    }
    
    if (!apiKey) {
      console.error(chalk.red('No API key provided.'));
      process.exit(1);
    }
    
    // Store the API key
    console.log(chalk.yellow('Storing API key securely...'));
    const success = await storeApiKey(apiKey);
    
    if (success) {
      console.log(chalk.green('\n✓ API key stored successfully!'));
      console.log(chalk.cyan('\nYou can now use the Template Exchange commands:'));
      console.log('  - fetchHandoff(sessionId)');
      console.log('  - submitSummary(sessionId, content)');
      console.log('  - and more...\n');
    } else {
      console.error(chalk.red('\n✗ Failed to store API key.'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`\n✗ Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the main function
main(); 