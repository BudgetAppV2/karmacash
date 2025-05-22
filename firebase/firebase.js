/**
 * Firebase initialization and utility functions
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { TemplateModel } = require('../models/template-exchange-schema');

let firebaseApp;
let db;
let templateModel;

/**
 * Initialize Firebase with the provided service account credentials
 * @param {Object} serviceAccount - Service account credentials object
 * @returns {Object} The initialized Firebase app
 */
function initializeFirebase(serviceAccount) {
  if (!firebaseApp) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    // Enable Firestore timestamp settings
    db = getFirestore();
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true,
    });
    
    // Initialize the template model
    templateModel = new TemplateModel(db);
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

module.exports = {
  initializeFirebase,
  getFirebaseApp,
  getDb,
  getTemplateModel,
}; 