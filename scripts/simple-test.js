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
    const response = await axios({
      method: 'get',
      url: 'https://karmacash-6e8f5.web.app/api/templateExchangeHealthCheck',
      headers: {
        'X-API-Key': apiKey
      },
      timeout: 5000
    });
    
    logger.success('Health check successful!');
    logger.json(response.data);
    return true;
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

// Run the test
testHealthCheck()
  .then(success => {
    if (success) {
      logger.info('Test completed successfully');
      process.exit(0);
    } else {
      logger.error('Test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }); 