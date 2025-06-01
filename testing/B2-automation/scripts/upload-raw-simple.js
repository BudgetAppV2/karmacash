#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '../../../config/serviceAccountKey.json'), 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'karmacash-6e8f5.firebasestorage.app'
});

const bucket = getStorage().bucket();

async function uploadFile(localPath, section) {
  try {
    const fileName = path.basename(localPath);
    const storagePath = `bible/sections/${section}/raw/${fileName}`;
    
    // Read file and generate metadata
    const fileContent = readFileSync(localPath, 'utf8');
    const stats = statSync(localPath);
    const contentHash = crypto.createHash('md5').update(fileContent).digest('hex');
    
    const metadata = {
      originalName: fileName,
      section: section,
      subsection: fileName.replace('.md', '').toLowerCase(),
      uploadDate: new Date().toISOString(),
      fileSize: stats.size,
      contentHash: contentHash,
      mimeType: 'text/markdown',
      processingStage: 'raw',
      b1Reference: true
    };

    console.log(`Uploading ${fileName} to ${storagePath}...`);
    
    const file = bucket.file(storagePath);
    
    await file.save(fileContent, {
      metadata: {
        metadata: metadata,
        contentType: 'text/markdown'
      }
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2030'
    });

    console.log(`✓ Upload complete: ${fileName}`);
    
    const result = {
      success: true,
      storagePath,
      downloadUrl: url,
      metadata,
      fileName
    };
    
    console.log('\nUpload result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error(`✗ Upload failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node upload-raw-simple.js <file-path> <section>');
  console.log('Example: node upload-raw-simple.js ../test-data/B2.1_Design_Philosophy.md b2');
  process.exit(1);
}

const [filePath, section] = args;

uploadFile(filePath, section)
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Upload error:', error);
    process.exit(1);
  });