/**
 * Native Firebase SDK Helper for Background Agents
 * Fallback solution when MCP tools are not available
 * SECURE VERSION - Uses environment variables only
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

class FirebaseHelper {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Use environment variables - NO hardcoded paths
      const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
      
      if (!serviceAccountPath) {
        throw new Error('SERVICE_ACCOUNT_KEY_PATH environment variable not set');
      }
      
      if (!storageBucket) {
        throw new Error('FIREBASE_STORAGE_BUCKET environment variable not set');
      }
      
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: storageBucket
      });

      this.db = getFirestore(app);
      this.initialized = true;
      console.log('✅ Firebase initialized for background agent');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async getDocument(collection, documentId) {
    await this.initialize();
    
    try {
      const doc = await this.db.collection(collection).doc(documentId).get();
      
      if (!doc.exists) {
        return { exists: false, id: documentId };
      }

      return {
        exists: true,
        id: documentId,
        path: `${collection}/${documentId}`,
        data: doc.data()
      };
    } catch (error) {
      console.error(`❌ Error getting document ${collection}/${documentId}:`, error);
      throw error;
    }
  }

  async setDocument(collection, documentId, data, merge = false) {
    await this.initialize();
    
    try {
      const docRef = this.db.collection(collection).doc(documentId);
      await docRef.set(data, { merge });
      
      console.log(`✅ Document created: ${collection}/${documentId}`);
      return { success: true, path: `${collection}/${documentId}` };
    } catch (error) {
      console.error(`❌ Error setting document ${collection}/${documentId}:`, error);
      throw error;
    }
  }

  // Simulate getTaskContent functionality
  async getTaskContent(taskId, options = {}) {
    const taskDoc = await this.getDocument('test_tasks', taskId);
    
    if (!taskDoc.exists) {
      throw new Error(`Task ${taskId} not found`);
    }

    return {
      task: taskDoc.data,
      crossReferences: [],
      implementationGuidance: [],
      documentationRefs: []
    };
  }

  // Simulate getBibleSection functionality  
  async getBibleSection(documentId) {
    const bibleDoc = await this.getDocument('bible', documentId);
    
    if (!bibleDoc.exists) {
      throw new Error(`Bible section ${documentId} not found`);
    }

    return {
      success: true,
      documentId,
      data: bibleDoc.data
    };
  }

  // Simulate getCKModule functionality
  async getCKModule(moduleId) {
    const moduleDoc = await this.getDocument('ck_modules', moduleId);
    
    if (!moduleDoc.exists) {
      throw new Error(`CK Module ${moduleId} not found`);
    }

    return {
      success: true,
      moduleId,
      data: moduleDoc.data
    };
  }
}

// Export singleton instance
const firebaseHelper = new FirebaseHelper();

export {
  FirebaseHelper,
  firebaseHelper
};

// Direct function exports for easy use
export const getDocument = (collection, documentId) => firebaseHelper.getDocument(collection, documentId);
export const setDocument = (collection, documentId, data, merge) => firebaseHelper.setDocument(collection, documentId, data, merge);
export const getTaskContent = (taskId, options) => firebaseHelper.getTaskContent(taskId, options);
export const getBibleSection = (documentId) => firebaseHelper.getBibleSection(documentId);
export const getCKModule = (moduleId) => firebaseHelper.getCKModule(moduleId);
