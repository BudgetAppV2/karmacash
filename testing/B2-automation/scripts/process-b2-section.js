#!/usr/bin/env node

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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
const db = getFirestore();

// Process a single B2 document through all 6 steps
async function processB2Document(fileName) {
  console.log(`\n=== Processing ${fileName} ===\n`);
  
  const docId = fileName.replace('.md', '');
  const sectionId = docId.replace('_', '.');
  const subsection = sectionId;
  
  try {
    // Step 1: Raw Upload
    console.log('Step 1: Raw Upload');
    const uploadResult = await uploadRawFile(fileName);
    
    // Step 2: Firestore Metadata
    console.log('Step 2: Creating Firestore Metadata');
    await createFirestoreMetadata(docId, sectionId, uploadResult);
    
    // Step 3: Content Analysis
    console.log('Step 3: Generating Content Analysis');
    const analysis = await generateContentAnalysis(fileName, docId);
    
    // Step 4: Semantic Chunking
    console.log('Step 4: Creating Semantic Chunks');
    const chunkIds = await createSemanticChunks(fileName, docId);
    
    // Step 5: Optimized JSON
    console.log('Step 5: Building Optimized JSON');
    await createOptimizedJson(fileName, docId, analysis, chunkIds);
    
    // Step 6: Cross-Reference Mapping
    console.log('Step 6: Mapping Cross-References');
    const crossRefs = await mapCrossReferences(fileName, docId);
    
    // Update metadata with completion
    await updateMetadataCompletion(docId, chunkIds.length, crossRefs.length);
    
    console.log(`\n✓ Successfully processed ${fileName} through all 6 steps\n`);
    
    return {
      document: docId,
      chunks: chunkIds.length,
      crossReferences: crossRefs.length
    };
    
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    throw error;
  }
}

// Step 1: Upload raw file
async function uploadRawFile(fileName) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const stats = { size: content.length };
  const contentHash = crypto.createHash('md5').update(content).digest('hex');
  
  const storagePath = `bible/sections/b2/raw/${fileName}`;
  const file = bucket.file(storagePath);
  
  await file.save(content, {
    metadata: {
      contentType: 'text/markdown',
      metadata: {
        fileSize: stats.size,
        contentHash: contentHash,
        uploadDate: new Date().toISOString()
      }
    }
  });
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2030'
  });
  
  console.log(`  ✓ Uploaded to: ${storagePath}`);
  
  return {
    storagePath,
    downloadUrl: url,
    fileSize: stats.size,
    contentHash
  };
}

