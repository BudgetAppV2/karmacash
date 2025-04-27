import { 
  collection,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';

/**
 * Get monthly data for a specific budget month
 * @param {string} budgetId - Budget ID
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Object|null>} - Monthly data document or null if not found
 */
export const getMonthlyData = async (budgetId, month) => {
  try {
    logger.debug('MonthlyDataService', 'getMonthlyData', 'Fetching monthly data', { 
      budgetId, 
      month 
    });
    
    const docRef = doc(db, `budgets/${budgetId}/monthlyData`, month);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      logger.info('MonthlyDataService', 'getMonthlyData', 'No data found for month', { 
        budgetId, 
        month 
      });
      return null;
    }
    
    const monthData = {
      id: snapshot.id, // month (YYYY-MM)
      ...snapshot.data()
    };
    
    logger.info('MonthlyDataService', 'getMonthlyData', 'Monthly data retrieved successfully', { 
      budgetId, 
      month 
    });
    
    return monthData;
  } catch (error) {
    logger.error('MonthlyDataService', 'getMonthlyData', 'Failed to fetch monthly data', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      month
    });
    throw error;
  }
};

/**
 * Create or update monthly data document
 * @param {string} budgetId - Budget ID
 * @param {string} month - Month in YYYY-MM format (e.g., "2025-04")
 * @param {string} userId - User ID of the editor/creator
 * @param {Object} data - Data to update (e.g. { allocations: { categoryId1: 100, categoryId2: 200 } })
 * @returns {Promise<Object>} - Created/updated monthly data
 */
export const createOrUpdateMonthlyData = async (budgetId, month, userId, data) => {
  try {
    logger.debug('MonthlyDataService', 'createOrUpdateMonthlyData', 'Creating/updating monthly data', { 
      budgetId, 
      month,
      userId
    });
    
    // Parse year and numeric month from the month string
    const [year, monthNum] = month.split('-').map((part, index) => 
      index === 0 ? parseInt(part, 10) : parseInt(part, 10)
    );
    
    // Validate the month string
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      const error = new Error(`Invalid month format: ${month}. Expected YYYY-MM.`);
      logger.error('MonthlyDataService', 'createOrUpdateMonthlyData', 'Invalid month format', {
        month,
        error: error.message
      });
      throw error;
    }
    
    const docRef = doc(db, `budgets/${budgetId}/monthlyData`, month);
    
    // Check if document already exists
    const docSnapshot = await getDoc(docRef);
    const exists = docSnapshot.exists();
    
    // Prepare data with required fields
    const monthlySaveData = {
      budgetId, // Denormalized for queries
      month,
      year,
      monthNum,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp(),
      ...data,
      // Empty calculated field placeholder
      calculated: data.calculated || {}
    };
    
    // Only set createdAt and createdByUserId if it's a new document
    if (!exists) {
      monthlySaveData.createdAt = serverTimestamp();
      monthlySaveData.createdByUserId = userId;
    }
    
    // TODO: M4b - Implement actual calculation logic population (B6.1)
    
    // Create or update the document
    await setDoc(docRef, monthlySaveData, { merge: true });
    
    logger.info('MonthlyDataService', 'createOrUpdateMonthlyData', 'Monthly data saved successfully', { 
      budgetId, 
      month,
      userId,
      operation: exists ? 'updated' : 'created'
    });
    
    // Prepare a response that matches what would come back from the database
    // but with placeholders for server-generated fields
    return {
      id: month,
      ...monthlySaveData,
      createdAt: monthlySaveData.createdAt || (exists ? docSnapshot.data().createdAt : new Date()),
      updatedAt: new Date()
    };
  } catch (error) {
    logger.error('MonthlyDataService', 'createOrUpdateMonthlyData', 'Failed to save monthly data', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      month,
      userId
    });
    throw error;
  }
};

/**
 * Update just the allocations portion of monthly data
 * @param {string} budgetId - Budget ID
 * @param {string} month - Month in YYYY-MM format
 * @param {string} userId - User ID of the editor
 * @param {Object} allocationsMap - Map of category IDs to allocation amounts { categoryId: amount }
 * @returns {Promise<void>}
 */
export const updateAllocations = async (budgetId, month, userId, allocationsMap) => {
  try {
    logger.debug('MonthlyDataService', 'updateAllocations', 'Updating allocations', { 
      budgetId, 
      month,
      userId,
      categoriesCount: Object.keys(allocationsMap).length
    });
    
    const docRef = doc(db, `budgets/${budgetId}/monthlyData`, month);
    
    const updateData = {
      allocations: allocationsMap,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp()
    };
    
    // TODO: M4b - Need to recalculate 'calculated' fields based on new allocations (B6.1)
    
    // Update the allocations
    await updateDoc(docRef, updateData);
    
    logger.info('MonthlyDataService', 'updateAllocations', 'Allocations updated successfully', { 
      budgetId, 
      month,
      userId,
      categoriesCount: Object.keys(allocationsMap).length
    });
  } catch (error) {
    logger.error('MonthlyDataService', 'updateAllocations', 'Failed to update allocations', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      month,
      userId
    });
    throw error;
  }
}; 