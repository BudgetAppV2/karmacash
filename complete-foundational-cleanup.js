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

async function analyzeAndCleanFoundationalSections() {
  console.log('🔍 Analyzing all foundational sections (B1-B8)...\n');
  
  // Check each section
  const sections = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
  const analysisResults = {};
  
  for (const section of sections) {
    console.log(`📁 Section ${section.toUpperCase()}:`);
    analysisResults[section] = await analyzeSection(section);
    console.log('');
  }
  
  // Generate cleanup plan
  console.log('📋 CLEANUP PLAN:\n');
  await generateCleanupPlan(analysisResults);
  
  return analysisResults;
}

async function analyzeSection(section) {
  const [files] = await bucket.getFiles({
    prefix: `bible/sections/${section}/optimized/`
  });
  
  const analysis = {
    optimizedFiles: [],
    automationFiles: [],
    fallbackFiles: [],
    inconsistentFiles: [],
    sectionDocuments: new Set()
  };
  
  for (const file of files) {
    const fileName = file.name.split('/').pop();
    const [metadata] = await file.getMetadata();
    const fileInfo = {
      name: fileName,
      path: file.name,
      size: parseInt(metadata.size),
      updated: metadata.updated
    };
    
    // Categorize files
    if (fileName.match(/^[A-Z]\d+\.\d+_[A-Za-z_]+\.optimized\.json$/)) {
      // Automation pattern: B2.1_Design_Philosophy.optimized.json
      analysis.automationFiles.push(fileInfo);
      const docId = fileName.match(/^([A-Z]\d+\.\d+)/)[1];
      analysis.sectionDocuments.add(docId.toLowerCase());
    } else if (fileName.match(/^[a-z]\d+\.\d+_document\.optimized\.json$/)) {
      // Fallback pattern: b2.1_document.optimized.json  
      analysis.fallbackFiles.push(fileInfo);
    } else if (fileName.match(/^[a-z]\d+\.\d+_[a-z_]+\.optimized\.json$/)) {
      // FileMap pattern: b2.1_design_philosophy.optimized.json
      analysis.inconsistentFiles.push(fileInfo);
    } else {
      // Other patterns
      analysis.inconsistentFiles.push(fileInfo);
    }
    
    analysis.optimizedFiles.push(fileInfo);
  }
  
  // Analysis summary
  console.log(`   📄 Total files: ${analysis.optimizedFiles.length}`);
  console.log(`   🤖 Automation files: ${analysis.automationFiles.length} (${analysis.automationFiles.reduce((sum, f) => sum + f.size, 0)} bytes)`);
  console.log(`   📋 Fallback files: ${analysis.fallbackFiles.length} (${analysis.fallbackFiles.reduce((sum, f) => sum + f.size, 0)} bytes)`);
  console.log(`   ❓ Inconsistent files: ${analysis.inconsistentFiles.length}`);
  console.log(`   📑 Documents: ${Array.from(analysis.sectionDocuments).join(', ')}`);
  
  return analysis;
}

async function generateCleanupPlan(analysisResults) {
  for (const [section, analysis] of Object.entries(analysisResults)) {
    if (analysis.automationFiles.length === 0 && analysis.fallbackFiles.length === 0) {
      console.log(`❌ ${section.toUpperCase()}: NO FILES - needs automation script execution`);
      continue;
    }
    
    if (analysis.automationFiles.length > 0 && analysis.fallbackFiles.length === 0) {
      console.log(`⚡ ${section.toUpperCase()}: HAS AUTOMATION - needs fallback creation`);
      await createFallbackFiles(section, analysis.automationFiles);
      continue;
    }
    
    if (analysis.automationFiles.length > 0 && analysis.fallbackFiles.length > 0) {
      console.log(`🔄 ${section.toUpperCase()}: HAS BOTH - needs verification and cleanup`);
      await verifyAndCleanupSection(section, analysis);
      continue;
    }
    
    if (analysis.automationFiles.length === 0 && analysis.fallbackFiles.length > 0) {
      console.log(`⚠️  ${section.toUpperCase()}: ONLY FALLBACKS - may need automation regeneration`);
      continue;
    }
    
    if (analysis.inconsistentFiles.length > 0) {
      console.log(`🧹 ${section.toUpperCase()}: HAS INCONSISTENT FILES - needs cleanup`);
      await cleanupInconsistentFiles(section, analysis.inconsistentFiles);
    }
  }
}

