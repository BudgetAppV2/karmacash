const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

/**
 * Create Firestore metadata for Bible documentation
 * Following B1 proven methodology
 */
class MetadataCreationAutomation {
  constructor(configPath) {
    this.config = require(configPath);
    this.app = initializeApp({
      credential: cert(this.config.serviceAccount)
    });
    this.db = getFirestore();
  }

  /**
   * Generate comprehensive metadata structure based on B1 standards
   */
  generateMetadataStructure(uploadResult, additionalInfo = {}) {
    const timestamp = new Date();
    
    return {
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
        characterCount: additionalInfo.characterCount || 0,
        lineCount: additionalInfo.lineCount || 0,
        wordCount: additionalInfo.wordCount || 0
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
      tags: additionalInfo.tags || [],
      keywords: additionalInfo.keywords || [],
      automationType: additionalInfo.automationType || 'manual'
    };
  }

  /**
   * Create metadata document in Firestore
   */
  async createMetadata(uploadResult, additionalInfo = {}) {
    try {
      const metadata = this.generateMetadataStructure(uploadResult, additionalInfo);
      const docRef = this.db.collection('bible_storage_metadata').doc(metadata.id);
      
      console.log(`Creating metadata for ${metadata.id}...`);
      
      await docRef.set(metadata);
      
      console.log(`✓ Metadata created: ${metadata.id}`);
      
      return {
        success: true,
        documentId: metadata.id,
        metadata: metadata
      };
      
    } catch (error) {
      console.error(`✗ Metadata creation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch create metadata for multiple uploads
   */
  async batchCreateMetadata(uploadResults) {
    const results = [];
    
    for (const uploadResult of uploadResults) {
      if (uploadResult.success) {
        const result = await this.createMetadata(uploadResult);
        results.push(result);
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\nBatch metadata creation complete:`);
    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    
    return results;
  }

  /**
   * Update processing status for existing metadata
   */
  async updateProcessingStatus(documentId, stage, stageData) {
    try {
      const docRef = this.db.collection('bible_storage_metadata').doc(documentId);
      const updateData = {
        [`processingStatus.${stage}`]: {
          completed: true,
          timestamp: new Date(),
          ...stageData
        },
        updatedAt: new Date()
      };
      
      await docRef.update(updateData);
      
      console.log(`✓ Updated processing status for ${documentId}: ${stage}`);
      return { success: true };
      
    } catch (error) {
      console.error(`✗ Status update failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query metadata by section
   */
  async getMetadataBySection(section) {
    try {
      const snapshot = await this.db.collection('bible_storage_metadata')
        .where('section', '==', section)
        .get();
      
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
      
    } catch (error) {
      console.error(`Query failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate metadata against B1 standards
   */
  validateMetadata(metadata) {
    const requiredFields = [
      'id', 'section', 'subsection', 'fileName',
      'storagePath', 'downloadUrl', 'processingStatus',
      'contentMetadata', 'methodology'
    ];
    
    const missingFields = requiredFields.filter(field => !metadata[field]);
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missingFields.join(', ')}`]
      };
    }
    
    return { valid: true };
  }
}

// Export for use in testing
module.exports = MetadataCreationAutomation;

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node create-metadata.js <upload-result-json>');
    console.log('Example: node create-metadata.js \'{"success":true,"storagePath":"bible/sections/b2/raw/B2.1.md",...}\'');
    process.exit(1);
  }
  
  try {
    const uploadResult = JSON.parse(args[0]);
    const configPath = path.join(__dirname, '../config/test-config.js');
    
    const metadataCreator = new MetadataCreationAutomation(configPath);
    
    metadataCreator.createMetadata(uploadResult)
      .then(result => {
        console.log('\nMetadata result:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Metadata error:', error.message);
        process.exit(1);
      });
      
  } catch (error) {
    console.error('Invalid JSON input:', error.message);
    process.exit(1);
  }
}