// Step 2: Create Firestore metadata
async function createFirestoreMetadata(docId, sectionId, uploadResult) {
  const metadata = {
    title: docId.replace(/_/g, ' ').replace('B2.', ''),
    document_id: docId,
    section_id: sectionId,
    section: 'B2',
    subsection: sectionId,
    raw_content_path_storage: uploadResult.storagePath,
    raw_content_type: 'text/markdown',
    status: 'raw_uploaded',
    last_raw_upload_date: new Date(),
    processing_tier: 1,
    related_sections: [],
    processing_status: 'processing',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection('bible_storage_metadata').doc(docId).set(metadata);
  console.log(`  ✓ Created metadata for ${docId}`);
}

// Step 3: Generate content analysis
async function generateContentAnalysis(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Count headers and structure
  let h1Count = 0, h2Count = 0, h3Count = 0;
  const h2Sections = [], h3Sections = [];
  const crossRefs = [];
  
  lines.forEach(line => {
    if (line.startsWith('# ')) h1Count++;
    else if (line.startsWith('## ')) {
      h2Count++;
      h2Sections.push(line.substring(3).trim());
    } else if (line.startsWith('### ')) {
      h3Count++;
      h3Sections.push(line.substring(4).trim());
    }
    
    // Find cross-references
    const refMatches = line.match(/\[B[\d.]+.*?\]/g);
    if (refMatches) {
      refMatches.forEach(ref => {
        crossRefs.push({
          reference: ref,
          context: line,
          location: h2Sections[h2Sections.length - 1] || 'Introduction'
        });
      });
    }
  });
  
  const analysis = {
    document_id: docId,
    analysis_date: new Date().toISOString(),
    structural_summary: `Document has ${h1Count} H1, ${h2Count} H2, and ${h3Count} H3 headers`,
    dominant_content_types: ['technical_documentation', 'standards', 'guidelines'],
    key_structural_patterns_observed: [
      `H1 -> H2 -> H3 hierarchy`,
      `${h2Count} main sections`,
      `Cross-references: ${crossRefs.length}`
    ],
    examples_of_key_entities: extractKeyEntities(content),
    potential_for_ai_optimization: 'High - structured technical content ideal for AI processing',
    notes_for_chunking: `Natural boundaries at ${h2Count} H2 sections`,
    cross_references_detected: crossRefs,
    metrics: {
      h1_count: h1Count,
      h2_count: h2Count,
      h3_count: h3Count,
      cross_references: crossRefs.length,
      word_count: content.split(/\s+/).filter(w => w).length
    }
  };
  
  // Save analysis locally
  const analysisDir = path.join(__dirname, '../analysis');
  mkdirSync(analysisDir, { recursive: true });
  writeFileSync(
    path.join(analysisDir, `${docId}_content_analysis.json`),
    JSON.stringify(analysis, null, 2)
  );
  
  console.log(`  ✓ Generated content analysis`);
  return analysis;
}

// Step 4: Create semantic chunks
async function createSemanticChunks(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const sectionId = docId.replace('_', '.'); // Define sectionId here
  const chunks = [];
  let currentChunk = null;
  let chunkId = 0;
  let currentH1 = '';
  let currentH2 = '';
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      currentH1 = line.substring(2).trim();
    } else if (line.startsWith('## ')) {
      if (currentChunk) chunks.push(currentChunk);
      
      chunkId++;
      currentH2 = line.substring(3).trim();
      currentChunk = {
        chunk_id: `${sectionId}-${String(chunkId).padStart(3, '0')}`,
        original_document_id: docId,
        parent_headings: [currentH1, currentH2],
        content_markdown: line + '\n',
        content_text: currentH2 + '\n',
        chunk_type: 'section',
        generation_date: new Date().toISOString()
      };
    } else if (currentChunk) {
      currentChunk.content_markdown += line + '\n';
      currentChunk.content_text += line.replace(/[*_`\[\]]/g, '') + '\n';
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  
  // Upload chunks
  const chunkIds = [];
  for (const chunk of chunks) {
    const chunkPath = `bible/sections/b2/chunks/${docId}/${chunk.chunk_id}.json`;
    const file = bucket.file(chunkPath);
    await file.save(JSON.stringify(chunk, null, 2), {
      metadata: { contentType: 'application/json' }
    });
    chunkIds.push(chunk.chunk_id);
  }
  
  console.log(`  ✓ Created ${chunks.length} chunks`);
  return chunkIds;
}

// Step 5: Create optimized JSON
async function createOptimizedJson(fileName, docId, analysis, chunkIds) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  
  const sections = [];
  const lines = content.split('\n');
  let currentSection = null;
  let sectionId = 0;
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      
      sectionId++;
      currentSection = {
        section_id: `${docId}-S${sectionId}`,
        heading_level: 2,
        heading_text: line.substring(3).trim(),
        markdown_content: '',
        text_content: '',
        key_entities_identified: [],
        cross_references_in_section: [],
        related_chunk_ids: [`${docId.replace('B', '')}-${String(sectionId).padStart(3, '0')}`]
      };
    } else if (currentSection) {
      currentSection.markdown_content += line + '\n';
      currentSection.text_content += line.replace(/[*_`\[\]]/g, '') + '\n';
      
      // Extract cross-references
      const refs = line.match(/\[B[\d.]+.*?\]/g);
      if (refs) currentSection.cross_references_in_section.push(...refs);
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  const optimized = {
    document_id: docId,
    title: docId.replace(/_/g, ' '),
    generation_date: new Date().toISOString(),
    analysis_snapshot: {
      structural_summary: analysis.structural_summary,
      dominant_content_types: analysis.dominant_content_types,
      optimization_potential: analysis.potential_for_ai_optimization
    },
    hierarchical_sections: sections,
    cross_reference_summary: {
      total_references: analysis.cross_references_detected.length,
      references: analysis.cross_references_detected
    },
    chunk_mapping: chunkIds.map(id => ({
      chunk_id: id,
      storage_path: `bible/sections/b2/chunks/${docId}/${id}.json`
    })),
    metadata: {
      word_count: analysis.metrics.word_count,
      section_count: sections.length,
      optimization_version: '1.0'
    }
  };
  
  // Upload optimized JSON
  const optimizedPath = `bible/sections/b2/optimized/${docId}.optimized.json`;
  const file = bucket.file(optimizedPath);
  await file.save(JSON.stringify(optimized, null, 2), {
    metadata: { contentType: 'application/json' }
  });
  
  console.log(`  ✓ Created optimized JSON`);
}

// Step 6: Map cross-references
async function mapCrossReferences(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const analysis = JSON.parse(readFileSync(path.join(__dirname, '../analysis', `${docId}_content_analysis.json`), 'utf8'));
  
  const crossRefs = [];
  
  for (const ref of analysis.cross_references_detected) {
    const targetMatch = ref.reference.match(/\[B([\d.]+)/);
    if (targetMatch) {
      const targetSection = `B${targetMatch[1]}`;
      const crossRef = {
        source_document_id: docId,
        target_document_id: targetSection.replace('.', '_'),
        reference_text: ref.reference,
        reference_type: 'explicit_link',
        context_snippet_markdown: ref.context,
        context_snippet_text: ref.context.replace(/[*_`\[\]]/g, ''),
        confidence: 1.0,
        processing_date: new Date()
      };
      
      const refDocId = `${docId}_to_${crossRef.target_document_id}_${Date.now()}`;
      await db.collection('bible_cross_references').doc(refDocId).set(crossRef);
      crossRefs.push(crossRef);
    }
  }
  
  console.log(`  ✓ Mapped ${crossRefs.length} cross-references`);
  return crossRefs;
}

// Update metadata with completion status
async function updateMetadataCompletion(docId, chunkCount, crossRefCount) {
  await db.collection('bible_storage_metadata').doc(docId).update({
    processing_status: 'completed',
    chunks_created: chunkCount,
    optimized_json_path: `bible/sections/b2/optimized/${docId}.optimized.json`,
    cross_references_mapped: crossRefCount,
    last_processing_date: new Date(),
    updatedAt: new Date()
  });
}

// Extract key entities from content
function extractKeyEntities(content) {
  const entities = [];
  const patterns = [
    /KarmaCash/gi,
    /React/gi,
    /Firebase/gi,
    /TypeScript/gi,
    /JavaScript/gi,
    /Firestore/gi,
    /Jest/gi,
    /ESLint/gi
  ];
  
  patterns.forEach(pattern => {
    if (content.match(pattern)) {
      entities.push(pattern.source.replace(/\\/g, ''));
    }
  });
  
  return entities;
}

// Main execution
async function main() {
  const documents = [
    'B2.2_Technical_Standards.md',
    'B2.3_Date_Handling_Guide.md',
    'B2.4_Error_Handling_Strategy.md',
    'B2.5_Code_Project_Structure.md'
  ];
  
  const results = [];
  
  for (const doc of documents) {
    try {
      const result = await processB2Document(doc);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${doc}:`, error);
      results.push({ document: doc, error: error.message });
    }
  }
  
  console.log('\n=== Processing Summary ===');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}