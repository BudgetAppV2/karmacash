#!/usr/bin/env node

/**
 * Simple Test Script for Template Exchange
 */

const axios = require('axios');

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

// Get the API key from command line
const args = process.argv.slice(2);
let apiKey = '';

for (const arg of args) {
  if (arg.startsWith('--api-key=')) {
    apiKey = arg.split('=')[1];
    break;
  }
}

if (!apiKey) {
  logger.error('API key is required');
  logger.info('Usage: node simple-test.js --api-key=<your-api-key>');
  process.exit(1);
}

// Test the health check endpoint
async function testHealthCheck() {
  logger.info('Testing Template Exchange health check...');
  
  try {
    // Try multiple potential URLs to find the correct one
    const urls = [
      'https://karmacash-6e8f5.web.app/api/templateExchangeHealthCheck',
      'https://us-central1-karmacash-6e8f5.cloudfunctions.net/templateExchangeHealthCheck',
      'https://template-exchange-karmacash.web.app/api/templateExchangeHealthCheck'
    ];
    
    let success = false;
    let lastError = null;
    let lastResponse = null;
    
    for (const url of urls) {
      logger.info(`Trying ${url}...`);
      
      try {
        const response = await axios({
          method: 'get',
          url: url,
          headers: {
            'X-API-Key': apiKey
          },
          timeout: 5000
        });
        
        success = true;
        lastResponse = response;
        logger.success(`Success with ${url}`);
        break;
      } catch (error) {
        lastError = error;
        logger.warning(`Failed with ${url}: ${error.message}`);
        continue;
      }
    }
    
    if (success && lastResponse) {
      logger.success('Health check successful!');
      logger.json(lastResponse.data);
      return true;
    } else {
      throw lastError;
    }
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    
    if (error.response) {
      logger.info(`Status: ${error.response.status}`);
      logger.json(error.response.data);
    } else if (error.request) {
      logger.info('No response received from server');
    }
    
    return false;
  }
}

// Test the list templates endpoint
async function testListTemplates() {
  logger.info('Testing Template Exchange list templates...');
  
  try {
    const response = await axios({
      method: 'get',
      url: 'https://us-central1-karmacash-6e8f5.cloudfunctions.net/templateExchangeListTemplates',
      headers: {
        'X-API-Key': apiKey
      },
      timeout: 5000
    });
    
    logger.success('List templates successful!');
    logger.info(`Found ${response.data.templates.length} templates:`);
    
    // Display template information in a more readable format
    if (response.data.templates.length > 0) {
      response.data.templates.forEach((template, index) => {
        logger.highlight(`\nTemplate ${index + 1}:`);
        console.log(`  ID: ${template.id}`);
        console.log(`  Name: ${template.name}`);
        console.log(`  Source: ${template.source}`);
        console.log(`  Created: ${new Date(template.created).toLocaleString()}`);
      });
    } else {
      logger.info('No templates found. The system is ready but empty.');
    }
    
    return true;
  } catch (error) {
    logger.error(`List templates failed: ${error.message}`);
    
    if (error.response) {
      logger.info(`Status: ${error.response.status}`);
      logger.json(error.response.data);
    } else if (error.request) {
      logger.info('No response received from server');
    }
    
    return false;
  }
}

// Test the create template endpoint
async function testCreateTemplate() {
  logger.info('Testing Template Exchange create template...');
  
  // Create a sample template with current timestamp to ensure uniqueness
  const sampleTemplate = {
    sessionId: `M${Math.floor(Math.random() * 10)}.S${Math.floor(Math.random() * 20)}`, // Format: M1.S2
    type: 'handoff', // Required field: must be 'handoff' or 'summary'
    content: `# Sample Template ${Date.now()}\n\n## Overview\nThis is a test template created via API for Cursor AI integration.\n\n## Details\n- Created: ${new Date().toISOString()}\n- Purpose: Testing template exchange API\n- Source: Cursor AI\n\n## Instructions\nThis template can be used for testing the integration between systems.`,
    // Additional metadata (optional)
    name: `Test Template ${Date.now()}`,
    source: 'cursor-ai',
    status: 'draft'
  };
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://us-central1-karmacash-6e8f5.cloudfunctions.net/templateExchangeCreateTemplate',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      data: sampleTemplate,
      timeout: 10000
    });
    
    logger.success('Create template successful!');
    logger.info('New template created with ID:');
    logger.highlight(response.data.id);
    logger.json(response.data);
    
    return true;
  } catch (error) {
    logger.error(`Create template failed: ${error.message}`);
    
    if (error.response) {
      logger.info(`Status: ${error.response.status}`);
      logger.json(error.response.data);
    } else if (error.request) {
      logger.info('No response received from server');
    }
    
    return false;
  }
}

// Run the test
async function runTests() {
  let success = false;
  
  // First test the health check
  logger.highlight('\n=== Testing Health Check ===\n');
  success = await testHealthCheck();
  
  if (!success) {
    logger.error('Health check failed, cannot continue with other tests');
    return false;
  }
  
  // If health check passes, test listing templates
  logger.highlight('\n=== Testing List Templates ===\n');
  success = await testListTemplates();
  
  if (!success) {
    logger.error('List templates failed, cannot continue with other tests');
    return false;
  }
  
  // Finally, test creating a template
  logger.highlight('\n=== Testing Create Template ===\n');
  const createSuccess = await testCreateTemplate();
  
  // If we successfully created a template, list templates again to verify
  if (createSuccess) {
    logger.highlight('\n=== Verifying Template Creation ===\n');
    await testListTemplates();
  }
  
  return success && createSuccess;
}

// Change from direct call to using our new function
runTests()
  .then(success => {
    if (success) {
      logger.info('All tests completed successfully');
      process.exit(0);
    } else {
      logger.error('Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }); 