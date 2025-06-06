#!/usr/bin/env node

/**
 * CG Production-Ready Raw Upload Tool
 * Based on successful B2 automation testing methodology
 * Production environment with enhanced error handling and logging
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CGRawUploadTool {
  constructor() {
    this.initialized = false;
    this.config = null;
    this.bucket = null;
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
      this.initialized = true;
      console.log('✓ CG Raw Upload Tool initialized');
      
    } catch (error) {
      console.error('✗ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive metadata following CG standards
   */
  generateCGMetadata(filePath, section, documentType = 'foundational') {
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

    return {
      originalName: fileName,
      section: section,
      subsection: fileName.replace(/\.(md|txt)$/, '').toLowerCase(),
      documentType: documentType,
      uploadDate: new Date().toISOString(),
      fileSize: stats.size,
      contentHash: contentHash,
      mimeType: fileName.endsWith('.md') ? 'text/markdown' : 'text/plain',
      processingStage: 'raw',
      cgToolVersion: '1.0',
      qualityStandards: 'B1-enhanced',
      productionReady: true
    };
  }

  /**
   * Upload file with production-grade validation and error handling
   */
  async uploadFile(localPath, section, documentType = 'foundational') {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Pre-upload validation
      await this.validateFile(localPath);
      
      const fileName = path.basename(localPath);
      const storagePath = `cg/sections/${section}/raw/${fileName}`;
      const metadata = this.generateCGMetadata(localPath, section, documentType);

      console.log(`Uploading ${fileName} to ${storagePath}...`);

      const file = this.bucket.file(storagePath);
      const fileContent = await fs.readFile(localPath);

      await file.save(fileContent, {
        metadata: {
          metadata: metadata,
          contentType: metadata.mimeType,
          cacheControl: 'public, max-age=3600'
        }
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '01-01-2030'
      });

      console.log(`✓ Upload complete: ${fileName}`);
      
      return {
        success: true,
        storagePath,
        downloadUrl: url,
        metadata,
        fileName,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`✗ Upload failed for ${path.basename(localPath)}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        filePath: localPath,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Production-grade file validation
   */
  async validateFile(filePath) {
    // Check file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${filePath}`);
    }

    if (stats.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error(`File too large (>50MB): ${filePath}`);
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!['.md', '.txt'].includes(ext)) {
      throw new Error(`Invalid file type. Expected .md or .txt: ${filePath}`);
    }

    // Basic content validation
    const content = await fs.readFile(filePath, 'utf8');
    if (content.trim().length === 0) {
      throw new Error(`File contains no content: ${filePath}`);
    }
  }

  /**
   * Batch upload with comprehensive reporting
   */
  async batchUpload(filePaths, section, documentType = 'foundational') {
    const results = [];
    const startTime = Date.now();
    
    console.log(`\n=== CG Batch Upload Started ===`);
    console.log(`Files: ${filePaths.length}`);
    console.log(`Section: ${section}`);
    console.log(`Document Type: ${documentType}\n`);
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      console.log(`[${i + 1}/${filePaths.length}] Processing: ${path.basename(filePath)}`);
      
      const result = await this.uploadFile(filePath, section, documentType);
      results.push(result);
      
      // Brief pause between uploads to avoid rate limits
      if (i < filePaths.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const endTime = Date.now();
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n=== CG Batch Upload Complete ===`);
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
   * Generate upload report for documentation
   */
  async generateUploadReport(batchResult, outputPath = null) {
    const report = {
      timestamp: new Date().toISOString(),
      tool: 'CG Raw Upload Tool v1.0',
      summary: batchResult.summary,
      successful_uploads: batchResult.results.filter(r => r.success),
      failed_uploads: batchResult.results.filter(r => !r.success),
      quality_metrics: {
        success_rate: ((batchResult.summary.successful / batchResult.summary.total) * 100).toFixed(2) + '%',
        average_file_size: this.calculateAverageFileSize(batchResult.results),
        total_storage_used: this.calculateTotalStorage(batchResult.results)
      }
    };

    if (outputPath) {
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
      console.log(`✓ Upload report saved: ${outputPath}`);
    }

    return report;
  }

  calculateAverageFileSize(results) {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return 0;
    
    const totalSize = successful.reduce((sum, r) => sum + (r.metadata?.fileSize || 0), 0);
    return Math.round(totalSize / successful.length);
  }

  calculateTotalStorage(results) {
    return results.filter(r => r.success)
      .reduce((sum, r) => sum + (r.metadata?.fileSize || 0), 0);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  async function main() {
    if (args.length < 2) {
      console.log('CG Raw Upload Tool v1.0');
      console.log('Usage: node upload-cg-raw.js <file-path> <section> [document-type]');
      console.log('       node upload-cg-raw.js <directory> <section> --batch [document-type]');
      console.log('');
      console.log('Examples:');
      console.log('  node upload-cg-raw.js docs/B1.1.md b1');
      console.log('  node upload-cg-raw.js docs/ b1 --batch foundational');
      process.exit(1);
    }

    const uploader = new CGRawUploadTool();
    
    try {
      const [inputPath, section, ...options] = args;
      const isBatch = options.includes('--batch');
      const documentType = options.find(opt => !opt.startsWith('--')) || 'foundational';

      if (isBatch) {
        // Batch mode
        const files = await fs.readdir(inputPath);
        const filePaths = files
          .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
          .map(f => path.join(inputPath, f));
        
        if (filePaths.length === 0) {
          console.log('No .md or .txt files found in directory');
          process.exit(1);
        }

        const result = await uploader.batchUpload(filePaths, section, documentType);
        const report = await uploader.generateUploadReport(result);
        
        console.log('\nFinal Report:');
        console.log(JSON.stringify(report.summary, null, 2));
        
      } else {
        // Single file mode
        const result = await uploader.uploadFile(inputPath, section, documentType);
        
        console.log('\nUpload Result:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      }
      
    } catch (error) {
      console.error('CG Upload Tool Error:', error.message);
      process.exit(1);
    }
  }

  main();
}

export default CGRawUploadTool;