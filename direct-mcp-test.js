/**
 * Direct test of Bible Access Module
 * This bypasses MCP tools and tests the module logic directly
 * Updated for ES modules
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock MCP tools for testing
global.storage_list_files = async (params) => {
  console.log('🔧 Mock storage_list_files called with:', params);
  return {
    files: [
      {
        name: "bible/sections/b1/raw/b1.1_project_vision_goals.md",
        size: "5037",
        contentType: "text/markdown"
      }
    ]
  };
};

global.storage_get_file_info = async (params) => {
  console.log('🔧 Mock storage_get_file_info called with:', params);
  return {
    name: params.filePath,
    downloadUrl: "https://example.com/mock-url",
    size: "5037",
    contentType: "text/markdown"
  };
};

global.firestore_list_documents = async (params) => {
  console.log('🔧 Mock firestore_list_documents called with:', params);
  return {
    documents: [
      {
        id: "test-ref",
        data: {
          source_document_id: "B1.1",
          target_document_id: "B1.2",
          reference_type: "explicit_link"
        }
      }
    ]
  };
};

// Mock fetch for testing
global.fetch = async (url) => {
  console.log('🔧 Mock fetch called with:', url);
  if (url.includes('mock-url')) {
    return {
      ok: true,
      json: async () => ({
        document_id: "B1.1",
        title: "Project Vision & Goals",
        sections: [
          {
            section_id: "B1.1-vision_statement",
            heading: "Vision Statement",
            text_content: "KarmaCash aims to create..."
          }
        ]
      }),
      text: async () => "# Project Vision & Goals\n\nKarmaCash aims to create..."
    };
  }
  throw new Error('Mock fetch: URL not recognized');
};

async function testBibleModule() {
  console.log('🧪 Testing Bible Access Module with Mock MCP Tools\n');
  
  try {
    // Load the module (ES module import)
    const module = await import('./modules/bible-access/bible-access-module.js');
    const { BibleAccessModule } = module;
    console.log('✅ Module loaded successfully');
    
    // Create instance
    const bibleModule = new BibleAccessModule();
    console.log('✅ Module instance created');
    
    // Test document retrieval
    console.log('\n📖 Testing document retrieval...');
    const document = await bibleModule.getDocument('B1.1');
    console.log('✅ Document retrieved!');
    console.log('   Title:', document.title);
    console.log('   Sections:', document.sections?.length || 0);
    
    // Test cross-references
    console.log('\n🔗 Testing cross-references...');
    const crossRefs = await bibleModule.getCrossReferences('B1.1');
    console.log('✅ Cross-references retrieved!');
    console.log('   Found:', crossRefs.length, 'references');
    
    // Test performance metrics
    console.log('\n📊 Testing performance metrics...');
    const metrics = bibleModule.getMetrics();
    console.log('✅ Metrics retrieved!');
    console.log('   Documents retrieved:', metrics.module.documentsRetrieved);
    console.log('   Cache efficiency:', metrics.module.cacheEfficiency.toFixed(2) + '%');
    
    console.log('\n🎉 All tests passed! Bible Access Module logic is working correctly.');
    console.log('\n💡 Next step: Test with real MCP server in your MCP client environment.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testBibleModule();