#!/usr/bin/env node

/**
 * CG Production-Ready Metadata Creation Tool
 * Enhanced version of B2 automation with production-grade reliability
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CGMetadataCreationTool {
  constructor() {
    this.initialized = false;
    this.db = null;
  }

  async initialize() {
    try {
      const serviceAccountPath = path.join(__dirname, '../../config/serviceAccountKey.json');
      const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, 'utf8'));
      
      this.app = initializeApp({
        credential: cert(serviceAccount)
      });
      
      this.db = getFirestore();
      this.initialized = true;
      console.log('✓ CG Metadata Creation Tool initialized');
      
    } catch (error) {
      console.error('✗ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive metadata structure for CG processing
   */
  generateCGMetadataStructure(uploadResult, additionalInfo = {}) {
    const timestamp = new Date();
    const documentId = this.generateDocumentId(uploadResult.metadata.section, uploadResult.metadata.subsection);
    
    return {
      // Core identification
      id: documentId,
      section: uploadResult.metadata.section,
      subsection: uploadResult.metadata.subsection,
      fileName: uploadResult.fileName,
      documentType: uploadResult.metadata.documentType || 'foundational',
      
      // Storage references
      storagePath: uploadResult.storagePath,
      downloadUrl: uploadResult.downloadUrl,
      contentHash: uploadResult.metadata.contentHash,
      
      // CG Processing Pipeline Status
      cgProcessingStatus: {
        raw: {
          completed: true,
          timestamp: timestamp,
          path: uploadResult.storagePath,
          tool: 'upload-cg-raw.js',
          version: '1.0'
        },
        metadata: {
          completed: true,
          timestamp: timestamp,
          tool: 'create-cg-metadata.js',
          version: '1.0'
        },
        analysis: {
          completed: false,
          timestamp: null,
          path: null,
          tool: 'process-cg-complete.js',
          analysisType: null
        },
        chunks: {
          completed: false,
          timestamp: null,
          count: 0,
          paths: [],
          tool: 'process-cg-complete.js',
          chunkingStrategy: 'semantic'
        },
        optimized: {
          completed: false,
          timestamp: null,
          path: null,
          tool: 'process-cg-complete.js',
          optimizationLevel: 'production'
        },
        crossReferences: {
          completed: false,
          timestamp: null,
          count: 0,
          tool: 'process-cg-complete.js',
          mappingType: 'bidirectional'
        },
        validation: {
          completed: false,
          timestamp: null,
          tool: 'validate-cg-performance.js',
          validationLevel: 'comprehensive'
        }
      },
      
      // Content metadata with enhanced analytics
      contentMetadata: {
        fileSize: uploadResult.metadata.fileSize,
        mimeType: uploadResult.metadata.mimeType,
        lastModified: timestamp,
        characterCount: additionalInfo.characterCount || 0,
        lineCount: additionalInfo.lineCount || 0,
        wordCount: additionalInfo.wordCount || 0,
        sectionCount: additionalInfo.sectionCount || 0,
        crossReferenceCount: additionalInfo.crossReferenceCount || 0
      },
      
      // CG methodology reference
      cgMethodology: {
        version: 'CG-v1.0',
        basedOn: 'B1-enhanced',
        stages: [
          'raw-upload',
          'metadata-creation', 
          'semantic-analysis',
          'intelligent-chunking',
          'optimization-processing',
          'cross-reference-mapping',
          'performance-validation'
        ],
        qualityBaseline: 'production-ready',
        automationLevel: 'semi-automated'
      },
      
      // Quality assurance tracking
      qualityMetrics: {
        structuralIntegrity: null,
        contentPreservation: null,
        crossReferenceAccuracy: null,
        processingSpeed: null,
        lastValidated: null,
        validationStatus: 'pending'
      },
      
      // Timestamps and versioning
      createdAt: timestamp,
      updatedAt: timestamp,
      version: '1.0',
      
      // Additional context and tagging
      tags: this.generateTags(uploadResult, additionalInfo),
      keywords: additionalInfo.keywords || [],
      automationType: 'cg-production',
      environment: 'production',
      
      // Integration hooks for CK system
      ckIntegration: {
        handoffReady: false,
        summaryRequired: true,
        continuityTracking: true,
        taskMasterCompatible: true
      }
    };
  }

  /**
   * Generate consistent document IDs following CG conventions
   */
  generateDocumentId(section, subsection) {
    const cleanSection = section.toUpperCase();
    const cleanSubsection = subsection.replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanSection}_${cleanSubsection}`;
  }

  /**
   * Generate intelligent tags based on content and metadata
   */
  generateTags(uploadResult, additionalInfo) {
    const tags = [];
    
    // Section-based tags
    tags.push(`section-${uploadResult.metadata.section}`);
    
    // Document type tags
    tags.push(`type-${uploadResult.metadata.documentType}`);
    
    // Processing stage tags
    tags.push('stage-metadata-complete');
    
    // File type tags
    const ext = path.extname(uploadResult.fileName).slice(1);
    tags.push(`format-${ext}`);
    
    // Size-based tags
    const sizeKB = Math.round(uploadResult.metadata.fileSize / 1024);
    if (sizeKB < 10) tags.push('size-small');
    else if (sizeKB < 100) tags.push('size-medium');
    else tags.push('size-large');
    
    // Additional tags from user input
    if (additionalInfo.tags) {
      tags.push(...additionalInfo.tags);
    }
    
    return tags;
  }

  /**
   * Create metadata document in Firestore with validation
   */
  async createMetadata(uploadResult, additionalInfo = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const metadata = this.generateCGMetadataStructure(uploadResult, additionalInfo);
      
      // Validate metadata before storing
      const validation = this.validateMetadata(metadata);
      if (!validation.valid) {
        throw new Error(`Metadata validation failed: ${validation.errors.join(', ')}`);
      }
      
      const docRef = this.db.collection('cg_storage_metadata').doc(metadata.id);
      
      console.log(`Creating CG metadata for ${metadata.id}...`);
      
      await docRef.set(metadata);
      
      console.log(`✓ CG metadata created: ${metadata.id}`);
      
      return {
        success: true,
        documentId: metadata.id,
        metadata: metadata,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`✗ CG metadata creation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Batch create metadata for multiple uploads
   */
  async batchCreateMetadata(uploadResults, additionalInfo = {}) {
    const results = [];
    const startTime = Date.now();
    
    console.log(`\n=== CG Batch Metadata Creation Started ===`);
    console.log(`Documents: ${uploadResults.length}\n`);
    
    for (let i = 0; i < uploadResults.length; i++) {
      const uploadResult = uploadResults[i];
      
      if (uploadResult.success) {
        console.log(`[${i + 1}/${uploadResults.length}] Creating metadata for: ${uploadResult.fileName}`);
        const result = await this.createMetadata(uploadResult, additionalInfo);
        results.push(result);
      } else {
        console.log(`[${i + 1}/${uploadResults.length}] Skipping failed upload: ${uploadResult.filePath}`);
        results.push({
          success: false,
          error: 'Upload failed - metadata not created',
          fileName: path.basename(uploadResult.filePath || 'unknown')
        });
      }
    }
    
    const endTime = Date.now();
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n=== CG Batch Metadata Creation Complete ===`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Duration: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    
    return {
      summary: {
        total: results.length,
        successful,
        failed,
        duration: endTime - startTime
      },
      results
    };
  }

  /**
   * Update CG processing status for existing metadata
   */
  async updateCGProcessingStatus(documentId, stage, stageData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const docRef = this.db.collection('cg_storage_metadata').doc(documentId);
      const updateData = {
        [`cgProcessingStatus.${stage}`]: {
          completed: true,
          timestamp: new Date(),
          ...stageData
        },
        updatedAt: new Date(),
        version: '1.1' // Increment version on updates
      };
      
      await docRef.update(updateData);
      
      console.log(`✓ Updated CG processing status for ${documentId}: ${stage}`);
      return { success: true };
      
    } catch (error) {
      console.error(`✗ CG status update failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query metadata by section with CG-specific filters
   */
  async getCGMetadataBySection(section, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let query = this.db.collection('cg_storage_metadata')
        .where('section', '==', section);
      
      // Add filters based on options
      if (options.documentType) {
        query = query.where('documentType', '==', options.documentType);
      }
      
      if (options.processingStage) {
        query = query.where(`cgProcessingStatus.${options.processingStage}.completed`, '==', true);
      }
      
      const snapshot = await query.get();
      
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
      
    } catch (error) {
      console.error(`CG metadata query failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate metadata against CG production standards
   */
  validateMetadata(metadata) {
    const requiredFields = [
      'id', 'section', 'subsection', 'fileName',
      'storagePath', 'downloadUrl', 'cgProcessingStatus',
      'contentMetadata', 'cgMethodology', 'qualityMetrics'
    ];
    
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      };
    }
    
    // Validate processing status structure
    const requiredStages = ['raw', 'metadata', 'analysis', 'chunks', 'optimized', 'crossReferences', 'validation'];
    const missingStages = requiredStages.filter(stage => !metadata.cgProcessingStatus[stage]);
    
    if (missingStages.length > 0) {
      return {
        valid: false,
        errors: [`Missing processing stages: ${missingStages.join(', ')}`]
      };
    }
    
    return { valid: true };
  }

  /**
   * Generate metadata creation report
   */
  async generateMetadataReport(batchResult, outputPath = null) {
    const report = {
      timestamp: new Date().toISOString(),
      tool: 'CG Metadata Creation Tool v1.0',
      summary: batchResult.summary,
      successful_metadata: batchResult.results.filter(r => r.success),
      failed_metadata: batchResult.results.filter(r => !r.success),
      quality_metrics: {
        success_rate: ((batchResult.summary.successful / batchResult.summary.total) * 100).toFixed(2) + '%',
        average_processing_time: (batchResult.summary.duration / batchResult.summary.total).toFixed(2) + 'ms',
        metadata_completeness: '100%' // All required fields present in successful metadata
      }
    };

    if (outputPath) {
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
      console.log(`✓ Metadata report saved: ${outputPath}`);
    }

    return report;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  async function main() {
    if (args.length < 1) {
      console.log('CG Metadata Creation Tool v1.0');
      console.log('Usage: node create-cg-metadata.js <upload-result-json> [additional-info-json]');
      console.log('       node create-cg-metadata.js --batch <upload-results-file> [additional-info-json]');
      console.log('');
      console.log('Examples:');
      console.log('  node create-cg-metadata.js \'{"success":true,"storagePath":"cg/sections/b1/raw/B1.1.md",...}\'');
      console.log('  node create-cg-metadata.js --batch upload-results.json');
      process.exit(1);
    }

    const metadataCreator = new CGMetadataCreationTool();
    
    try {
      if (args[0] === '--batch') {
        // Batch mode
        const uploadsFile = args[1];
        const uploadsData = JSON.parse(await fs.readFile(uploadsFile, 'utf8'));
        const additionalInfo = args[2] ? JSON.parse(args[2]) : {};
        
        const result = await metadataCreator.batchCreateMetadata(uploadsData.results || uploadsData, additionalInfo);
        const report = await metadataCreator.generateMetadataReport(result);
        
        console.log('\nFinal Report:');
        console.log(JSON.stringify(report.summary, null, 2));
        
      } else {
        // Single metadata creation
        const uploadResult = JSON.parse(args[0]);
        const additionalInfo = args[1] ? JSON.parse(args[1]) : {};
        
        const result = await metadataCreator.createMetadata(uploadResult, additionalInfo);
        
        console.log('\nMetadata Result:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }
      
    } catch (error) {
      console.error('CG Metadata Tool Error:', error.message);
      process.exit(1);
    }
  }

  main();
}

export default CGMetadataCreationTool;