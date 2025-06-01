/**
 * Test Configuration for B2 Automation Testing
 * Mirrors production setup with test-specific paths
 */

const path = require('path');

module.exports = {
  // Firebase configuration
  serviceAccount: require(path.join(__dirname, '../../../config/serviceAccountKey.json')),
  storageBucket: 'karmacash-6e8f5.appspot.com',
  
  // Testing environment settings
  environment: 'test',
  makePublic: false, // Keep test files private
  
  // Collection names for testing (can be switched to test collections if needed)
  collections: {
    metadata: 'bible_storage_metadata', // Production collection for now
    crossReferences: 'bible_cross_references',
    summaries: 'summaries/M5/items'
  },
  
  // Storage paths
  storagePaths: {
    base: 'bible/sections',
    testBase: 'bible/testing/b2-automation', // Alternative test path if needed
    stages: {
      raw: 'raw',
      analysis: 'analysis',
      chunks: 'chunks',
      optimized: 'optimized'
    }
  },
  
  // B1 Quality Standards (baseline reference)
  qualityStandards: {
    structuralIntegrity: {
      h2h3Hierarchy: true,
      preserveFormatting: true,
      maintainLinks: true
    },
    crossReferenceAccuracy: {
      patternDetection: 0.95, // 95% minimum
      contextPreservation: true,
      bidirectionalMapping: true
    },
    contentPreservation: {
      zeroLoss: true,
      semanticIntegrity: true,
      metadataCompleteness: true
    }
  },
  
  // Automation approaches to test
  automationMethods: {
    manual: {
      name: 'Manual Baseline',
      description: 'Full B1 methodology applied manually',
      steps: ['raw', 'metadata', 'analysis', 'chunking', 'optimization', 'cross-reference']
    },
    semiAutomated: {
      name: 'Semi-Automated',
      description: 'Scripts for upload/metadata, manual for analysis/optimization',
      automated: ['raw', 'metadata'],
      manual: ['analysis', 'chunking', 'optimization', 'cross-reference']
    },
    templateDriven: {
      name: 'Template-Driven',
      description: 'Pre-built templates with CG validation',
      templates: ['analysis', 'chunking', 'optimization'],
      validation: 'cg-review'
    }
  },
  
  // Test file configuration
  testFile: {
    source: 'B2.1_Design_Philosophy.md',
    section: 'b2',
    subsection: 'b2.1',
    expectedChunks: 5, // Estimated based on content structure
    expectedCrossRefs: 10 // Estimated [BX.Y] references
  },
  
  // Logging configuration
  logging: {
    level: 'debug',
    outputDir: path.join(__dirname, '../logs'),
    format: 'json'
  },
  
  // Timeout settings (ms)
  timeouts: {
    upload: 30000,
    processing: 60000,
    batch: 180000
  },
  
  // Validation settings
  validation: {
    enforceB1Standards: true,
    requireManualReview: false,
    autoGenerateReports: true
  }
};