#!/usr/bin/env node

/**
 * CG B7 Migration Tool
 * Migrates existing B7 workflow documentation to CG processing system
 * Handles legacy data transformation with production-grade reliability
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CGB7MigrationTool {
  constructor() {
    this.initialized = false;
    this.bucket = null;
    this.db = null;
    this.migrationLog = [];
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
      console.log('✓ CG B7 Migration Tool initialized');
      
    } catch (error) {
      console.error('✗ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate B7 documents from bible/sections/b7 to cg/sections/b7
   */
  async migrateB7Documents() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('=== Starting B7 to CG Migration ===');
      
      // Step 1: Discover existing B7 documents
      const b7Documents = await this.discoverB7Documents();
      console.log(`Found ${b7Documents.length} B7 documents to migrate`);
      
      // Step 2: Migrate each document type
      const results = {
        raw: await this.migrateRawDocuments(b7Documents),
        metadata: await this.migrateMetadata(b7Documents),
        chunks: await this.migrateChunks(b7Documents),
        optimized: await this.migrateOptimized(b7Documents),
        analysis: await this.migrateAnalysis(b7Documents)
      };
      
      // Step 3: Update cross-references
      await this.updateCrossReferences(b7Documents);
      
      // Step 4: Generate migration report
      const report = await this.generateMigrationReport(results);
      
      console.log('=== B7 to CG Migration Complete ===');
      return report;
      
    } catch (error) {
      console.error('Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Discover all B7 documents in Firebase Storage
   */
  async discoverB7Documents() {
    const documents = [];
    
    try {
      // Check raw documents
      const [rawFiles] = await this.bucket.getFiles({
        prefix: 'bible/sections/b7/raw/'
      });
      
      for (const file of rawFiles) {
        const fileName = path.basename(file.name);
        if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
          documents.push({
            fileName,
            rawPath: file.name,
            documentId: this.generateDocumentId(fileName),
            discovered: new Date().toISOString()
          });
        }
      }
      
      this.log(`Discovered ${documents.length} B7 raw documents`);
      return documents;
      
    } catch (error) {
      this.log(`Error discovering B7 documents: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Migrate raw documents from bible/sections/b7 to cg/sections/b7
   */
  async migrateRawDocuments(documents) {
    const results = [];
    
    console.log('\n--- Migrating Raw Documents ---');
    
    for (const doc of documents) {
      try {
        const sourceFile = this.bucket.file(doc.rawPath);
        const targetPath = `cg/sections/b7/raw/${doc.fileName}`;
        const targetFile = this.bucket.file(targetPath);
        
        // Copy file with enhanced metadata
        const [content] = await sourceFile.download();
        const [metadata] = await sourceFile.getMetadata();
        
        await targetFile.save(content, {
          metadata: {
            ...metadata.metadata,
            contentType: 'text/markdown',
            migrated_from: doc.rawPath,
            migration_date: new Date().toISOString(),
            cg_enhanced: 'true',
            migration_tool: 'migrate-b7-to-cg.js'
          }
        });
        
        console.log(`✓ Migrated: ${doc.fileName}`);
        this.log(`Successfully migrated raw document: ${doc.fileName}`);
        
        results.push({
          success: true,
          fileName: doc.fileName,
          sourcePath: doc.rawPath,
          targetPath,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`✗ Failed to migrate ${doc.fileName}: ${error.message}`);
        this.log(`Failed to migrate raw document ${doc.fileName}: ${error.message}`, 'error');
        
        results.push({
          success: false,
          fileName: doc.fileName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Migrate and enhance metadata to CG format
   */
  async migrateMetadata(documents) {
    const results = [];
    
    console.log('\n--- Migrating and Enhancing Metadata ---');
    
    for (const doc of documents) {
      try {
        // Try to find existing metadata
        const existingMetadata = await this.findExistingMetadata(doc.documentId);
        
        // Create enhanced CG metadata
        const cgMetadata = this.createEnhancedCGMetadata(doc, existingMetadata);
        
        // Store in CG metadata collection
        await this.db.collection('cg_storage_metadata').doc(doc.documentId).set(cgMetadata);
        
        console.log(`✓ Enhanced metadata: ${doc.documentId}`);
        this.log(`Successfully migrated and enhanced metadata: ${doc.documentId}`);
        
        results.push({
          success: true,
          documentId: doc.documentId,
          enhanced: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`✗ Failed to migrate metadata for ${doc.documentId}: ${error.message}`);
        this.log(`Failed to migrate metadata for ${doc.documentId}: ${error.message}`, 'error');
        
        results.push({
          success: false,
          documentId: doc.documentId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Migrate chunk files to CG structure
   */
  async migrateChunks(documents) {
    const results = [];
    
    console.log('\n--- Migrating Chunk Files ---');
    
    for (const doc of documents) {
      try {
        // Find existing chunks
        const [chunkFiles] = await this.bucket.getFiles({
          prefix: `bible/sections/b7/chunks/${doc.documentId}/`
        });
        
        if (chunkFiles.length === 0) {
          this.log(`No chunks found for ${doc.documentId}`);
          continue;
        }
        
        const chunkResults = [];
        
        for (const chunkFile of chunkFiles) {
          const chunkName = path.basename(chunkFile.name);
          const targetPath = `cg/sections/b7/chunks/${doc.documentId}/${chunkName}`;
          const targetFile = this.bucket.file(targetPath);
          
          // Download, enhance, and re-upload chunk
          const [chunkContent] = await chunkFile.download();
          const chunkData = JSON.parse(chunkContent.toString());
          
          // Enhance chunk with CG metadata
          const enhancedChunk = {
            ...chunkData,
            migration_info: {
              migrated_from: chunkFile.name,
              migration_date: new Date().toISOString(),
              enhanced_for_cg: true
            },
            cg_processing: {
              ready_for_optimization: true,
              cross_reference_ready: true,
              validation_pending: true
            }
          };
          
          await targetFile.save(JSON.stringify(enhancedChunk, null, 2), {
            metadata: {
              contentType: 'application/json',
              migrated_chunk: 'true',
              cg_enhanced: 'true'
            }
          });
          
          chunkResults.push(chunkName);
        }
        
        console.log(`✓ Migrated ${chunkResults.length} chunks for ${doc.documentId}`);
        this.log(`Successfully migrated ${chunkResults.length} chunks for ${doc.documentId}`);
        
        results.push({
          success: true,
          documentId: doc.documentId,
          chunksCount: chunkResults.length,
          chunks: chunkResults,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`✗ Failed to migrate chunks for ${doc.documentId}: ${error.message}`);
        this.log(`Failed to migrate chunks for ${doc.documentId}: ${error.message}`, 'error');
        
        results.push({
          success: false,
          documentId: doc.documentId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
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
   * Migrate optimized JSON files
   */
  async migrateOptimized(documents) {
    const results = [];
    
    console.log('\n--- Migrating Optimized JSON Files ---');
    
    for (const doc of documents) {
      try {
        const sourcePath = `bible/sections/b7/optimized/${doc.documentId}.optimized.json`;
        const sourceFile = this.bucket.file(sourcePath);
        
        // Check if optimized file exists
        const [exists] = await sourceFile.exists();
        if (!exists) {
          this.log(`No optimized file found for ${doc.documentId}`);
          continue;
        }
        
        // Download and enhance optimized data
        const [optimizedContent] = await sourceFile.download();
        const optimizedData = JSON.parse(optimizedContent.toString());
        
        // Enhance with CG metadata
        const enhancedOptimized = {
          ...optimizedData,
          migration_info: {
            migrated_from: sourcePath,
            migration_date: new Date().toISOString(),
            enhanced_for_cg: true,
            migration_tool: 'migrate-b7-to-cg.js'
          },
          cg_enhancements: {
            performance_optimized: true,
            cross_reference_enhanced: true,
            validation_ready: true,
            handoff_compatible: true
          }
        };
        
        // Upload to CG location with Bible Access Module compatible naming
        // CRITICAL: Apply _document suffix for Bible Access Module compatibility
        const targetFileName = this.generateBibleAccessCompatibleFileName(doc.documentId);
        const targetPath = `cg/sections/b7/optimized/${targetFileName}`;
        const targetFile = this.bucket.file(targetPath);
        
        await targetFile.save(JSON.stringify(enhancedOptimized, null, 2), {
          metadata: {
            contentType: 'application/json',
            migrated_optimized: 'true',
            cg_enhanced: 'true'
          }
        });
        
        console.log(`✓ Migrated optimized: ${doc.documentId}`);
        this.log(`Successfully migrated optimized file: ${doc.documentId}`);
        
        results.push({
          success: true,
          documentId: doc.documentId,
          sourcePath,
          targetPath,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`✗ Failed to migrate optimized for ${doc.documentId}: ${error.message}`);
        this.log(`Failed to migrate optimized for ${doc.documentId}: ${error.message}`, 'error');
        
        results.push({
          success: false,
          documentId: doc.documentId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Migrate analysis files
   */
  async migrateAnalysis(documents) {
    const results = [];
    
    console.log('\n--- Migrating Analysis Files ---');
    
    // Analysis files are typically stored locally, check if they exist
    // and migrate them to Firebase Storage for CG processing
    
    const analysisDir = path.join(__dirname, '../../testing/B2-automation 2/analysis');
    
    for (const doc of documents) {
      try {
        const analysisFile = path.join(analysisDir, `${doc.documentId}_content_analysis.json`);
        const fileExists = await fs.access(analysisFile).then(() => true).catch(() => false);
        
        if (!fileExists) {
          this.log(`No analysis file found for ${doc.documentId}`);
          continue;
        }
        
        // Read and enhance analysis
        const analysisContent = await fs.readFile(analysisFile, 'utf8');
        const analysisData = JSON.parse(analysisContent);
        
        // Enhance with CG metadata
        const enhancedAnalysis = {
          ...analysisData,
          migration_info: {
            migrated_from: 'local_analysis',
            migration_date: new Date().toISOString(),
            enhanced_for_cg: true
          },
          cg_analysis_enhancements: {
            performance_metrics_ready: true,
            validation_criteria_added: true,
            handoff_compatible: true
          }
        };
        
        // Upload to Firebase Storage
        const targetPath = `cg/sections/b7/analysis/${doc.documentId}_analysis.json`;
        const targetFile = this.bucket.file(targetPath);
        
        await targetFile.save(JSON.stringify(enhancedAnalysis, null, 2), {
          metadata: {
            contentType: 'application/json',
            migrated_analysis: 'true',
            cg_enhanced: 'true'
          }
        });
        
        console.log(`✓ Migrated analysis: ${doc.documentId}`);
        this.log(`Successfully migrated analysis: ${doc.documentId}`);
        
        results.push({
          success: true,
          documentId: doc.documentId,
          sourcePath: analysisFile,
          targetPath,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`✗ Failed to migrate analysis for ${doc.documentId}: ${error.message}`);
        this.log(`Failed to migrate analysis for ${doc.documentId}: ${error.message}`, 'error');
        
        results.push({
          success: false,
          documentId: doc.documentId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Update cross-references to point to CG locations
   */
  async updateCrossReferences(documents) {
    console.log('\n--- Updating Cross-References ---');
    
    try {
      // Find all cross-references that point to B7 documents
      const snapshot = await this.db.collection('bible_cross_references')
        .where('source_document_id', 'in', documents.map(d => d.documentId))
        .get();
      
      const updates = [];
      
      snapshot.forEach(doc => {
        updates.push(
          this.db.collection('cg_cross_references').doc(doc.id).set({
            ...doc.data(),
            migration_info: {
              migrated_from: 'bible_cross_references',
              migration_date: new Date().toISOString(),
              enhanced_for_cg: true
            },
            cg_enhanced: true,
            system: 'cg'
          })
        );
      });
      
      await Promise.all(updates);
      
      console.log(`✓ Updated ${updates.length} cross-references`);
      this.log(`Successfully updated ${updates.length} cross-references`);
      
    } catch (error) {
      console.error(`✗ Failed to update cross-references: ${error.message}`);
      this.log(`Failed to update cross-references: ${error.message}`, 'error');
    }
  }

  /**
   * Find existing metadata for a document
   */
  async findExistingMetadata(documentId) {
    try {
      const doc = await this.db.collection('bible_storage_metadata').doc(documentId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      this.log(`Error finding existing metadata for ${documentId}: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Create enhanced CG metadata from existing B7 metadata
   */
  createEnhancedCGMetadata(doc, existingMetadata) {
    const timestamp = new Date();
    
    return {
      // Core identification
      id: doc.documentId,
      section: 'b7',
      subsection: doc.documentId.toLowerCase(),
      fileName: doc.fileName,
      documentType: 'workflow_documentation',
      
      // Migration info
      migration_info: {
        migrated_from: 'bible_sections_b7',
        migration_date: timestamp.toISOString(),
        original_metadata_preserved: !!existingMetadata,
        migration_tool: 'migrate-b7-to-cg.js'
      },
      
      // Storage references (updated to CG paths)
      storagePath: `cg/sections/b7/raw/${doc.fileName}`,
      downloadUrl: null, // Will be updated after successful migration
      
      // CG Processing Pipeline Status
      cgProcessingStatus: {
        raw: {
          completed: true,
          timestamp: timestamp,
          path: `cg/sections/b7/raw/${doc.fileName}`,
          migrated: true
        },
        metadata: {
          completed: true,
          timestamp: timestamp,
          migrated: true,
          enhanced: true
        },
        analysis: {
          completed: false,
          timestamp: null,
          requires_reprocessing: true
        },
        chunks: {
          completed: false,
          timestamp: null,
          requires_reprocessing: true
        },
        optimized: {
          completed: false,
          timestamp: null,
          requires_reprocessing: true
        },
        crossReferences: {
          completed: false,
          timestamp: null,
          requires_reprocessing: true
        },
        validation: {
          completed: false,
          timestamp: null,
          requires_validation: true
        }
      },
      
      // Enhanced methodology
      cgMethodology: {
        version: 'CG-v1.0',
        basedOn: 'B7-migration-enhanced',
        migrationEnhanced: true,
        productionReady: true
      },
      
      // Timestamps
      createdAt: timestamp,
      updatedAt: timestamp,
      migratedAt: timestamp,
      
      // Original metadata (if available)
      originalMetadata: existingMetadata || null,
      
      // CG-specific enhancements
      cgEnhancements: {
        performanceOptimized: true,
        handoffReady: true,
        validationRequired: true,
        crossReferenceEnhanced: true
      }
    };
  }

  /**
   * Generate document ID from filename
   */
  generateDocumentId(fileName) {
    return fileName.replace(/\.(md|txt)$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Logging utility
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.migrationLog.push(logEntry);
    
    if (level === 'error') {
      console.error(`[${timestamp}] ERROR: ${message}`);
    } else {
      console.log(`[${timestamp}] ${message}`);
    }
  }

  /**
   * Generate comprehensive migration report
   */
  async generateMigrationReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      tool: 'CG B7 Migration Tool v1.0',
      migration_summary: {
        raw_documents: {
          total: results.raw.length,
          successful: results.raw.filter(r => r.success).length,
          failed: results.raw.filter(r => !r.success).length
        },
        metadata: {
          total: results.metadata.length,
          successful: results.metadata.filter(r => r.success).length,
          failed: results.metadata.filter(r => !r.success).length
        },
        chunks: {
          total: results.chunks.length,
          successful: results.chunks.filter(r => r.success).length,
          failed: results.chunks.filter(r => !r.success).length,
          total_chunks_migrated: results.chunks.filter(r => r.success)
            .reduce((sum, r) => sum + (r.chunksCount || 0), 0)
        },
        optimized: {
          total: results.optimized.length,
          successful: results.optimized.filter(r => r.success).length,
          failed: results.optimized.filter(r => !r.success).length
        },
        analysis: {
          total: results.analysis.length,
          successful: results.analysis.filter(r => r.success).length,
          failed: results.analysis.filter(r => !r.success).length
        }
      },
      detailed_results: results,
      migration_log: this.migrationLog,
      next_steps: [
        'Run validate-cg-performance.js to validate migrated content',
        'Execute process-cg-complete.js to reprocess all documents',
        'Update CK continuity to reflect B7 CG migration completion',
        'Test handoff generation with migrated B7 documents'
      ]
    };

    // Save report
    const reportPath = path.join(__dirname, `../../logs/b7-migration-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✓ Migration report saved: ${reportPath}`);
    
    return report;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    console.log('CG B7 Migration Tool v1.0');
    console.log('Migrating B7 workflow documentation to CG processing system...\n');

    const migrationTool = new CGB7MigrationTool();
    
    try {
      const report = await migrationTool.migrateB7Documents();
      
      console.log('\n=== Final Migration Report ===');
      console.log(JSON.stringify(report.migration_summary, null, 2));
      
      const totalSuccess = Object.values(report.migration_summary)
        .reduce((sum, category) => sum + category.successful, 0);
      const totalFailed = Object.values(report.migration_summary)
        .reduce((sum, category) => sum + category.failed, 0);
      
      console.log(`\nOverall Success Rate: ${((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(2)}%`);
      
      if (totalFailed > 0) {
        console.log(`⚠️  ${totalFailed} items failed migration - check report for details`);
        process.exit(1);
      } else {
        console.log('🎉 All B7 documents successfully migrated to CG system!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('Migration Tool Error:', error.message);
      process.exit(1);
    }
  }

  main();
}

export default CGB7MigrationTool;