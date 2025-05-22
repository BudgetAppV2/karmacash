#!/usr/bin/env node
/**
 * API Testing Script for Template Exchange System
 * 
 * This script tests all endpoints of the Template Exchange API against a deployed instance.
 * It verifies CRUD operations, authentication, error handling, and data integrity.
 */

const axios = require('axios');
const chalk = require('chalk');
const prompt = require('prompt-sync')({ sigint: true });
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Test configuration
const config = {
  apiBaseUrl: process.env.API_URL || 'https://us-central1-karmacash-6e8f5.cloudfunctions.net',
  apiKey: process.env.API_KEY || '',
  reportDir: path.resolve(__dirname, '../test-reports'),
  timeout: 10000, // 10 seconds
  endpoints: {
    healthCheck: '/healthCheck',
    templates: '/templates',
    getTemplate: '/getTemplate',
    createTemplate: '/createTemplate',
    listTemplates: '/listTemplates'
  }
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Create HTTP client with API key authentication
 * @param {string} endpoint - API endpoint to use
 * @returns {Object} - Axios instance
 */
function createApiClient(endpoint = '') {
  return axios.create({
    baseURL: `${config.apiBaseUrl}${endpoint}`,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
    },
  });
}

/**
 * Format response for logging
 * @param {Object} response - Axios response
 * @returns {Object} - Formatted response
 */
function formatResponse(response) {
  if (!response) return { status: 'No response' };
  
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    data: response.data,
  };
}

/**
 * Run a test case
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  console.log(chalk.cyan(`\nRunning test: ${name}`));
  results.total++;
  
  const testResult = {
    name,
    status: 'pending',
    duration: 0,
    error: null,
    response: null,
  };
  
  const startTime = Date.now();
  
  try {
    const response = await testFn();
    const endTime = Date.now();
    testResult.duration = endTime - startTime;
    testResult.status = 'passed';
    testResult.response = formatResponse(response);
    
    console.log(chalk.green(`✓ ${name} (${testResult.duration}ms)`));
    results.passed++;
  } catch (error) {
    const endTime = Date.now();
    testResult.duration = endTime - startTime;
    testResult.status = 'failed';
    testResult.error = error.message;
    
    if (error.response) {
      testResult.response = formatResponse(error.response);
    }
    
    console.log(chalk.red(`✗ ${name} (${testResult.duration}ms)`));
    console.log(chalk.red(`  Error: ${error.message}`));
    results.failed++;
  }
  
  results.tests.push(testResult);
  return testResult;
}

/**
 * Skip a test case
 * @param {string} name - Test name
 * @param {string} reason - Skip reason
 */
function skipTest(name, reason) {
  console.log(chalk.yellow(`⚠ Skipping test: ${name}`));
  console.log(chalk.yellow(`  Reason: ${reason}`));
  
  results.total++;
  results.skipped++;
  results.tests.push({
    name,
    status: 'skipped',
    duration: 0,
    error: null,
    response: null,
    skipReason: reason,
  });
}

/**
 * Generate a test session ID
 * @returns {string} - Session ID
 */
function generateSessionId() {
  const milestone = Math.floor(Math.random() * 10) + 1;
  const session = Math.floor(Math.random() * 10) + 1;
  return `M${milestone}.S${session}`;
}

/**
 * Create a test template
 * @param {string} sessionId - Session ID
 * @param {string} type - Template type
 * @returns {Object} - Template data
 */
function createTestTemplate(sessionId, type = 'handoff') {
  return {
    sessionId,
    type,
    content: `# Test Template for ${sessionId} (${type})\n\n${uuidv4()}\n\nCreated at: ${new Date().toISOString()}`,
    status: 'draft',
    metadata: {
      source: 'api-test',
      testId: uuidv4(),
    },
  };
}

/**
 * Save test results to file
 */
