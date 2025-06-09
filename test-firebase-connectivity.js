#!/usr/bin/env node

const { getDocument, getTaskContent, firebaseHelper } = require('./agent-firebase-helper.js');

async function testFirebaseConnectivity() {
  console.log('🔍 Testing Firebase Helper Connectivity...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('1. Environment Variables:');
    console.log(`   SERVICE_ACCOUNT_KEY_PATH: ${process.env.SERVICE_ACCOUNT_KEY_PATH ? '✅ Set' : '❌ Missing'}`);
    console.log(`   FIREBASE_STORAGE_BUCKET: ${process.env.FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}\n`);
    
    // Test 2: Test getDocument function
    console.log('2. Testing getDocument function...');
    const doc1 = await getDocument('ck_continuity', 'current-continuity-pointer');
    console.log('   Result:', JSON.stringify(doc1, null, 2));
    console.log('   ✅ getDocument function works\n');
    
    // Test 3: Test getTaskContent function
    console.log('3. Testing getTaskContent function...');
    const task = await getTaskContent('test_t1.1_safe_card_component');
    console.log('   Result:', JSON.stringify(task, null, 2));
    console.log('   ✅ getTaskContent function works\n');
    
    console.log('🎉 All Firebase helper tests passed!');
    console.log('📊 Status: Firebase Helper is working correctly');
    
  } catch (error) {
    console.error('❌ Firebase helper test failed:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    console.log('\n📊 Status: Firebase Helper failed - MCP tools would be preferred if available');
  }
}

// Run the test
if (require.main === module) {
  testFirebaseConnectivity();
}

module.exports = { testFirebaseConnectivity };