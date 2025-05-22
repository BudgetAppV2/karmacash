/**
 * Firestore Configuration Module
 * 
 * This module handles the initialization and configuration of Firestore
 * for the Template Exchange System, including performance optimizations
 * and collection settings.
 */

const admin = require('firebase-admin');
const { TemplateModel } = require('../models/template-exchange-schema');

/**
 * Constants for collection configuration
 */
const COLLECTION_CONFIG = {
  NAME: 'templates',
  SHARDS: ['a', 'b', 'c'],
  CACHE_SIZE: 50, // Size of the memory cache in MB
  PERSISTENCE: true, // Enable disk persistence
  SYNCHRONIZE_TIMEOUT: 10000, // Timeout for synchronization operations (10 seconds)
};

/**
 * Firestore configuration class
 */
class FirestoreConfig {
  constructor() {
    this.db = null;
    this.templateModel = null;
    this.initialized = false;
  }

  /**
   * Initialize Firestore with the provided settings
   * @param {Object} settings - Configuration settings
   * @param {boolean} settings.cacheSizeOverride - Override default cache size
   * @param {boolean} settings.persistenceOverride - Override default persistence setting
   * @returns {Object} Firestore instance and template model
   */
  initialize(settings = {}) {
    if (this.initialized) {
      return {
        db: this.db,
        templateModel: this.templateModel,
      };
    }

    // Get Firestore instance from admin SDK
    this.db = admin.firestore();

    // Configure Firestore settings
    this.db.settings({
      ignoreUndefinedProperties: true,
      cacheSizeMB: settings.cacheSizeOverride || COLLECTION_CONFIG.CACHE_SIZE,
      timestampsInSnapshots: true,
    });

    // Enable/disable persistence based on settings or default
    const persistence = settings.persistenceOverride !== undefined 
      ? settings.persistenceOverride 
      : COLLECTION_CONFIG.PERSISTENCE;

    if (persistence && typeof window !== 'undefined') {
      this.db.enablePersistence({
        synchronizeTabs: true,
        experimentalForceOwningTab: true,
      }).catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.warn('Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code === 'unimplemented') {
          // Current browser doesn't support persistence
          console.warn('Current browser does not support persistence');
        }
      });
    }

    // Initialize template model with the configured database
    this.templateModel = new TemplateModel(this.db);
    
    this.initialized = true;
    
    return {
      db: this.db,
      templateModel: this.templateModel,
    };
  }

  /**
   * Get the Firestore instance
   * @returns {Object} Firestore instance
   * @throws {Error} If Firestore is not initialized
   */
  getDb() {
    if (!this.initialized) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    
    return this.db;
  }

  /**
   * Get the template model instance
   * @returns {TemplateModel} Template model instance
   * @throws {Error} If Firestore is not initialized
   */
  getTemplateModel() {
    if (!this.initialized) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    
    return this.templateModel;
  }
  
  /**
   * Create the templates collection if it doesn't exist
   * @returns {Promise<void>}
   */
  async ensureTemplatesCollection() {
    if (!this.initialized) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    
    try {
      // In Firestore, collections are created implicitly when documents are added
      // We'll create a temporary document to ensure the collection exists, then delete it
      const tempDocRef = this.db.collection(COLLECTION_CONFIG.NAME).doc('_temp_init');
      
      await tempDocRef.set({
        _created: admin.firestore.FieldValue.serverTimestamp(),
        _purpose: 'Collection initialization',
      });
      
      await tempDocRef.delete();
      
      console.log(`Collection '${COLLECTION_CONFIG.NAME}' initialized successfully`);
    } catch (error) {
      console.error('Error initializing templates collection:', error);
      throw error;
    }
  }
  
  /**
   * Configure Firestore caching and performance settings
   * @param {Object} options - Configuration options
   * @param {number} options.cacheSizeMB - Size of the memory cache in MB
   * @param {boolean} options.enableOfflineCache - Enable offline caching
   * @param {number} options.syncTimeout - Timeout for synchronization operations
   * @returns {Promise<void>}
   */
  async configurePerformance(options = {}) {
    if (!this.initialized) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    
    // Set cache size if provided
    if (options.cacheSizeMB) {
      this.db.settings({
        ...this.db._settings,
        cacheSizeMB: options.cacheSizeMB,
      });
    }
    
    // Configure network timeout settings
    if (options.syncTimeout) {
      this.db.settings({
        ...this.db._settings,
        timeoutMillis: options.syncTimeout,
      });
    }
    
    console.log('Firestore performance settings configured');
  }
}

// Create and export a singleton instance
const firestoreConfig = new FirestoreConfig();

module.exports = {
  firestoreConfig,
  COLLECTION_CONFIG,
}; 