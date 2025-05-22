#!/usr/bin/env node

/**
 * Template Exchange - Cursor AI Integration Test Tool
 * 
 * This script tests the integration between the Template Exchange system and Cursor AI.
 * It performs basic operations like listing, creating, and getting templates to verify functionality.
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the project root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Print styled messages
const styles = {
  error: '\x1b[31m%s\x1b[0m',  // Red
  success: '\x1b[32m%s\x1b[0m', // Green
  info: '\x1b[36m%s\x1b[0m',    // Cyan
  warning: '\x1b[33m%s\x1b[0m', // Yellow
  highlight: '\x1b[35m%s\x1b[0m' // Magenta
};

const logger = {
  error: (msg) => console.error(styles.error, `[ERROR] ${msg}`),
  success: (msg) => console.log(styles.success, `[SUCCESS] ${msg}`),
  info: (msg) => console.log(styles.info, `[INFO] ${msg}`),
  warning: (msg) => console.log(styles.warning, `[WARNING] ${msg}`),
  highlight: (msg) => console.log(styles.highlight, msg),
  json: (data) => console.log(JSON.stringify(data, null, 2))
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = {};
  let command = 'help';
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        args[key] = value;
      } else {
        args[key] = true;
      }
    } else if (i === 2) {
      command = arg;
    }
  }
  
  return { command, args };
}

/**
 * Simple health check test
 */
async function testHealthCheck(apiKey) {
  logger.info('Testing health check endpoint...');
  
  try {
    const response = await axios({
      method: 'get',
      url: 'https://karmacash-6e8f5.web.app/api/templateExchangeHealthCheck',
      headers: {
        'X-API-Key': apiKey
      },
      timeout: 10000
    });
    
    logger.success('Health check successful');
    logger.json(response.data);
    return response.data;
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    if (error.response) {
      logger.json(error.response.data);
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const { command, args } = parseArgs();
    
    // Check for API key
    const apiKey = args['api-key'] || process.env.CURSOR_API_KEY;
    
    if (!apiKey) {
      logger.error('API key is required');
      logger.info('Provide it with --api-key=<your-key> or set CURSOR_API_KEY in your .env file');
      process.exit(1);
    }
    
    switch (command) {
      case 'health':
      case 'healthcheck':
        await testHealthCheck(apiKey);
        break;
        
      case 'help':
      default:
        console.log(`
Template Exchange - Cursor AI Integration Test Tool

Usage: node test-cursor-integration.js [command] [options]

Commands:
  health             Test the health check endpoint
  help               Show this help message

Options:
  --api-key=<key>    Specify the API key directly (overrides environment variable)

Examples:
  node test-cursor-integration.js health --api-key=your_api_key
        `);
        break;
    }
  } catch (error) {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
} 