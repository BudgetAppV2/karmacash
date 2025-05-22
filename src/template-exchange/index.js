/**
 * Template Exchange System
 * 
 * Main entry point that exports all public components of the template exchange system.
 */

// Export Firebase utilities
const {
  initializeFirebase,
  getFirebaseApp,
  getDb,
  getTemplateModel,
  getCollectionConfig
} = require('./utils/firebase');

// Export data models
const {
  TemplateSchema,
  TemplateModel
} = require('./models/template-exchange-schema');

// Export Firestore configuration
const {
  firestoreConfig,
  COLLECTION_CONFIG
} = require('./firebase/firestore-config');

// Export Template Service
const templateService = require('./services/template-service');

// Export Cloud Functions API
const templateApi = require('./functions/api/template-api');

// Export the public API
module.exports = {
  // Firebase utilities
  initializeFirebase,
  getFirebaseApp,
  getDb,
  getTemplateModel,
  getCollectionConfig,
  
  // Data models
  TemplateSchema,
  TemplateModel,
  
  // Firestore configuration
  firestoreConfig,
  COLLECTION_CONFIG,
  
  // Template Service
  templateService,
  
  // Cloud Functions API
  templateApi
}; 