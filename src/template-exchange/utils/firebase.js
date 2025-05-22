/**
 * Firebase initialization and utility functions
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { TemplateModel } = require('../models/template-exchange-schema');
const { firestoreConfig, COLLECTION_CONFIG } = require('../firebase/firestore-config');

let firebaseApp;
let db;
let templateModel;

/**
 * Initialize Firebase with the provided service account credentials
 * @param {Object} serviceAccount - Service account credentials object
 * @param {Object} options - Configuration options
 * @param {boolean} options.enablePersistence - Enable offline persistence
 * @param {number} options.cacheSizeMB - Size of the memory cache in MB
 * @returns {Object} The initialized Firebase app, db, and templateModel
 */
function initializeFirebase(serviceAccount, options = {}) {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    // Initialize Firestore with configuration
    const firestoreSettings = {
      cacheSizeOverride: options.cacheSizeMB || COLLECTION_CONFIG.CACHE_SIZE,
      persistenceOverride: options.enablePersistence !== undefined 
        ? options.enablePersistence 
        : COLLECTION_CONFIG.PERSISTENCE,
    };
    
    const firestoreInit = firestoreConfig.initialize(firestoreSettings);
    db = firestoreInit.db;
    templateModel = firestoreInit.templateModel;
    
    // Ensure the templates collection exists
    firestoreConfig.ensureTemplatesCollection().catch(err => {
      console.warn('Error ensuring templates collection exists:', err);
    });
    
    // Configure performance settings
    firestoreConfig.configurePerformance({
      cacheSizeMB: options.cacheSizeMB,
      syncTimeout: options.syncTimeout || COLLECTION_CONFIG.SYNCHRONIZE_TIMEOUT,
    }).catch(err => {
      console.warn('Error configuring performance settings:', err);
    });
  }
  
  return {
    app: firebaseApp,
    db,
    templateModel,
  };
}

/**
 * Get the Firebase application instance
 * @returns {Object} The Firebase app instance
 * @throws {Error} If Firebase has not been initialized
 */
function getFirebaseApp() {
  if (!firebaseApp) {
    throw new Error('Firebase app not initialized. Call initializeFirebase first.');
  }
  
  return firebaseApp;
}

/**
 * Get the Firestore database instance
 * @returns {Object} The Firestore database instance
 * @throws {Error} If Firebase has not been initialized
 */
function getDb() {
  if (!db) {
    throw new Error('Firebase app not initialized. Call initializeFirebase first.');
  }
  
  return db;
}

/**
 * Get the Template Model instance for working with templates
 * @returns {TemplateModel} The Template Model instance
 * @throws {Error} If Firebase has not been initialized
 */
function getTemplateModel() {
  if (!templateModel) {
    throw new Error('Firebase app not initialized. Call initializeFirebase first.');
  }
  
  return templateModel;
}

/**
 * Get the collection configuration constants
 * @returns {Object} Collection configuration constants
 */
function getCollectionConfig() {
  return COLLECTION_CONFIG;
}

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  getDb,
  getTemplateModel,
  getCollectionConfig,
}; 