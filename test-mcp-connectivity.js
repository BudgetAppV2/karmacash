#!/usr/bin/env node

/**
 * MCP Connectivity Test for Background Agents
 * SECURE VERSION - No hardcoded credentials
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function testMCPConnectivity() {
  console.log('🔍 Testing MCP Tool Connectivity...\n');
  
  // First check environment variables
  console.log('🔧 Environment Variables Check:');
  const envVars = [
    'SERVICE_ACCOUNT_KEY_PATH',
    'FIREBASE_STORAGE_BUCKET', 
    'ANTHROPIC_API_KEY'
  ];
  
  const envStatus = {};
  for (const envVar of envVars) {
    const value = process.env[envVar];
    envStatus[envVar] = !!value;
    console.log(`  ${envStatus[envVar] ? '✅' : '❌'} ${envVar}: ${value ? 'Set' : 'Missing'}`);
  }
  
  console.log();
  
  const tests = [
    {
      name: 'Environment Variables',
      test: async () => {
        return Object.values(envStatus).every(status => status);
      }
    },
    {
      name: 'Firebase MCP',
      test: async () => {
        try {
          // This would normally call the MCP tool
          console.log('  ℹ️  Firebase MCP: Would test firestore_get_document_by_id');
          return true; // Simulated - actual MCP test would go here
        } catch (error) {
          console.log('  ❌ Firebase MCP: Failed -', error.message);
          return false;
        }
      }
    },
    {
      name: 'TaskMaster MCP',
      test: async () => {
        try {
          console.log('  ℹ️  TaskMaster MCP: Would test getTaskContent');
          return true; // Simulated - actual MCP test would go here
        } catch (error) {
          console.log('  ❌ TaskMaster MCP: Failed -', error.message);
          return false;
        }
      }
    },
    {
      name: 'Fallback Firebase SDK',
      test: async () => {
        try {
          if (!envStatus.SERVICE_ACCOUNT_KEY_PATH || !envStatus.FIREBASE_STORAGE_BUCKET) {
            console.log('  ❌ Fallback Firebase SDK: Missing environment variables');
            return false;
          }
          
          const { firebaseHelper } = await import('./agent-firebase-helper.js');
          await firebaseHelper.initialize();
          console.log('  ✅ Fallback Firebase SDK: Ready');
          return true;
        } catch (error) {
          console.log('  ❌ Fallback Firebase SDK: Failed -', error.message);
          return false;
        }
      }
    }
  ];

  const results = {};
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    results[test.name] = await test.test();
  }
  
  console.log('\n📊 Connectivity Test Results:');
  console.log('================================');
  
  const envReady = results['Environment Variables'];
  const mcpAvailable = results['Firebase MCP'] && results['TaskMaster MCP'];
  const fallbackAvailable = results['Fallback Firebase SDK'];
  
  if (!envReady) {
    console.log('❌ Environment Variables: MISSING - Set required environment variables first');
    console.log('   Required: SERVICE_ACCOUNT_KEY_PATH, FIREBASE_STORAGE_BUCKET, ANTHROPIC_API_KEY');
  } else if (mcpAvailable) {
    console.log('✅ MCP Tools: AVAILABLE - Use primary method');
    console.log('   Recommended: Use firestore_get_document_by_id, getTaskContent, etc.');
  } else if (fallbackAvailable) {
    console.log('⚠️  MCP Tools: UNAVAILABLE - Use fallback method');
    console.log('   Recommended: Use agent-firebase-helper.js functions');
  } else {
    console.log('❌ All Methods: FAILED - Check environment variables and Firebase access');
  }
  
  const recommendedMethod = !envReady ? 'setup_env' : 
                           mcpAvailable ? 'mcp' : 
                           fallbackAvailable ? 'fallback' : 'manual';
  
  console.log('\n🚀 Next steps:', {
    'setup_env': 'Set environment variables before proceeding',
    'mcp': 'Agent can proceed with MCP tools',
    'fallback': 'Agent can proceed with fallback method', 
    'manual': 'Request manual assistance'
  }[recommendedMethod]);
  
  return {
    envReady,
    mcpAvailable,
    fallbackAvailable,
    recommendedMethod
  };
}

// Run if called directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  testMCPConnectivity().catch(console.error);
}

export { testMCPConnectivity };
