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

// Process the B7-AI-Development-Workflow.md document through all 6 steps
async function processB7AIWorkflowDocument() {
  const fileName = 'B7-AI-Development-Workflow.md';
  const docId = 'B7_AI_Development_Workflow';
  const sectionId = 'B7.AI.Development.Workflow';
  
  console.log(`\n=== Processing ${fileName} with 6-Step Autonomous Methodology ===\n`);
  
  try {
    // Step 1: Document Ingestion → Raw Upload
    console.log('Step 1: Document Ingestion → Raw Upload');
    const uploadResult = await uploadRawFile(fileName, docId);
    
    // Step 2: Semantic Analysis → Firestore Metadata
    console.log('Step 2: Semantic Analysis → Creating Firestore Metadata');
    await createFirestoreMetadata(docId, sectionId, uploadResult);
    
    // Step 3: Chunk Generation → Content Analysis
    console.log('Step 3: Chunk Generation → Generating Content Analysis');
    const analysis = await generateContentAnalysis(fileName, docId);
    
    // Step 4: Cross-Reference Mapping → Semantic Chunking
    console.log('Step 4: Cross-Reference Mapping → Creating Semantic Chunks');
    const chunkIds = await createSemanticChunks(fileName, docId);
    
    // Step 5: Optimization Processing → Optimized JSON
    console.log('Step 5: Optimization Processing → Building Optimized JSON');
    await createOptimizedJson(fileName, docId, analysis, chunkIds);
    
    // Step 6: Storage Integration → Cross-Reference Mapping
    console.log('Step 6: Storage Integration → Mapping Cross-References');
    const crossRefs = await mapCrossReferences(fileName, docId);
    
    // Update metadata with completion
    await updateMetadataCompletion(docId, chunkIds.length, crossRefs.length);
    
    console.log(`\n✓ Successfully processed ${fileName} through all 6 steps of autonomous methodology\n`);
    
    return {
      document: docId,
      chunks: chunkIds.length,
      crossReferences: crossRefs.length,
      enhancedWith6StepMethodology: true
    };
    
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    throw error;
  }
}

// Step 1: Upload raw file with enhanced methodology tracking
async function uploadRawFile(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const stats = { size: content.length };
  const contentHash = crypto.createHash('md5').update(content).digest('hex');
  
  const storagePath = `bible/sections/b7/raw/${fileName}`;
  const file = bucket.file(storagePath);
  
  await file.save(content, {
    metadata: {
      contentType: 'text/markdown',
      metadata: {
        fileSize: stats.size,
        contentHash: contentHash,
        uploadDate: new Date().toISOString(),
        processedWith6StepMethodology: 'true',
        contains6StepMethodologyDocumentation: 'true'
      }
    }
  });
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2030'
  });
  
  console.log(`  ✓ Uploaded to: ${storagePath}`);
  console.log(`  ✓ Enhanced with 6-step methodology metadata`);
  
  return {
    storagePath,
    downloadUrl: url,
    fileSize: stats.size,
    contentHash
  };
}

