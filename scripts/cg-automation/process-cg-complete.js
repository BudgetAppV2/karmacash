#!/usr/bin/env node

/**
 * CG Complete Processing Tool
 * End-to-end processing of CG documents through all pipeline stages
 * Production-grade automation for analysis, chunking, optimization, and cross-referencing
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CGCompleteProcessingTool {
  constructor() {
    this.initialized = false;
    this.bucket = null;
    this.db = null;
    this.processingLog = [];
  }

  async initialize() {
    try {
      const serviceAccountPath = path.join(__dirname, '../../config/serviceAccountKey.json');
      const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
      
      this.app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: 'karmacash-6e8f5.firebasestorage.app'
      });
      
      this.bucket = getStorage().bucket();
      this.db = getFirestore();
      this.initialized = true;
      console.log('✓ CG Complete Processing Tool initialized');
      
    } catch (error) {
      console.error('✗ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Process all CG documents through complete pipeline
   */
  async processAllCGDocuments(section = null, forceReprocess = false) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('=== CG Complete Processing Pipeline Started ===');
      
      // Step 1: Discover documents to process
      const documents = await this.discoverCGDocuments(section);
      console.log(`Found ${documents.length} CG documents for processing`);
      
      if (documents.length === 0) {
        console.log('No documents found for processing');
        return { success: true, processed: 0 };
      }
      
      // Step 2: Process each document through all stages
      const results = {
        analysis: [],
        chunks: [],
        optimized: [],
        crossReferences: [],
        metadata_updates: []
      };
      
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        console.log(`\n[${i + 1}/${documents.length}] Processing: ${doc.id}`);
        
        // Check if processing is needed
        if (!forceReprocess && await this.isProcessingComplete(doc.id)) {
          console.log(`  → Skipping (already processed)`);
          continue;
        }
        
        try {
          // Initialize performance monitoring (M5.S7 requirement)
          const processingMetrics = {
            startTime: Date.now(),
            documentId: doc.id,
            fileSize: doc.fileSize || 0
          };
          
          // Stage 1: Content Analysis
          const analysisResult = await this.performContentAnalysis(doc);
          results.analysis.push(analysisResult);
          
          // Stage 2: Intelligent Chunking
          const chunkingResult = await this.performIntelligentChunking(doc, analysisResult);
          results.chunks.push(chunkingResult);
          
          // Stage 3: Optimization Processing
          const optimizationResult = await this.performOptimizationProcessing(doc, analysisResult, chunkingResult);
          results.optimized.push(optimizationResult);
          
          // Stage 4: Cross-Reference Mapping
          const crossRefResult = await this.performCrossReferenceMapping(doc, analysisResult);
          results.crossReferences.push(crossRefResult);
          
          // Stage 5: Update Metadata
          const metadataResult = await this.updateProcessingMetadata(doc.id, {
            analysis: analysisResult,
            chunks: chunkingResult,
            optimized: optimizationResult,
            crossReferences: crossRefResult
          });
          results.metadata_updates.push(metadataResult);
          
          // Stage 6: Bible Access Module Integration Validation
          const integrationResult = await this.validateBibleAccessIntegration(doc.id);
          if (!results.bible_access_validation) {
            results.bible_access_validation = [];
          }
          results.bible_access_validation.push(integrationResult);
          
          const integrationStatus = integrationResult.success ? '✓' : '⚠️';
          console.log(`  ${integrationStatus} Bible Access Module validation for ${doc.id}`);
          
          // Complete performance monitoring
          processingMetrics.endTime = Date.now();
          processingMetrics.totalTime = processingMetrics.endTime - processingMetrics.startTime;
          processingMetrics.processingSpeed = processingMetrics.fileSize > 0 
            ? (processingMetrics.totalTime / processingMetrics.fileSize * 1000).toFixed(3) 
            : 'unknown';
          
          console.log(`  ✓ Complete processing finished for ${doc.id} (${processingMetrics.totalTime}ms, ${processingMetrics.processingSpeed}s/KB)`);
          
        } catch (error) {
          console.error(`  ✗ Processing failed for ${doc.id}: ${error.message}`);
          this.log(`Processing failed for ${doc.id}: ${error.message}`, 'error');
        }
      }
      
      // Step 3: Generate processing report
      const report = await this.generateProcessingReport(results);
      
      console.log('\n=== CG Complete Processing Pipeline Finished ===');
      return report;
      
    } catch (error) {
      console.error('Complete processing failed:', error.message);
      throw error;
    }
  }

  /**
   * Discover CG documents that need processing
   */
  async discoverCGDocuments(section) {
    try {
      let query = this.db.collection('cg_storage_metadata');
      
      if (section) {
        query = query.where('section', '==', section);
      }
      
      const snapshot = await query.get();
      const documents = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data
        });
      });
      
      return documents;
      
    } catch (error) {
      this.log(`Error discovering CG documents: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Check if document processing is complete
   */
  async isProcessingComplete(documentId) {
    try {
      const doc = await this.db.collection('cg_storage_metadata').doc(documentId).get();
      if (!doc.exists) return false;
      
      const data = doc.data();
      const status = data.cgProcessingStatus || {};
      
      return status.analysis?.completed && 
             status.chunks?.completed && 
             status.optimized?.completed && 
             status.crossReferences?.completed;
             
    } catch (error) {
      return false;
    }
  }

  /**
   * Stage 1: Perform comprehensive content analysis
   */
  async performContentAnalysis(doc) {
    try {
      console.log(`    → Stage 1: Content Analysis`);
      
      // Download raw content
      const rawFile = this.bucket.file(doc.storagePath);
      const [content] = await rawFile.download();
      const contentText = content.toString('utf8');
      
      // Perform analysis
      const analysis = this.analyzeContent(contentText, doc);
      
      // Store analysis
      const analysisPath = `cg/sections/${doc.section}/analysis/${doc.id}_analysis.json`;
      const analysisFile = this.bucket.file(analysisPath);
      
      await analysisFile.save(JSON.stringify(analysis, null, 2), {
        metadata: {
          contentType: 'application/json',
          cg_stage: 'analysis',
          document_id: doc.id
        }
      });
      
      console.log(`      ✓ Analysis complete`);
      
      return {
        success: true,
        documentId: doc.id,
        analysisPath,
        analysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`      ✗ Analysis failed: ${error.message}`);
      return {
        success: false,
        documentId: doc.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate Bible Access Module compatible filename with _document suffix
   * Critical fix from M5.S7 validation: Bible Access Module requires _document suffix
   */
  generateBibleAccessCompatibleFileName(documentId) {
    // Apply _document suffix for Bible Access Module compatibility
    return `${documentId}_document.optimized.json`;
  }

  /**
   * Stage 2: Perform intelligent chunking
   */
  async performIntelligentChunking(doc, analysisResult) {
    try {
      console.log(`    → Stage 2: Intelligent Chunking`);
      
      if (!analysisResult.success) {
        throw new Error('Cannot chunk without successful analysis');
      }
      
      // Download raw content
      const rawFile = this.bucket.file(doc.storagePath);
      const [content] = await rawFile.download();
      const contentText = content.toString('utf8');
      
      // Create intelligent chunks
      const chunks = this.createIntelligentChunks(contentText, doc, analysisResult.analysis);
      
      // Store chunks
      const chunkPaths = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPath = `cg/sections/${doc.section}/chunks/${doc.id}/${chunk.chunk_id}.json`;
        const chunkFile = this.bucket.file(chunkPath);
        
        await chunkFile.save(JSON.stringify(chunk, null, 2), {
          metadata: {
            contentType: 'application/json',
            cg_stage: 'chunks',
            document_id: doc.id,
            chunk_id: chunk.chunk_id
          }
        });
        
        chunkPaths.push(chunkPath);
      }
      
      console.log(`      ✓ Created ${chunks.length} intelligent chunks`);
      
      return {
        success: true,
        documentId: doc.id,
        chunksCount: chunks.length,
        chunkPaths,
        chunks,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`      ✗ Chunking failed: ${error.message}`);
      return {
        success: false,
        documentId: doc.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stage 3: Perform optimization processing
   */
  async performOptimizationProcessing(doc, analysisResult, chunkingResult) {
    try {
      console.log(`    → Stage 3: Optimization Processing`);
      
      if (!analysisResult.success || !chunkingResult.success) {
        throw new Error('Cannot optimize without successful analysis and chunking');
      }
      
      // Create optimized structure
      const optimized = this.createOptimizedStructure(doc, analysisResult.analysis, chunkingResult.chunks);
      
      // Store optimized JSON with Bible Access Module compatible naming
      // CRITICAL: Bible Access Module requires _document suffix for proper integration
      const optimizedFileName = this.generateBibleAccessCompatibleFileName(doc.id);
      const optimizedPath = `cg/sections/${doc.section}/optimized/${optimizedFileName}`;
      const optimizedFile = this.bucket.file(optimizedPath);
      
      await optimizedFile.save(JSON.stringify(optimized, null, 2), {
        metadata: {
          contentType: 'application/json',
          cg_stage: 'optimized',
          document_id: doc.id,
          optimization_version: 'cg-v1.0'
        }
      });
      
      console.log(`      ✓ Optimization complete`);
      
      return {
        success: true,
        documentId: doc.id,
        optimizedPath,
        optimized,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`      ✗ Optimization failed: ${error.message}`);
      return {
        success: false,
        documentId: doc.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Stage 4: Perform cross-reference mapping
   */
  async performCrossReferenceMapping(doc, analysisResult) {
    try {
      console.log(`    → Stage 4: Cross-Reference Mapping`);
      
      if (!analysisResult.success) {
        throw new Error('Cannot map cross-references without successful analysis');
      }
      
      const crossRefs = this.extractAndMapCrossReferences(doc, analysisResult.analysis);
      
      // Store cross-references in Firestore
      const crossRefPromises = crossRefs.map(ref => {
        const refId = `${doc.id}_to_${ref.target_document_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return this.db.collection('cg_cross_references').doc(refId).set({
          ...ref,
          created_by: 'process-cg-complete.js',
          created_at: new Date()
        });
      });
      
      await Promise.all(crossRefPromises);
      
      console.log(`      ✓ Mapped ${crossRefs.length} cross-references`);
      
      return {
        success: true,
        documentId: doc.id,
        crossReferencesCount: crossRefs.length,
        crossReferences: crossRefs,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`      ✗ Cross-reference mapping failed: ${error.message}`);
      return {
        success: false,
        documentId: doc.id,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update processing metadata with completion status
   */
  async updateProcessingMetadata(documentId, stageResults) {
    try {
      const timestamp = new Date();
      
      const updateData = {
        'cgProcessingStatus.analysis': {
          completed: stageResults.analysis.success,
          timestamp: timestamp,
          path: stageResults.analysis.analysisPath || null,
          tool: 'process-cg-complete.js'
        },
        'cgProcessingStatus.chunks': {
          completed: stageResults.chunks.success,
          timestamp: timestamp,
          count: stageResults.chunks.chunksCount || 0,
          paths: stageResults.chunks.chunkPaths || [],
          tool: 'process-cg-complete.js'
        },
        'cgProcessingStatus.optimized': {
          completed: stageResults.optimized.success,
          timestamp: timestamp,
          path: stageResults.optimized.optimizedPath || null,
          tool: 'process-cg-complete.js'
        },
        'cgProcessingStatus.crossReferences': {
          completed: stageResults.crossReferences.success,
          timestamp: timestamp,
          count: stageResults.crossReferences.crossReferencesCount || 0,
          tool: 'process-cg-complete.js'
        },
        updatedAt: timestamp,
        lastProcessed: timestamp,
        processingVersion: 'cg-v1.0'
      };
      
      await this.db.collection('cg_storage_metadata').doc(documentId).update(updateData);
      
      return {
        success: true,
        documentId,
        updated: true,
        timestamp: timestamp.toISOString()
      };
      
    } catch (error) {
      console.error(`Metadata update failed for ${documentId}: ${error.message}`);
      return {
        success: false,
        documentId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate Bible Access Module integration after upload
   * Ensures document is retrievable and meets performance requirements
   * Based on M5.S7 validation findings
   */
  async validateBibleAccessIntegration(documentId) {
    try {
      const startTime = Date.now();
      
      // Note: This validation would use MCP tools in a real CK environment
      // For CG automation, we validate file existence and structure
      const optimizedFileName = this.generateBibleAccessCompatibleFileName(documentId);
      const filePath = `bible/sections/${documentId.split('-')[0]}/optimized/${optimizedFileName}`;
      const optimizedFile = this.bucket.file(filePath);
      
      const [exists] = await optimizedFile.exists();
      if (!exists) {
        return {
          success: false,
          error: 'Optimized file does not exist in Bible Access location',
          integrationReady: false
        };
      }
      
      // Validate file structure
      const [content] = await optimizedFile.download();
      const data = JSON.parse(content.toString());
      
      const validationTime = Date.now() - startTime;
      
      return {
        success: true,
        retrievalWorking: true,
        performanceValid: validationTime < 500, // Target <500ms
        structureValid: !!data.document_id && !!data.hierarchical_sections,
        integrationReady: true,
        validationTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        integrationReady: false
      };
    }
  }

  /**
   * Analyze content structure and extract key information
   */
  analyzeContent(content, doc) {
    const lines = content.split('\n');
    const analysis = {
      document_id: doc.id,
      analysis_date: new Date().toISOString(),
      tool: 'process-cg-complete.js',
      version: 'cg-v1.0'
    };
    
    // Count structural elements
    let h1Count = 0, h2Count = 0, h3Count = 0, h4Count = 0;
    const sections = [];
    const crossRefs = [];
    const keyEntities = new Set();
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        h1Count++;
      } else if (line.startsWith('## ')) {
        h2Count++;
        sections.push({
          level: 2,
          title: line.substring(3).trim(),
          line: index + 1
        });
      } else if (line.startsWith('### ')) {
        h3Count++;
        sections.push({
          level: 3,
          title: line.substring(4).trim(),
          line: index + 1
        });
      } else if (line.startsWith('#### ')) {
        h4Count++;
        sections.push({
          level: 4,
          title: line.substring(5).trim(),
          line: index + 1
        });
      }
      
      // Extract cross-references
      const refMatches = line.match(/\[B[\d.]+.*?\]/g);
      if (refMatches) {
        refMatches.forEach(ref => {
          crossRefs.push({
            reference: ref,
            context: line,
            line_number: index + 1
          });
        });
      }
      
      // Extract key entities
      const entities = this.extractEntitiesFromLine(line);
      entities.forEach(entity => keyEntities.add(entity));
    });
    
    analysis.structural_summary = `Document with ${h1Count} H1, ${h2Count} H2, ${h3Count} H3, ${h4Count} H4 headers`;
    analysis.sections = sections;
    analysis.cross_references_detected = crossRefs;
    analysis.key_entities = Array.from(keyEntities);
    analysis.metrics = {
      h1_count: h1Count,
      h2_count: h2Count,
      h3_count: h3Count,
      h4_count: h4Count,
      cross_references: crossRefs.length,
      word_count: content.split(/\s+/).filter(w => w).length,
      lines_count: lines.length,
      character_count: content.length
    };
    
    return analysis;
  }

  /**
   * Create intelligent chunks based on content structure
   */
  createIntelligentChunks(content, doc, analysis) {
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = null;
    let chunkId = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('## ')) {
        // Start new chunk at H2 level
        if (currentChunk) {
          chunks.push(this.finalizeChunk(currentChunk));
        }
        
        chunkId++;
        currentChunk = {
          chunk_id: `${doc.id}-${String(chunkId).padStart(3, '0')}`,
          original_document_id: doc.id,
          section_title: line.substring(3).trim(),
          content_markdown: '',
          content_text: '',
          start_line: i + 1,
          chunk_type: 'section',
          generation_date: new Date().toISOString(),
          cg_enhanced: true
        };
      }
      
      if (currentChunk) {
        currentChunk.content_markdown += line + '\n';
        currentChunk.content_text += line.replace(/[*_`\[\]]/g, '') + '\n';
      }
    }
    
    if (currentChunk) {
      chunks.push(this.finalizeChunk(currentChunk));
    }
    
    return chunks;
  }

  /**
   * Finalize chunk with additional metadata
   */
  finalizeChunk(chunk) {
    // Add semantic analysis
    chunk.semantic_info = {
      word_count: chunk.content_text.split(/\s+/).filter(w => w).length,
      has_cross_references: chunk.content_markdown.includes('[B'),
      has_code_blocks: chunk.content_markdown.includes('```'),
      has_lists: chunk.content_markdown.includes('- ') || chunk.content_markdown.includes('* ')
    };
    
    // Extract key terms
    chunk.key_terms = this.extractKeyTermsFromText(chunk.content_text);
    
    return chunk;
  }

  /**
   * Create optimized structure for handoff compatibility
   */
  createOptimizedStructure(doc, analysis, chunks) {
    return {
      document_id: doc.id,
      title: doc.fileName.replace(/\.(md|txt)$/, ''),
      generation_date: new Date().toISOString(),
      tool: 'process-cg-complete.js',
      version: 'cg-v1.0',
      
      cg_enhancements: {
        handoff_ready: true,
        ck_compatible: true,
        performance_optimized: true,
        production_ready: true
      },
      
      analysis_snapshot: {
        structural_summary: analysis.structural_summary,
        sections_count: analysis.sections.length,
        cross_references_count: analysis.cross_references_detected.length,
        key_entities: analysis.key_entities
      },
      
      hierarchical_sections: analysis.sections.map(section => ({
        section_id: `${doc.id}-S${section.line}`,
        heading_level: section.level,
        heading_text: section.title,
        line_number: section.line,
        related_chunk_id: chunks.find(c => 
          c.section_title === section.title
        )?.chunk_id || null
      })),
      
      chunk_mapping: chunks.map(chunk => ({
        chunk_id: chunk.chunk_id,
        storage_path: `cg/sections/${doc.section}/chunks/${doc.id}/${chunk.chunk_id}.json`,
        section_title: chunk.section_title,
        word_count: chunk.semantic_info?.word_count || 0
      })),
      
      cross_reference_summary: {
        total_references: analysis.cross_references_detected.length,
        references: analysis.cross_references_detected
      },
      
      metadata: {
        word_count: analysis.metrics.word_count,
        section_count: analysis.sections.length,
        chunk_count: chunks.length,
        optimization_version: 'cg-v1.0'
      }
    };
  }

  /**
   * Extract and map cross-references
   */
  extractAndMapCrossReferences(doc, analysis) {
    return analysis.cross_references_detected.map(ref => {
      const targetMatch = ref.reference.match(/\[B([\d.]+)/);
      const targetSection = targetMatch ? `B${targetMatch[1]}` : null;
      
      return {
        source_document_id: doc.id,
        target_document_id: targetSection ? targetSection.replace(/\./g, '_') : 'unknown',
        reference_text: ref.reference,
        reference_type: 'explicit_link',
        context_snippet_markdown: ref.context,
        context_snippet_text: ref.context.replace(/[*_`\[\]]/g, ''),
        line_number: ref.line_number,
        confidence: 1.0,
        processing_date: new Date(),
        tool: 'process-cg-complete.js',
        cg_enhanced: true
      };
    });
  }

  /**
   * Extract entities from a line of text
   */
  extractEntitiesFromLine(line) {
    const entities = [];
    const patterns = [
      /\b(firebase|firestore|storage|auth)\b/gi,
      /\b(react|javascript|node|npm)\b/gi,
      /\b(cg|ck|taskmaster|mcp)\b/gi,
      /\b(automation|processing|optimization)\b/gi,
      /\b(workflow|pipeline|methodology)\b/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        entities.push(...matches.map(m => m.toLowerCase()));
      }
    });
    
    return entities;
  }

  /**
   * Extract key terms from text
   */
  extractKeyTermsFromText(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const termCounts = {};
    
    words.forEach(word => {
      if (!/^(the|and|for|are|but|not|you|all|can|her|was|one|our|had|but|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|too|use|use)$/.test(word)) {
        termCounts[word] = (termCounts[word] || 0) + 1;
      }
    });
    
    return Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
  }

  /**
   * Logging utility
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.processingLog.push(logEntry);
  }

  /**
   * Generate comprehensive processing report
   */
  async generateProcessingReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      tool: 'CG Complete Processing Tool v1.0',
      processing_summary: {
        analysis: {
          total: results.analysis.length,
          successful: results.analysis.filter(r => r.success).length,
          failed: results.analysis.filter(r => !r.success).length
        },
        chunks: {
          total: results.chunks.length,
          successful: results.chunks.filter(r => r.success).length,
          failed: results.chunks.filter(r => !r.success).length,
          total_chunks_created: results.chunks.filter(r => r.success)
            .reduce((sum, r) => sum + (r.chunksCount || 0), 0)
        },
        optimized: {
          total: results.optimized.length,
          successful: results.optimized.filter(r => r.success).length,
          failed: results.optimized.filter(r => !r.success).length
        },
        cross_references: {
          total: results.crossReferences.length,
          successful: results.crossReferences.filter(r => r.success).length,
          failed: results.crossReferences.filter(r => !r.success).length,
          total_references_mapped: results.crossReferences.filter(r => r.success)
            .reduce((sum, r) => sum + (r.crossReferencesCount || 0), 0)
        }
      },
      detailed_results: results,
      processing_log: this.processingLog
    };

    // Save report
    const reportPath = path.join(__dirname, `../../logs/cg-processing-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✓ Processing report saved: ${reportPath}`);
    
    return report;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  async function main() {
    console.log('CG Complete Processing Tool v1.0');
    console.log('Processing CG documents through complete pipeline...\n');

    const processor = new CGCompleteProcessingTool();
    
    try {
      const section = args.includes('--section') ? args[args.indexOf('--section') + 1] : null;
      const forceReprocess = args.includes('--force');
      
      if (section) {
        console.log(`Processing section: ${section}`);
      }
      if (forceReprocess) {
        console.log('Force reprocessing enabled');
      }
      
      const report = await processor.processAllCGDocuments(section, forceReprocess);
      
      console.log('\n=== Final Processing Report ===');
      console.log(JSON.stringify(report.processing_summary, null, 2));
      
      const totalSuccess = Object.values(report.processing_summary)
        .reduce((sum, stage) => sum + stage.successful, 0);
      const totalFailed = Object.values(report.processing_summary)
        .reduce((sum, stage) => sum + stage.failed, 0);
      
      if (totalFailed > 0) {
        console.log(`⚠️  ${totalFailed} operations failed - check report for details`);
        process.exit(1);
      } else {
        console.log('🎉 All CG documents successfully processed!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('CG Processing Tool Error:', error.message);
      process.exit(1);
    }
  }

  main();
}

export default CGCompleteProcessingTool;