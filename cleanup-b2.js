#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, 'config/serviceAccountKey.json'), 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'karmacash-6e8f5.firebasestorage.app'
});

const bucket = getStorage().bucket();

async function cleanupB2Files() {
  console.log('🧹 Cleaning up B2 optimized files...\n');
  
  // Files to keep (the good automation output)
  const keepFiles = [
    'bible/sections/b2/optimized/B2.1_Design_Philosophy.optimized.json',
    'bible/sections/b2/optimized/B2.2_Technical_Standards.optimized.json', 
    'bible/sections/b2/optimized/B2.3_Date_Handling_Guide.optimized.json',
    'bible/sections/b2/optimized/B2.4_Error_Handling_Strategy.optimized.json',
    'bible/sections/b2/optimized/B2.5_Code_Project_Structure.optimized.json'
  ];
  
  // Get all files in optimized directory
  const [files] = await bucket.getFiles({
    prefix: 'bible/sections/b2/optimized/'
  });
  
  console.log('🗑️ Processing files:');
  for (const file of files) {
    if (!keepFiles.includes(file.name)) {
      await file.delete();
      console.log('   ❌ Deleted:', file.name);
    } else {
      console.log('   ✅ Keeping:', file.name);
    }
  }
  
  console.log('\n📋 Creating clean fallback naming for Bible Access Module...');
  
  // Create proper fallback files from the good automation content
  const mappings = [
    { source: 'B2.1_Design_Philosophy.optimized.json', target: 'b2.1_document.optimized.json' },
    { source: 'B2.2_Technical_Standards.optimized.json', target: 'b2.2_document.optimized.json' },
    { source: 'B2.3_Date_Handling_Guide.optimized.json', target: 'b2.3_document.optimized.json' },
    { source: 'B2.4_Error_Handling_Strategy.optimized.json', target: 'b2.4_document.optimized.json' },
    { source: 'B2.5_Code_Project_Structure.optimized.json', target: 'b2.5_document.optimized.json' }
  ];
  
  for (const mapping of mappings) {
    const sourceFile = bucket.file('bible/sections/b2/optimized/' + mapping.source);
    const [content] = await sourceFile.download();
    
    const targetFile = bucket.file('bible/sections/b2/optimized/' + mapping.target);
    await targetFile.save(content, {
      metadata: { contentType: 'application/json' }
    });
    
    console.log('   📄 Created fallback:', mapping.target, '(' + content.length + ' bytes)');
  }
  
  console.log('\n✅ Cleanup complete! B2 files are now organized:');
  console.log('   - Original automation files (B2.X_Name.optimized.json) - preserved');
  console.log('   - Bible Access Module files (b2.x_document.optimized.json) - created from originals');
  console.log('   - All inconsistent/duplicate files - removed');
}

async function main() {
  try {
    await cleanupB2Files();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();