// Step 2: Create Firestore metadata with enhanced tracking
async function createFirestoreMetadata(docId, sectionId, uploadResult) {
  const metadata = {
    title: 'B7 AI-Assisted Development Workflow Documentation',
    document_id: docId,
    section_id: sectionId,
    section: 'B7',
    subsection: sectionId,
    raw_content_path_storage: uploadResult.storagePath,
    raw_content_type: 'text/markdown',
    status: 'raw_uploaded',
    last_raw_upload_date: new Date(),
    processing_tier: 1,
    related_sections: ['B7.1', 'B7.2', 'B7.3', 'B7.4', 'B7.5'],
    processing_status: 'processing',
    enhancement_notes: 'Enhanced with comprehensive 6-step autonomous methodology documentation and cross-references',
    contains_6step_methodology: true,
    methodology_enhancement_date: new Date().toISOString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection('bible_storage_metadata').doc(docId).set(metadata);
  console.log(`  ✓ Created enhanced metadata for ${docId}`);
  console.log(`  ✓ Marked as containing 6-step methodology documentation`);
}

// Step 3: Generate enhanced content analysis
async function generateContentAnalysis(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Count headers and structure with focus on 6-step methodology
  let h1Count = 0, h2Count = 0, h3Count = 0, h4Count = 0, h5Count = 0;
  const h2Sections = [], h3Sections = [], h4Sections = [];
  const crossRefs = [];
  const sixStepReferences = [];
  
  lines.forEach((line, index) => {
    if (line.startsWith('# ')) h1Count++;
    else if (line.startsWith('## ')) {
      h2Count++;
      h2Sections.push(line.substring(3).trim());
    } else if (line.startsWith('### ')) {
      h3Count++;
      h3Sections.push(line.substring(4).trim());
    } else if (line.startsWith('#### ')) {
      h4Count++;
      h4Sections.push(line.substring(5).trim());
    } else if (line.startsWith('##### ')) {
      h5Count++;
    }
    
    // Find cross-references
    const refMatches = line.match(/\[B[\d.]+.*?\]/g);
    if (refMatches) {
      refMatches.forEach(ref => {
        crossRefs.push({
          reference: ref,
          context: line,
          location: h2Sections[h2Sections.length - 1] || 'Introduction',
          line_number: index + 1
        });
      });
    }
    
    // Find 6-step methodology references
    if (line.toLowerCase().includes('6-step') || line.toLowerCase().includes('six-step') || 
        line.toLowerCase().includes('step 1') || line.toLowerCase().includes('step 2') ||
        line.toLowerCase().includes('autonomous methodology')) {
      sixStepReferences.push({
        text: line.trim(),
        location: h2Sections[h2Sections.length - 1] || 'Introduction',
        line_number: index + 1
      });
    }
  });
  
  const analysis = {
    document_id: docId,
    analysis_date: new Date().toISOString(),
    structural_summary: `Comprehensive AI workflow document with ${h1Count} H1, ${h2Count} H2, ${h3Count} H3, ${h4Count} H4, and ${h5Count} H5 headers`,
    dominant_content_types: [
      'ai_workflow_documentation', 
      'autonomous_methodology', 
      'mcp_integration', 
      'firebase_architecture',
      'performance_metrics',
      'cross_reference_systems',
      'template_efficiency',
      'session_management'
    ],
    key_structural_patterns_observed: [
      'Comprehensive workflow documentation structure',
      'Detailed 6-step autonomous methodology implementation',
      'Cross-reference integration throughout sections',
      `${h2Count} major workflow sections`,
      `${sixStepReferences.length} 6-step methodology references`
    ],
    examples_of_key_entities: extractKeyEntities(content),
    potential_for_ai_optimization: 'Extremely High - This is the definitive autonomous AI workflow documentation with proven methodologies',
    notes_for_chunking: `Natural boundaries at ${h2Count} H2 sections, with special attention to 6-step methodology section`,
    cross_references_detected: crossRefs,
    six_step_methodology_references: sixStepReferences,
    enhancement_details: {
      contains_6step_methodology: true,
      methodology_section_comprehensive: true,
      cross_reference_enhanced: true,
      integration_with_other_docs: true
    },
    metrics: {
      h1_count: h1Count,
      h2_count: h2Count,
      h3_count: h3Count,
      h4_count: h4Count,
      h5_count: h5Count,
      cross_references: crossRefs.length,
      six_step_references: sixStepReferences.length,
      word_count: content.split(/\s+/).filter(w => w).length,
      lines_count: lines.length
    }
  };
  
  // Save analysis locally
  const analysisDir = path.join(__dirname, '../analysis');
  mkdirSync(analysisDir, { recursive: true });
  writeFileSync(
    path.join(analysisDir, `${docId}_content_analysis.json`),
    JSON.stringify(analysis, null, 2)
  );
  
  console.log(`  ✓ Generated enhanced content analysis`);
  console.log(`  ✓ Detected ${sixStepReferences.length} 6-step methodology references`);
  console.log(`  ✓ Identified ${crossRefs.length} cross-references`);
  return analysis;
}

// Step 4: Create semantic chunks with methodology awareness
async function createSemanticChunks(fileName, docId) {
  const filePath = path.join(__dirname, '../../../docs', fileName);
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
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
      
      // Special handling for 6-step methodology section
      const is6StepSection = currentH2.toLowerCase().includes('6-step') || 
                           currentH2.toLowerCase().includes('autonomous');
      
      currentChunk = {
        chunk_id: `B7.AI.Dev.Workflow-${String(chunkId).padStart(3, '0')}`,
        original_document_id: docId,
        parent_headings: [currentH1, currentH2],
        content_markdown: line + '\n',
        content_text: currentH2 + '\n',
        chunk_type: is6StepSection ? 'methodology_section' : 'workflow_section',
        contains_6step_methodology: is6StepSection,
        generation_date: new Date().toISOString()
      };
    } else if (currentChunk) {
      currentChunk.content_markdown += line + '\n';
      currentChunk.content_text += line.replace(/[*_`\[\]]/g, '') + '\n';
      
      // Check for 6-step references in content
      if (line.toLowerCase().includes('6-step') || line.toLowerCase().includes('step 1')) {
        currentChunk.contains_6step_methodology = true;
      }
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  
  // Upload chunks with enhanced metadata
  const chunkIds = [];
  for (const chunk of chunks) {
    const chunkPath = `bible/sections/b7/chunks/${docId}/${chunk.chunk_id}.json`;
    const file = bucket.file(chunkPath);
    await file.save(JSON.stringify(chunk, null, 2), {
      metadata: { 
        contentType: 'application/json',
        metadata: {
          contains_6step_methodology: chunk.contains_6step_methodology?.toString() || 'false',
          chunk_type: chunk.chunk_type
        }
      }
    });
    chunkIds.push(chunk.chunk_id);
  }
  
  console.log(`  ✓ Created ${chunks.length} enhanced semantic chunks`);
  console.log(`  ✓ Special methodology sections marked`);
  return chunkIds;
}

// Step 5: Create optimized JSON with methodology focus
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
      const sectionTitle = line.substring(3).trim();
      const is6StepSection = sectionTitle.toLowerCase().includes('6-step') || 
                           sectionTitle.toLowerCase().includes('autonomous');
      
      currentSection = {
        section_id: `${docId}-S${sectionId}`,
        heading_level: 2,
        heading_text: sectionTitle,
        markdown_content: '',
        text_content: '',
        key_entities_identified: [],
        cross_references_in_section: [],
        contains_6step_methodology: is6StepSection,
        section_type: is6StepSection ? 'methodology_core' : 'workflow_documentation',
        related_chunk_ids: [`B7.AI.Dev.Workflow-${String(sectionId).padStart(3, '0')}`]
      };
    } else if (currentSection) {
      currentSection.markdown_content += line + '\n';
      currentSection.text_content += line.replace(/[*_`\[\]]/g, '') + '\n';
      
      // Extract cross-references
      const refs = line.match(/\[B[\d.]+.*?\]/g);
      if (refs) currentSection.cross_references_in_section.push(...refs);
      
      // Check for 6-step methodology content
      if (line.toLowerCase().includes('6-step') || line.toLowerCase().includes('step 1')) {
        currentSection.contains_6step_methodology = true;
      }
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  const optimized = {
    document_id: docId,
    title: 'B7 AI-Assisted Development Workflow Documentation',
    generation_date: new Date().toISOString(),
    enhancement_details: {
      enhanced_with_6step_methodology: true,
      cross_reference_integration: true,
      autonomous_capability_documentation: true,
      methodology_implementation_complete: true
    },
    analysis_snapshot: {
      structural_summary: analysis.structural_summary,
      dominant_content_types: analysis.dominant_content_types,
      optimization_potential: analysis.potential_for_ai_optimization,
      six_step_methodology_references: analysis.six_step_methodology_references.length
    },
    hierarchical_sections: sections,
    cross_reference_summary: {
      total_references: analysis.cross_references_detected.length,
      references: analysis.cross_references_detected,
      methodology_cross_references: analysis.six_step_methodology_references.length
    },
    chunk_mapping: chunkIds.map(id => ({
      chunk_id: id,
      storage_path: `bible/sections/b7/chunks/${docId}/${id}.json`
    })),
    six_step_methodology_mapping: {
      documented_steps: 6,
      implementation_complete: true,
      cross_reference_integration: true,
      storage_integration: true
    },
    metadata: {
      word_count: analysis.metrics.word_count,
      section_count: sections.length,
      methodology_sections: sections.filter(s => s.contains_6step_methodology).length,
      optimization_version: '2.0_with_6step_methodology'
    }
  };
  
  // Upload optimized JSON
  const optimizedPath = `bible/sections/b7/optimized/${docId}.optimized.json`;
  const file = bucket.file(optimizedPath);
  await file.save(JSON.stringify(optimized, null, 2), {
    metadata: { 
      contentType: 'application/json',
      metadata: {
        contains_6step_methodology: 'true',
        optimization_version: '2.0_with_6step_methodology'
      }
    }
  });
  
  console.log(`  ✓ Created enhanced optimized JSON`);
  console.log(`  ✓ Methodology sections: ${optimized.metadata.methodology_sections}`);
}

// Step 6: Map cross-references with methodology integration
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
        target_document_id: targetSection.replace(/\./g, '_'),
        reference_text: ref.reference,
        reference_type: 'explicit_link',
        context_snippet_markdown: ref.context,
        context_snippet_text: ref.context.replace(/[*_`\[\]]/g, ''),
        confidence: 1.0,
        processing_date: new Date(),
        source_enhanced_with_6step: true,
        methodology_related: ref.location.toLowerCase().includes('6-step') || 
                           ref.location.toLowerCase().includes('autonomous')
      };
      
      const refDocId = `${docId}_to_${crossRef.target_document_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.collection('bible_cross_references').doc(refDocId).set(crossRef);
      crossRefs.push(crossRef);
    }
  }
  
  console.log(`  ✓ Mapped ${crossRefs.length} enhanced cross-references`);
  console.log(`  ✓ Cross-references include methodology integration markers`);
  return crossRefs;
}

// Update metadata with completion status and methodology info
async function updateMetadataCompletion(docId, chunkCount, crossRefCount) {
  await db.collection('bible_storage_metadata').doc(docId).update({
    processing_status: 'completed',
    chunks_created: chunkCount,
    optimized_json_path: `bible/sections/b7/optimized/${docId}.optimized.json`,
    cross_references_mapped: crossRefCount,
    last_processing_date: new Date(),
    six_step_methodology_processed: true,
    enhancement_completion_date: new Date().toISOString(),
    processing_notes: '6-Step Autonomous Methodology enhancement complete with comprehensive cross-referencing',
    updatedAt: new Date()
  });
}

// Extract key entities with methodology focus
function extractKeyEntities(content) {
  const entities = [];
  const patterns = [
    /6-step/gi,
    /autonomous methodology/gi,
    /document ingestion/gi,
    /semantic analysis/gi,
    /chunk generation/gi,
    /cross-reference mapping/gi,
    /optimization processing/gi,
    /storage integration/gi,
    /AI workflow/gi,
    /MCP tools/gi,
    /Firebase/gi,
    /Bible Access/gi,
    /Template System/gi,
    /Revolutionary/gi,
    /Enhanced/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      entities.push({
        entity: pattern.source.replace(/\\/g, ''),
        count: matches.length
      });
    }
  });
  
  return entities;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting 6-Step Autonomous Methodology Processing...\n');
    
    const result = await processB7AIWorkflowDocument();
    
    console.log('\n=== 6-Step Methodology Processing Complete ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ B7-AI-Development-Workflow.md successfully processed and stored in Firebase Bible!');
    console.log('📍 Location: bible/sections/b7/ (raw, chunks, optimized)');
    console.log('🔄 Cross-references: Mapped and stored in bible_cross_references collection');
    console.log('📊 Metadata: Enhanced with 6-step methodology markers');
    
    return result;
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    throw error;
  }
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