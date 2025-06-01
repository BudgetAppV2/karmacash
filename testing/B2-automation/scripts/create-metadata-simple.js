#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '../../../config/serviceAccountKey.json'), 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function createMetadata(uploadResultPath) {
  try {
    // Read the upload result
    const uploadResultContent = readFileSync(uploadResultPath, 'utf8');
    // Extract just the JSON part (skip the console logs)
    const jsonMatch = uploadResultContent.match(/Upload result: ({[\s\S]*})/);
    if (!jsonMatch) {
      throw new Error('Could not parse upload result JSON');
    }
    
    const uploadResult = JSON.parse(jsonMatch[1]);
    
    if (!uploadResult.success) {
      throw new Error('Upload was not successful');
    }

    // Read the original file to get additional metrics
    const originalFilePath = path.join(__dirname, '../test-data', uploadResult.fileName);
    const fileContent = readFileSync(originalFilePath, 'utf8');
    
    const additionalInfo = {
      characterCount: fileContent.length,
      lineCount: fileContent.split('\n').length,
      wordCount: fileContent.split(/\s+/).filter(word => word.length > 0).length,
      tags: ['design', 'philosophy', 'zen', 'tranquility'],
      keywords: ['japandi', 'mindfulness', 'clarity', 'minimalist'],
      automationType: 'manual'
    };

    // Generate metadata structure
    const timestamp = new Date();
    const metadata = {
      // Core identification
      id: `${uploadResult.metadata.section}_${uploadResult.metadata.subsection}`,
      section: uploadResult.metadata.section,
      subsection: uploadResult.metadata.subsection,
      fileName: uploadResult.fileName,
      
      // Storage references
      storagePath: uploadResult.storagePath,
      downloadUrl: uploadResult.downloadUrl,
      contentHash: uploadResult.metadata.contentHash,
      
      // Processing metadata
      processingStatus: {
        raw: {
          completed: true,
          timestamp: timestamp,
          path: uploadResult.storagePath
        },
        analysis: {
          completed: false,
          timestamp: null,
          path: null
        },
        chunks: {
          completed: false,
          timestamp: null,
          count: 0,
          paths: []
        },
        optimized: {
          completed: false,
          timestamp: null,
          path: null
        },
        crossReferences: {
          completed: false,
          timestamp: null,
          count: 0
        }
      },
      
      // Content metadata
      contentMetadata: {
        fileSize: uploadResult.metadata.fileSize,
        mimeType: uploadResult.metadata.mimeType,
        lastModified: timestamp,
        characterCount: additionalInfo.characterCount,
        lineCount: additionalInfo.lineCount,
        wordCount: additionalInfo.wordCount
      },
      
      // B1 methodology reference
      methodology: {
        version: 'B1-v1.0',
        steps: ['raw', 'metadata', 'analysis', 'chunking', 'optimization', 'cross-reference'],
        qualityBaseline: 'B1-standards'
      },
      
      // Timestamps
      createdAt: timestamp,
      updatedAt: timestamp,
      
      // Additional context
      tags: additionalInfo.tags,
      keywords: additionalInfo.keywords,
      automationType: additionalInfo.automationType
    };

    console.log(`Creating metadata for ${metadata.id}...`);
    
    const docRef = db.collection('bible_storage_metadata').doc(metadata.id);
    await docRef.set(metadata);
    
    console.log(`✓ Metadata created: ${metadata.id}`);
    
    const result = {
      success: true,
      documentId: metadata.id,
      metadata: metadata
    };
    
    console.log('\nMetadata result:', JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error(`✗ Metadata creation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node create-metadata-simple.js <upload-result-file>');
  console.log('Example: node create-metadata-simple.js upload-result.json');
  process.exit(1);
}

const uploadResultPath = args[0];

createMetadata(uploadResultPath)
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Metadata error:', error);
    process.exit(1);
  });