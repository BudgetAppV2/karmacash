/**
 * Test file for Bible Access Module
 * Run with: node test-bible-module.js
 */

async function runBasicTest() {
  console.log('🧪 Testing Bible Access Module...\n');
  
  try {
    // Test 1: Try to load the module
    console.log('Test 1: Loading Bible Access Module...');
    const { BibleAccessModule } = require('./modules/bible-access/bible-access-module');
    console.log('✅ Module loaded successfully');
    
    // Test 2: Create module instance
    console.log('\nTest 2: Creating module instance...');
    const bibleModule = new BibleAccessModule();
    console.log('✅ Module instance created');
    
    // Test 3: Test MCP tools are available
    console.log('\nTest 3: Testing MCP tool availability...');
    
    // Check if MCP tools are available globally
    if (typeof storage_list_files === 'function') {
      console.log('✅ storage_list_files is available');
    } else {
      console.log('❌ storage_list_files not found - MCP server may not be running');
      return;
    }
    
    // Test 4: Try to retrieve a document
    console.log('\nTest 4: Testing document retrieval...');
    try {
      const document = await bibleModule.getDocument('B1.1');
      console.log('✅ Document retrieved successfully!');
      console.log('   Title:', document.title || document.document_id);
      console.log('   Sections:', document.sections?.length || 0);
    } catch (error) {
      console.log('❌ Document retrieval failed:', error.message);
    }
    
    // Test 5: Performance metrics
    console.log('\nTest 5: Testing performance metrics...');
    const metrics = bibleModule.getMetrics();
    console.log('✅ Metrics retrieved');
    console.log('   Module stats:', metrics.module);
    console.log('   MCP client stats:', metrics.mcpClient);
    
    console.log('\n🎉 Basic tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Simple MCP availability check first
function checkMCPAvailability() {
  console.log('🔍 Checking MCP tool availability...');
  
  const requiredTools = [
    'storage_list_files',
    'storage_get_file_info', 
    'firestore_list_documents'
  ];
  
  let availableTools = 0;
  
  requiredTools.forEach(tool => {
    if (typeof global[tool] === 'function') {
      console.log(`✅ ${tool} - Available`);
      availableTools++;
    } else {
      console.log(`❌ ${tool} - Not found`);
    }
  });
  
  console.log(`\n📊 MCP Tools: ${availableTools}/${requiredTools.length} available\n`);
  
  if (availableTools === 0) {
    console.log('⚠️  No MCP tools found. Make sure your MCP server is running.');
    console.log('   Try running this test in an environment where MCP tools are available.');
    return false;
  }
  
  return availableTools > 0;
}

// Run the tests
async function main() {
  console.log('🚀 Starting Bible Access Module Test Suite\n');
  
  // First check if MCP tools are available
  const mcpAvailable = checkMCPAvailability();
  
  if (mcpAvailable) {
    await runBasicTest();
  } else {
    console.log('\n💡 To test with MCP tools:');
    console.log('   1. Make sure your @gannonh/firebase-mcp server is running');
    console.log('   2. Run this test in an environment where MCP tools are globally available');
    console.log('   3. Or test directly through your MCP client interface');
  }
}

main().catch(console.error);