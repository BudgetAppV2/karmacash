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
 * Check that necessary environment variables are set
 */
function validateEnvironment() {
  const requiredVars = ['CURSOR_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.info('Please add these variables to your .env file in the project root');
    process.exit(1);
  }
}

/**
 * Create a test template
 */
async function createTestTemplate(client) {
  logger.info('Creating test template...');
  
  // Create a sample template with unique identifiers
  const timestamp = Date.now();
  const sessionId = `M${Math.floor(Math.random() * 10)}.S${Math.floor(Math.random() * 20)}`;
  
  const testTemplate = {
    sessionId: sessionId,
    type: 'handoff',
    content: `# Test Handoff ${timestamp}
    
## Overview
This is a test template created from the Cursor AI integration tool.

## Details
- Created: ${new Date().toISOString()}
- Session: ${sessionId}
- Purpose: Testing Cursor AI integration

## Tasks
- [ ] Task 1: Verify template creation
- [ ] Task 2: Test template retrieval
- [ ] Task 3: Implement integration logic
    `,
    name: `Test Template ${timestamp}`,
    source: 'cursor-ai-integration-test',
    status: 'draft'
  };
  
  try {
    const result = await client.createTemplate(testTemplate);
    logger.success('Template created successfully!');
    logger.info(`Template ID: ${result.id}`);
    logger.info(`Session ID: ${sessionId} (save this to retrieve the template later)`);
    logger.json(result);
    return result;
  } catch (error) {
    logger.error(`Error creating template: ${error.message}`);
    if (error.response) {
      logger.info(`Status: ${error.response.status}`);
      logger.json(error.response.data);
    }
    throw error;
  }
}

/**
 * List templates
 */
async function listTemplates(client) {
  logger.info('Listing templates...');
  
  try {
    const templates = await client.listTemplates();
    logger.success(`Found ${templates.length} templates`);
    
    if (templates.length > 0) {
      templates.forEach((template, index) => {
        logger.highlight(`\n[${index + 1}] ${template.name} (${template.id})`);
        console.log(`Category: ${template.category}`);
        console.log(`Description: ${template.description}`);
        console.log(`Tags: ${template.tags ? template.tags.join(', ') : 'none'}`);
        console.log(`Created: ${new Date(template.createdAt).toLocaleString()}`);
      });
    } else {
      logger.warning('No templates found');
    }
    
    return templates;
  } catch (error) {
    logger.error(`Failed to list templates: ${error.message}`);
    if (error.response) {
      logger.json(error.response.data);
    }
    throw error;
  }
}

/**
 * Get a template by ID
 */
async function getTemplate(client, id) {
  if (!id) {
    logger.error('Template ID is required');
    process.exit(1);
  }
  
  logger.info(`Getting template with ID: ${id}`);
  
  try {
    const template = await client.getTemplate(id);
    logger.success('Template retrieved successfully');
    logger.highlight(`\n${template.name} (${template.id})`);
    console.log(`Category: ${template.category}`);
    console.log(`Description: ${template.description}`);
    console.log(`Tags: ${template.tags ? template.tags.join(', ') : 'none'}`);
    console.log(`Created: ${new Date(template.createdAt).toLocaleString()}`);
    console.log('\nContent:');
    console.log('--------');
    console.log(template.content);
    
    return template;
  } catch (error) {
    logger.error(`Failed to get template: ${error.message}`);
    if (error.response) {
      logger.json(error.response.data);
    }
    throw error;
  }
}

/**
 * Test the sync functionality
 */
async function testSync() {
  logger.info('Testing template synchronization...');
  
  try {
    await syncTemplates();
    logger.success('Synchronization completed successfully');
    return true;
  } catch (error) {
    logger.error(`Synchronization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Run a complete integration test
 */
async function runCompleteTest(client) {
  logger.info('Running complete integration test...');
  
  try {
    // Step 1: List templates
    logger.info('\n=== Step 1: Listing existing templates ===');
    const templates = await listTemplates(client);
    
    // Step 2: Create a test template
    logger.info('\n=== Step 2: Creating a test template ===');
    const createdTemplate = await createTestTemplate(client);
    
    // Step 3: Get the created template
    logger.info('\n=== Step 3: Retrieving the created template ===');
    await getTemplate(client, createdTemplate.id);
    
    // Step 4: Test sync
    logger.info('\n=== Step 4: Testing synchronization ===');
    await testSync();
    
    logger.success('\nComplete integration test finished successfully');
  } catch (error) {
    logger.error('\nComplete integration test failed');
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    validateEnvironment();
    
    const client = new CursorAIClient({
      apiKey: process.env.CURSOR_API_KEY
    });
    
    const command = process.argv[2] || 'help';
    
    switch (command) {
      case 'list':
        await listTemplates(client);
        break;
        
      case 'get':
        const id = process.argv[3];
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
  list               List all templates
  get <id>           Get a template by ID
  create             Create a test template
  sync               Test the synchronization functionality
  test               Run a complete integration test
  help               Show this help message

Examples:
  node test-cursor-integration.js list
  node test-cursor-integration.js get template-123
  node test-cursor-integration.js create
  node test-cursor-integration.js sync
  node test-cursor-integration.js test
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
  runCompleteTest
}; 