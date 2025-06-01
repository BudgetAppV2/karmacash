#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
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

function parseMarkdownToChunks(content) {
  const lines = content.split('\n');
  const chunks = [];
  let currentChunk = null;
  let chunkId = 0;
  let currentH1 = '';
  let currentH2 = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('# ')) {
      currentH1 = line.substring(2).trim();
    } else if (line.startsWith('## ')) {
      // Save previous chunk if exists
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // Start new chunk
      chunkId++;
      currentH2 = line.substring(3).trim();
      currentChunk = {
        chunk_id: `B2.1-${String(chunkId).padStart(3, '0')}`,
        original_document_id: 'B2.1_Design_Philosophy',
        parent_headings: [currentH1, currentH2],
        content_markdown: line + '\n',
        content_text: currentH2 + '\n',
        chunk_type: 'section',
        generation_date: new Date().toISOString()
      };
    } else if (line.startsWith('### ')) {
      if (currentChunk) {
        currentChunk.chunk_type = 'subsection';
        currentChunk.content_markdown += line + '\n';
        currentChunk.content_text += line.substring(4).trim() + '\n';
      }
    } else if (currentChunk) {
      currentChunk.content_markdown += line + '\n';
      currentChunk.content_text += line.replace(/[*_`\[\]]/g, '') + '\n';
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

async function uploadChunks() {
  try {
    // Read the original content
    const content = readFileSync(path.join(__dirname, '../test-data/B2.1_Design_Philosophy.md'), 'utf8');
    
    // Parse into chunks
    const chunks = parseMarkdownToChunks(content);
    
    console.log(`Generated ${chunks.length} chunks`);
    
    // Create local directory for chunks
    const localChunksDir = path.join(__dirname, '../chunks/B2.1_Design_Philosophy');
    mkdirSync(localChunksDir, { recursive: true });
    
    // Upload each chunk
    for (const chunk of chunks) {
      const fileName = `${chunk.chunk_id}.json`;
      const localPath = path.join(localChunksDir, fileName);
      const storagePath = `bible/sections/b2/chunks/B2.1_Design_Philosophy/${fileName}`;
      
      // Save locally first
      writeFileSync(localPath, JSON.stringify(chunk, null, 2));
      
      // Upload to Firebase Storage
      const file = bucket.file(storagePath);
      await file.save(JSON.stringify(chunk, null, 2), {
        metadata: {
          contentType: 'application/json'
        }
      });
      
      console.log(`✓ Uploaded chunk: ${chunk.chunk_id}`);
    }
    
    console.log(`\n✓ Successfully uploaded ${chunks.length} chunks to Firebase Storage`);
    
    // Return chunk IDs for metadata update
    return chunks.map(c => c.chunk_id);
    
  } catch (error) {
    console.error('Error creating chunks:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadChunks()
    .then(chunkIds => {
      console.log('\nChunk IDs:', chunkIds);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}