function saveTestResults() {
  if (!fs.existsSync(config.reportDir)) {
    fs.mkdirSync(config.reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(config.reportDir, `test-report-${timestamp}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify({
    config: {
      apiUrl: config.apiUrl,
      timeout: config.timeout,
    },
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      timestamp: new Date().toISOString(),
    },
    tests: results.tests,
  }, null, 2));
  
  console.log(chalk.green(`\nTest results saved to: ${filePath}`));
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + chalk.bold('Test Summary:'));
  console.log(chalk.bold(`Total: ${results.total}`));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));
  console.log(chalk.yellow(`Skipped: ${results.skipped}`));
  
  const recommendations = [];
  
  if (results.failed > 0) {
    recommendations.push(chalk.red('- Fix the failing tests before proceeding to the next phase.'));
  }
  
  if (results.passed === results.total) {
    recommendations.push(chalk.green('- All tests passed! The API is ready for the next phase of development.'));
  }
  
  if (recommendations.length > 0) {
    console.log('\n' + chalk.bold('Recommendations:'));
    recommendations.forEach(rec => console.log(rec));
  }
}

/**
 * Run all API tests
 */
async function runAllTests() {
  let createdTemplateId = null;
  const testSessionId = generateSessionId();
  const testSessionIdForSummary = generateSessionId();
  
  // Test 1: Health check
  await runTest('Health Check', async () => {
    const client = createApiClient(config.endpoints.healthCheck);
    const response = await client.get('');
    if (response.status !== 200 || !response.data || !response.data.status) {
      throw new Error('Health check failed: API is not healthy');
    }
    return response;
  });
  
  // Test 2: API key validation (should fail with invalid key)
  await runTest('API Key Validation - Invalid Key', async () => {
    const invalidClient = axios.create({
      baseURL: `${config.apiBaseUrl}${config.endpoints.templates}`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'invalid-key',
      },
    });
    
    try {
      await invalidClient.get('');
      throw new Error('Expected authentication to fail, but it succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return error.response; // This is the expected outcome
      }
      throw error;
    }
  });
  
  // Test 3: Create template
  const createResult = await runTest('Create Template - Handoff', async () => {
    const client = createApiClient(config.endpoints.createTemplate);
    const template = createTestTemplate(testSessionId, 'handoff');
    const response = await client.post('', template);
    
    if (response.status !== 201 || !response.data.id) {
      throw new Error('Failed to create template');
    }
    
    createdTemplateId = response.data.id;
    return response;
  });
  
  // Test 4: Create summary template
  await runTest('Create Template - Summary', async () => {
    const client = createApiClient(config.endpoints.createTemplate);
    const template = createTestTemplate(testSessionIdForSummary, 'summary');
    const response = await client.post('', template);
    
    if (response.status !== 201 || !response.data.id) {
      throw new Error('Failed to create summary template');
    }
    
    return response;
  });
  
  // Test 5: Get template by session ID
  if (createResult.status === 'passed') {
    await runTest('Get Template by Session ID', async () => {
      const client = createApiClient(config.endpoints.getTemplate);
      const response = await client.get(`?sessionId=${testSessionId}&type=handoff`);
      
      if (response.status !== 200 || response.data.sessionId !== testSessionId) {
        throw new Error('Failed to get template by session ID');
      }
      
      return response;
    });
  } else {
    skipTest('Get Template by Session ID', 'Create template test failed');
  }
  
  // Test 6: Get template by ID
  if (createdTemplateId) {
    await runTest('Get Template by ID', async () => {
      const client = createApiClient(config.endpoints.getTemplate);
      const response = await client.get(`?id=${createdTemplateId}`);
      
      if (response.status !== 200 || response.data.id !== createdTemplateId) {
        throw new Error('Failed to get template by ID');
      }
      
      return response;
    });
  } else {
    skipTest('Get Template by ID', 'No template ID available');
  }
  
  // Test 7: List templates
  await runTest('List Templates', async () => {
    const client = createApiClient(config.endpoints.listTemplates);
    const response = await client.get('');
    
    if (response.status !== 200 || !Array.isArray(response.data.templates)) {
      throw new Error('Failed to list templates');
    }
    
    return response;
  });
  
  // Test 8: List templates with filter
  await runTest('List Templates with Filter', async () => {
    const client = createApiClient(config.endpoints.listTemplates);
    const response = await client.get('?type=handoff&limit=5');
    
    if (response.status !== 200 || !Array.isArray(response.data.templates)) {
      throw new Error('Failed to list templates with filter');
    }
    
    if (response.data.templates.some(t => t.type !== 'handoff')) {
      throw new Error('Filter did not work correctly');
    }
    
    return response;
  });
  
  // Test 9: Update template
  if (createdTemplateId) {
    await runTest('Update Template', async () => {
      const client = createApiClient(`${config.endpoints.templates}/${createdTemplateId}`);
      const updateData = {
        content: `# Updated Test Template\n\n${uuidv4()}\n\nUpdated at: ${new Date().toISOString()}`,
        status: 'active',
        metadata: {
          source: 'api-test',
          updated: true,
          testId: uuidv4(),
        },
      };
      
      const response = await client.put('', updateData);
      
      if (response.status !== 200 || !response.data.id) {
        throw new Error('Failed to update template');
      }
      
      return response;
    });
  } else {
    skipTest('Update Template', 'No template ID available');
  }
  
  // Test 10: Validation - Create with invalid session ID
  await runTest('Validation - Invalid Session ID', async () => {
    const client = createApiClient(config.endpoints.createTemplate);
    const invalidTemplate = createTestTemplate('invalid-id', 'handoff');
    
    try {
      await client.post('', invalidTemplate);
      throw new Error('Expected validation to fail, but it succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return error.response; // This is the expected outcome
      }
      throw error;
    }
  });
  
  // Test 11: Validation - Create with invalid type
  await runTest('Validation - Invalid Type', async () => {
    const client = createApiClient(config.endpoints.createTemplate);
    const invalidTemplate = {
      ...createTestTemplate(generateSessionId()),
      type: 'invalid-type',
    };
    
    try {
      await client.post('', invalidTemplate);
      throw new Error('Expected validation to fail, but it succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return error.response; // This is the expected outcome
      }
      throw error;
    }
  });
  
  // Test 12: Pagination
  await runTest('Pagination', async () => {
    const client = createApiClient(config.endpoints.listTemplates);
    // First page
    const firstPage = await client.get('?limit=2');
    
    if (firstPage.status !== 200 || !firstPage.data.pagination) {
      throw new Error('Failed to get first page');
    }
    
    if (!firstPage.data.pagination.nextStartAfter) {
      return firstPage; // Not enough data for pagination test
    }
    
    // Second page using startAfter
    const secondPage = await client.get(`?limit=2&startAfter=${firstPage.data.pagination.nextStartAfter}`);
    
    if (secondPage.status !== 200 || !secondPage.data.pagination) {
      throw new Error('Failed to get second page');
    }
    
    // Ensure the pages have different data
    const firstPageIds = firstPage.data.templates.map(t => t.id);
    const secondPageIds = secondPage.data.templates.map(t => t.id);
    const hasOverlap = firstPageIds.some(id => secondPageIds.includes(id));
    
    if (hasOverlap) {
      throw new Error('Pagination failed: pages contain overlapping data');
    }
    
    return secondPage;
  });
  
  // Test 13: Delete template
  if (createdTemplateId) {
    await runTest('Delete Template', async () => {
      const client = createApiClient(`${config.endpoints.templates}/${createdTemplateId}`);
      const response = await client.delete('');
      
      if (response.status !== 200 || response.data.id !== createdTemplateId) {
        throw new Error('Failed to delete template');
      }
      
      return response;
    });
  } else {
    skipTest('Delete Template', 'No template ID available');
  }
  
  // Test 14: Verify deletion
  if (createdTemplateId) {
    await runTest('Verify Deletion', async () => {
      const client = createApiClient(config.endpoints.getTemplate);
      try {
        await client.get(`?id=${createdTemplateId}`);
        throw new Error('Expected 404 after deletion, but template still exists');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return error.response; // This is the expected outcome
        }
        throw error;
      }
    });
  } else {
    skipTest('Verify Deletion', 'No template ID available');
  }
  
  // Test 15: Sharding strategy verification (create multiple templates and verify distribution)
  await runTest('Sharding Strategy Verification', async () => {
    const createClient = createApiClient(config.endpoints.createTemplate);
    const listClient = createApiClient(config.endpoints.listTemplates);
    const numTemplates = 5; // Create multiple templates to test sharding
    const templates = [];
    
    // Create multiple templates
    for (let i = 0; i < numTemplates; i++) {
      const template = createTestTemplate(generateSessionId(), 'handoff');
      const response = await createClient.post('', template);
      templates.push(response.data);
    }
    
    // Get all templates
    const response = await listClient.get('?limit=30');
    
    // Check for created templates and verify they have different shards
    const createdTemplateIds = templates.map(t => t.id);
    const retrievedTemplates = response.data.templates.filter(t => 
      createdTemplateIds.includes(t.id)
    );
    
    // Count the number of distinct shards
    const shards = new Set(retrievedTemplates.map(t => t.shard));
    
    // Clean up - delete the created templates
    for (const template of templates) {
      const deleteClient = createApiClient(`${config.endpoints.templates}/${template.id}`);
      await deleteClient.delete('');
    }
    
    if (shards.size <= 1 && numTemplates >= 3) {
      throw new Error('Sharding strategy may not be working correctly: all templates have the same shard');
    }
    
    return {
      status: 200,
      data: {
        numTemplates,
        shards: Array.from(shards),
        shardDistribution: Array.from(shards).map(shard => ({
          shard,
          count: retrievedTemplates.filter(t => t.shard === shard).length
        }))
      }
    };
  });
  
  // Print summary and save results
  printSummary();
  saveTestResults();
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.bold('\nTemplate Exchange API Testing\n'));
  
  // Check if API key is provided
  if (!config.apiKey) {
    config.apiKey = prompt('Enter your API key: ');
    if (!config.apiKey) {
      console.log(chalk.red('API key is required for testing'));
      process.exit(1);
    }
  }
  
  // Check if API URL is provided
  if (config.apiBaseUrl === 'http://localhost:5001/your-project-id/us-central1') {
    const customUrl = prompt(`Enter API URL [${config.apiBaseUrl}]: `);
    if (customUrl) {
      config.apiBaseUrl = customUrl;
    }
  }
  
  console.log(chalk.cyan(`API URL: ${config.apiBaseUrl}`));
  console.log(chalk.cyan(`API Key: ${config.apiKey.substring(0, 4)}...${config.apiKey.substring(config.apiKey.length - 4)}`));
  
  const confirm = prompt('Start API testing? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(chalk.yellow('Testing cancelled'));
    process.exit(0);
  }
  
  try {
    await runAllTests();
  } catch (error) {
    console.error(chalk.red(`\nTest execution failed: ${error.message}`));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Unexpected error: ${error.message}`));
  process.exit(1);
}); 