async function createFallbackFiles(section, automationFiles) {
  console.log(`   📋 Creating fallback files for ${section.toUpperCase()}...`);
  
  for (const autoFile of automationFiles) {
    try {
      // Extract document ID (B2.1 from B2.1_Design_Philosophy.optimized.json)
      const match = autoFile.name.match(/^([A-Z]\d+\.\d+)/);
      if (!match) continue;
      
      const docId = match[1].toLowerCase(); // b2.1
      const fallbackName = `${docId}_document.optimized.json`;
      
      // Copy content from automation file to fallback
      const sourceFile = bucket.file(autoFile.path);
      const [content] = await sourceFile.download();
      
      const targetPath = `bible/sections/${section}/optimized/${fallbackName}`;
      const targetFile = bucket.file(targetPath);
      await targetFile.save(content, {
        metadata: { contentType: 'application/json' }
      });
      
      console.log(`     ✅ Created: ${fallbackName} (${content.length} bytes)`);
    } catch (error) {
      console.log(`     ❌ Failed: ${autoFile.name} - ${error.message}`);
    }
  }
}

async function verifyAndCleanupSection(section, analysis) {
  console.log(`   🔍 Verifying ${section.toUpperCase()} files...`);
  
  // Check if fallback files have the right content (match automation size approximately)
  for (const fallbackFile of analysis.fallbackFiles) {
    const docMatch = fallbackFile.name.match(/^([a-z]\d+\.\d+)_document/);
    if (!docMatch) continue;
    
    const docId = docMatch[1];
    const correspondingAuto = analysis.automationFiles.find(auto => 
      auto.name.toLowerCase().startsWith(docId.replace('.', '.')));
    
    if (correspondingAuto) {
      const sizeDiff = Math.abs(fallbackFile.size - correspondingAuto.size);
      const sizeRatio = sizeDiff / correspondingAuto.size;
      
      if (sizeRatio > 0.1) { // More than 10% size difference
        console.log(`     ⚠️  Size mismatch: ${fallbackFile.name} (${fallbackFile.size}b) vs ${correspondingAuto.name} (${correspondingAuto.size}b)`);
        // Recreate fallback with correct content
        await recreateFallbackFile(section, correspondingAuto, docId);
      } else {
        console.log(`     ✅ Good: ${fallbackFile.name} matches ${correspondingAuto.name}`);
      }
    }
  }
  
  // Clean up inconsistent files
  if (analysis.inconsistentFiles.length > 0) {
    await cleanupInconsistentFiles(section, analysis.inconsistentFiles);
  }
}

async function recreateFallbackFile(section, automationFile, docId) {
  try {
    const fallbackName = `${docId}_document.optimized.json`;
    
    const sourceFile = bucket.file(automationFile.path);
    const [content] = await sourceFile.download();
    
    const targetPath = `bible/sections/${section}/optimized/${fallbackName}`;
    const targetFile = bucket.file(targetPath);
    await targetFile.save(content, {
      metadata: { contentType: 'application/json' }
    });
    
    console.log(`     🔄 Recreated: ${fallbackName} (${content.length} bytes)`);
  } catch (error) {
    console.log(`     ❌ Failed to recreate: ${docId} - ${error.message}`);
  }
}

async function cleanupInconsistentFiles(section, inconsistentFiles) {
  console.log(`   🗑️  Cleaning up ${inconsistentFiles.length} inconsistent files in ${section.toUpperCase()}...`);
  
  for (const file of inconsistentFiles) {
    try {
      const fileObj = bucket.file(file.path);
      await fileObj.delete();
      console.log(`     ❌ Deleted: ${file.name}`);
    } catch (error) {
      console.log(`     ⚠️  Could not delete ${file.name}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive foundational sections analysis and cleanup...\n');
    const results = await analyzeAndCleanFoundationalSections();
    console.log('\n✅ Analysis and cleanup complete!');
    
    // Summary
    console.log('\n📊 FINAL SUMMARY:');
    for (const [section, analysis] of Object.entries(results)) {
      const status = analysis.automationFiles.length > 0 ? '✅' : '❌';
      console.log(`   ${status} ${section.toUpperCase()}: ${analysis.automationFiles.length} automation files, ${analysis.fallbackFiles.length} fallback files`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();