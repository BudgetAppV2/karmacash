#!/usr/bin/env node

/**
 * Template Exchange - Cursor AI Integration Test Tool
 * 
 * This script tests the integration between the Template Exchange system and Cursor AI.
 * It performs basic operations like listing, creating, and getting templates to verify functionality.
 * 
 * Usage: node test-cursor-integration.js [command] [options]
 * Commands:
 *   - list: List templates
 *   - get <id>: Get a template by ID
 *   - create: Create a test template
 *   - sync: Test the sync functionality
 *   - help: Show usage information
 * 
 * Options:
 *   --api-key=<key>: Specify the API key directly (overrides environment variable)
 */

const CursorAIClient = require('./cursor-integration-client');
const { getTemplateService } = require('../services/template-service');
const { syncTemplates } = require('./sync-cursor-templates');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

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
 * Parse command line arguments including --api-key
 */
function parseArgs() {
  const args = {};
  const command = process.argv[2];
  let id = null;
  
  // Check for options like --api-key=value
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        args[key] = value;
      } else {
        args[key] = true;
      }
    } else if (!command && i === 2) {
      // This is the command
      args.command = arg;
    } else if (command === 'get' && i === 3) {
      // This is the ID for the get command
      id = arg;
    }
  }
  
  return { command, id, options: args };
}

/**
 * Check that necessary environment variables are set
 */
function validateEnvironment(options) {
  // Check for API key in command line arguments first
  const apiKey = options?.['api-key'] || process.env.CURSOR_API_KEY;
  
  if (!apiKey) {
    logger.error('Missing required API key');
    logger.info('Please provide it via --api-key=<key> or set CURSOR_API_KEY in your .env file');
    process.exit(1);
  }
  
  return { apiKey };
}

/**
 * Test the health check endpoint
 */
async function testHealthCheck(client) {
  logger.info('Testing health check endpoint...');
  
  try {
    const result = await client.healthCheck();
    logger.success('Health check successful');
    logger.json(result);
    return result;
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
    const { command, id, options } = parseArgs();
    const { apiKey } = validateEnvironment(options);
    
    const client = new CursorAIClient({
      apiKey: apiKey
    });
    
    switch (command) {
      case 'health':
      case 'healthcheck':
        await testHealthCheck(client);
        break;
        
      case 'list':
        await listTemplates(client);
        break;
        
      case 'get':
        await getTemplate(client, id);
        break;
        
      case 'create':
        await createTestTemplate(client);
        break;
        
      case 'sync':
        await testSync();
        break;
        
      case 'test':
        await runCompleteTest(client);
        break;
        
      case 'help':
      default:
        console.log(`
Cursor AI Integration Test Tool

Usage: node test-cursor-integration.js [command] [options]

Commands:
  health             Test the health check endpoint
  list               List all templates
  get <id>           Get a template by ID
  create             Create a test template
  sync               Test the synchronization functionality
  test               Run a complete integration test
  help               Show this help message

Options:
  --api-key=<key>    Specify the API key directly (overrides environment variable)

Examples:
  node test-cursor-integration.js health --api-key=your_api_key
  node test-cursor-integration.js list --api-key=your_api_key
  node test-cursor-integration.js get template-123 --api-key=your_api_key
  node test-cursor-integration.js create --api-key=your_api_key
  node test-cursor-integration.js sync --api-key=your_api_key
  node test-cursor-integration.js test --api-key=your_api_key
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

module.exports = {
  createTestTemplate,
  listTemplates,
  getTemplate,
  testSync,
  runCompleteTest,
  testHealthCheck
}; 