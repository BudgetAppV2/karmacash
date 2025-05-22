#!/usr/bin/env node

/**
 * Test Real API Connection
 * 
 * This script tests the Template Exchange System with real Firebase API connection.
 * It does not use mock mode and verifies that the actual API is working.
 */

const commands = require('./cursor-ai-commands');

async function testRealApiConnection() {
  console.log('Testing Template Exchange System with real Firebase API connection...');
  console.log('==================================================================');
  
  try {
    // Step 1: Check system health
    console.log('\n1. Checking system health...');
    const health = await commands.checkHealth();
    console.log('System health:', health ? 'OK' : 'Failed');
    
    if (!health) {
      throw new Error('Health check failed. Cannot proceed with tests.');
    }
    
    // Step 2: List templates to verify API connection
    console.log('\n2. Listing templates...');
    const templates = await commands.listTemplates();
    console.log(`Found ${templates.length} templates.`);
    
    if (templates.length === 0) {
      console.log('No templates found in the database.');
    } else {
      console.log('Template IDs:');
      templates.forEach(template => {
        console.log(`  - ${template.sessionId} (${template.type}): ${template.id}`);
      });
    }
    
    // Step 3: Fetch M7.S6 handoff template that we created
    console.log('\n3. Fetching M7.S6 handoff template...');
    try {
      const handoff = await commands.fetchHandoff('M7.S6');
      console.log('Successfully retrieved M7.S6 handoff template:');
      console.log('--------------------------------------------------');
      console.log(handoff);
      console.log('--------------------------------------------------');
    } catch (error) {
      console.error('Error fetching M7.S6 handoff template:', error.message);
      throw error;
    }
    
    // Step 4: Create a new test template
    const testSessionId = 'M7.S' + Math.floor(Math.random() * 100);
    console.log(`\n4. Creating a new test template (${testSessionId})...`);
    try {
      const content = `# Test Template\nThis is a test template created at ${new Date().toISOString()}\n\n- Test item 1\n- Test item 2\n- Test item 3`;
      const result = await commands.submitSummary(testSessionId, content);
      console.log('Successfully created test template:');
      console.log('--------------------------------------------------');
      console.log('ID:', result.id);
      console.log('Session ID:', result.sessionId);
      console.log('Type:', result.type);
      console.log('--------------------------------------------------');
      
      // Step 5: Verify we can retrieve the newly created template
      console.log(`\n5. Verifying new template retrieval...`);
      const templates = await commands.listTemplates();
      const found = templates.some(t => t.sessionId === testSessionId);
      
      if (found) {
        console.log('√ Test template found in list of templates.');
      } else {
        console.error('X Test template NOT found in list of templates.');
        throw new Error('Template creation verification failed.');
      }
    } catch (error) {
      console.error('Error creating test template:', error.message);
      throw error;
    }
    
    console.log('\n==================================================================');
    console.log('ALL TESTS PASSED! Template Exchange System is working with real Firebase API!');
    console.log('==================================================================');
    
  } catch (error) {
    console.error('\n==================================================================');
    console.error('TEST FAILED:', error.message);
    console.error('==================================================================');
    process.exit(1);
  }
}

// Run the tests
testRealApiConnection(); 