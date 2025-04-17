// src/services/firebase/firestore.js

import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
  } from 'firebase/firestore';
import logger from '../logger';
import { db } from './firebaseInit';
  
/**
 * Get user settings from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User settings
 */
export const getUserSettings = async (userId) => {
  try {
    logger.debug('FirestoreService', 'getUserSettings', 'Fetching user settings');
    
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      logger.info('FirestoreService', 'getUserSettings', 'User settings retrieved successfully');
      return docSnap.data().settings || {};
    } else {
      // Create default settings if user doc doesn't exist
      const defaultSettings = {
        currency: 'CAD',
        balanceDisplayMode: 'cumulative'
      };
      
      await setDoc(docRef, {
        email: '', // Will be updated when user provides email later
        displayName: '', // Will be updated when user provides displayName later
        createdAt: serverTimestamp(),
        settings: defaultSettings
      });
      
      logger.info('FirestoreService', 'getUserSettings', 'Created default user settings');
      return defaultSettings;
    }
  } catch (error) {
    logger.error('FirestoreService', 'getUserSettings', 'Failed to get user settings', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Update user settings in Firestore
 * @param {string} userId - User ID
 * @param {Object} settings - New settings to update
 * @returns {Promise<void>}
 */
export const updateUserSettings = async (userId, settings) => {
  try {
    logger.debug('FirestoreService', 'updateUserSettings', 'Updating user settings');
    
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing settings
      await updateDoc(userRef, {
        'settings': { ...docSnap.data().settings, ...settings },
        'updatedAt': serverTimestamp()
      });
    } else {
      // Create new user document with settings
      await setDoc(userRef, {
        email: '', // Will be updated when user provides email later
        displayName: '', // Will be updated when user provides displayName later
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: settings
      });
    }
    
    logger.info('FirestoreService', 'updateUserSettings', 'User settings updated successfully');
  } catch (error) {
    logger.error('FirestoreService', 'updateUserSettings', 'Failed to update user settings', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Sync user profile data with Firestore
 * @param {Object} user - Firebase auth user object
 * @returns {Promise<void>}
 */
export const syncUserProfile = async (user) => {
  if (!user) return;
  
  try {
    logger.debug('FirestoreService', 'syncUserProfile', 'Syncing user profile data');
    
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          currency: 'CAD',
          balanceDisplayMode: 'cumulative'
        }
      });
    }
    
    logger.info('FirestoreService', 'syncUserProfile', 'User profile synced successfully');
  } catch (error) {
    logger.error('FirestoreService', 'syncUserProfile', 'Failed to sync user profile', {
      error: error.message,
      userId: user.uid
    });
    throw error;
  }
};

// Export Firestore instance for use in other modules if needed
export { db };