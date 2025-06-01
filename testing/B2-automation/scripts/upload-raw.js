import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { promises as fs, statSync, readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Upload raw Bible documentation files to Firebase Storage
 * Based on B1 successful methodology
 */
class RawUploadAutomation {
  constructor(configPath) {
    this.configPath = configPath;
    this.app = initializeApp({
      credential: cert(this.config.serviceAccount),
      storageBucket: this.config.storageBucket
    });
    this.bucket = getStorage().bucket();
  }

  /**
   * Generate file metadata following B1 standards
   */
  generateMetadata(filePath, section) {
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const contentHash = crypto.createHash('md5').update(fileContent).digest('hex');

    return {
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
  }

  /**
   * Upload file to Firebase Storage with proper path structure
   */
  async uploadFile(localPath, section) {
    try {
      const fileName = path.basename(localPath);
      const storagePath = `bible/sections/${section}/raw/${fileName}`;
      const metadata = this.generateMetadata(localPath, section);

      console.log(`Uploading ${fileName} to ${storagePath}...`);

      const file = this.bucket.file(storagePath);
      const fileContent = await fs.readFile(localPath);

      await file.save(fileContent, {
        metadata: {
          metadata: metadata,
          contentType: 'text/markdown'
        }
      });

      // Make file publicly readable (if needed for testing)
      if (this.config.makePublic) {
        await file.makePublic();
      }

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
        fileName
      };

    } catch (error) {
      console.error(`✗ Upload failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(filePaths, section) {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await this.uploadFile(filePath, section);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\nBatch upload complete:`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);

    return results;
  }

  /**
   * Upload with validation following B1 quality standards
   */
  async uploadWithValidation(localPath, section) {
    // Pre-upload validation
    const fileExists = await fs.access(localPath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${localPath}`);
    }

    const stats = await fs.stat(localPath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${localPath}`);
    }

    // Check file extension
    if (!localPath.endsWith('.md')) {
      throw new Error(`Invalid file type. Expected .md file: ${localPath}`);
    }

    // Perform upload
    return await this.uploadFile(localPath, section);
  }
}

// Export for use in testing
module.exports = RawUploadAutomation;

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node upload-raw.js <file-path> <section>');
    console.log('Example: node upload-raw.js ../test-data/B2.1_Design_Philosophy.md b2');
    process.exit(1);
  }

  const [filePath, section] = args;
  const configPath = path.join(__dirname, '../config/test-config.js');
  
  const uploader = new RawUploadAutomation(configPath);
  
  uploader.uploadWithValidation(filePath, section)
    .then(result => {
      console.log('\nUpload result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Upload error:', error.message);
      process.exit(1);
    });
}