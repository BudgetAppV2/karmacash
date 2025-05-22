/**
 * Template Exchange System - Firestore Data Model
 * 
 * This file defines the data structure for templates exchanged between 
 * Google AI Studio and Cursor AI.
 */

const { Timestamp, FieldValue } = require('firebase-admin/firestore');

/**
 * Base schema for validating template documents
 * 
 * Following best practices:
 * - Using clear field naming conventions
 * - Avoiding nested structures when not necessary for queries
 * - Including timestamps for tracking and sorting
 * - Including type validation helpers
 */
const TemplateSchema = {
  // Unique identifier for the session (e.g., "M5.S4")
  sessionId: {
    type: 'string',
    required: true,
    validate: (value) => /^[A-Z]\d+\.[A-Z]\d+$/.test(value)
  },
  
  // Type of template (handoff/summary)
  type: {
    type: 'string',
    required: true,
    validate: (value) => ['handoff', 'summary'].includes(value)
  },
  
  // Content of the template
  content: {
    type: 'string',
    required: true,
    maxLength: 50000 // Limit content size
  },
  
  // Creation timestamp (automatically set on creation)
  createdAt: {
    type: 'timestamp',
    required: true,
    default: () => FieldValue.serverTimestamp()
  },
  
  // Last updated timestamp (automatically updated)
  updatedAt: {
    type: 'timestamp',
    required: true,
    default: () => FieldValue.serverTimestamp()
  },
  
  // Status of the template (draft, active, archived)
  status: {
    type: 'string',
    required: true,
    validate: (value) => ['draft', 'active', 'archived'].includes(value),
    default: () => 'draft'
  },
  
  // Optional metadata for additional information
  metadata: {
    type: 'map',
    required: false,
    properties: {
      // Source platform (Google AI Studio or Cursor)
      source: {
        type: 'string',
        validate: (value) => ['google_ai_studio', 'cursor'].includes(value)
      },
      // User who created the template
      createdBy: {
        type: 'string'
      },
      // Tags for categorization
      tags: {
        type: 'array',
        itemType: 'string'
      },
      // Version number
      version: {
        type: 'number',
        default: () => 1
      }
    }
  }
};

/**
 * Model representing a template collection in Firestore
 * 
 * Using sharded approach for timestamp fields to avoid the 500 writes/second limitation
 * as recommended in Firestore best practices for collections with sequential timestamp values
 */
class TemplateModel {
  constructor(db) {
    this.collection = db.collection('templates');
    this.shards = ['a', 'b', 'c']; // Using 3 shards to support up to 1500 writes/sec
  }
  
  /**
   * Helper to get a random shard value
   * @returns {string} - A random shard value
   */
  getRandomShard() {
    return this.shards[Math.floor(Math.random() * this.shards.length)];
  }
  
  /**
   * Create a new template document
   * @param {Object} data - Template data
   * @returns {Promise<DocumentReference>} - Reference to the created document
   */
  async create(data) {
    // Validate required fields
    this.validate(data);
    
    // Add timestamps and shard
    const now = Timestamp.now();
    const templateData = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      shard: this.getRandomShard(), // Add shard field for query optimization
    };
    
    // Add default values for optional fields if not provided
    if (!templateData.status) {
      templateData.status = 'draft';
    }
    
    if (!templateData.metadata) {
      templateData.metadata = {};
    }
    
    if (!templateData.metadata.version) {
      templateData.metadata.version = 1;
    }
    
    // Create the document
    const docRef = await this.collection.add(templateData);
    return docRef;
  }
  
  /**
   * Update an existing template
   * @param {string} id - Document ID
   * @param {Object} data - Updated template data
   * @returns {Promise<WriteResult>} - Write result
   */
  async update(id, data) {
    // Remove fields that shouldn't be updated
    const { createdAt, shard, ...updateData } = data;
    
    // Add updated timestamp
    updateData.updatedAt = Timestamp.now();
    
    // Update the document
    return await this.collection.doc(id).update(updateData);
  }
  
  /**
   * Get a template by ID
   * @param {string} id - Document ID
   * @returns {Promise<DocumentSnapshot>} - Document snapshot
   */
  async getById(id) {
    return await this.collection.doc(id).get();
  }
  
  /**
   * Query templates by session ID
   * @param {string} sessionId - Session ID to filter by
   * @returns {Promise<Array<DocumentSnapshot>>} - Array of document snapshots
   */
  async getBySessionId(sessionId) {
    // Query across all shards
    const snapshots = await Promise.all(
      this.shards.map(shard => 
        this.collection
          .where('shard', '==', shard)
          .where('sessionId', '==', sessionId)
          .get()
      )
    );
    
    // Combine results
    let results = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        results.push(doc);
      });
    });
    
    return results;
  }
  
  /**
   * Query templates by type with pagination
   * @param {string} type - Template type (handoff/summary)
   * @param {number} limit - Max number of results to return
   * @param {DocumentSnapshot} startAfter - Document to start after for pagination
   * @returns {Promise<Array<DocumentSnapshot>>} - Array of document snapshots
   */
  async getByType(type, limit = 10, startAfter = null) {
    // Query across all shards
    const queries = this.shards.map(shard => {
      let query = this.collection
        .where('shard', '==', shard)
        .where('type', '==', type)
        .orderBy('updatedAt', 'desc')
        .limit(limit);
      
      if (startAfter) {
        query = query.startAfter(startAfter);
      }
      
      return query.get();
    });
    
    const snapshots = await Promise.all(queries);
    
    // Combine and sort results
    let results = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        results.push(doc);
      });
    });
    
    // Sort by updatedAt in descending order
    results.sort((a, b) => {
      return b.data().updatedAt.toMillis() - a.data().updatedAt.toMillis();
    });
    
    // Limit to requested amount
    return results.slice(0, limit);
  }
  
  /**
   * Validate template data against schema
   * @param {Object} data - Template data to validate
   * @throws {Error} If validation fails
   */
  validate(data) {
    // Check required fields
    Object.entries(TemplateSchema).forEach(([field, schema]) => {
      if (schema.required && !data[field] && !schema.default) {
        throw new Error(`Required field '${field}' is missing`);
      }
      
      if (data[field] && schema.validate) {
        if (!schema.validate(data[field])) {
          throw new Error(`Field '${field}' failed validation`);
        }
      }
      
      if (data[field] && schema.type === 'string' && schema.maxLength) {
        if (data[field].length > schema.maxLength) {
          throw new Error(`Field '${field}' exceeds maximum length of ${schema.maxLength}`);
        }
      }
    });
  }
}

module.exports = {
  TemplateSchema,
  TemplateModel
}; 