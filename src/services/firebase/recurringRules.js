// src/services/firebase/recurringRules.js
// NOTE: Changes here impact 'manageRecurringInstances' Cloud Function (Task 11 in M4a plan).

import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from './firebaseInit';
import { startOfDay, getDate, getDay } from 'date-fns';
import logger from '../logger';

/**
 * Frequency types for recurring rules
 */
export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly', // Every two weeks
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly', // Every three months
  YEARLY: 'yearly'
};

/**
 * Get all recurring rules for a budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise<Array>} - Array of recurring rules
 */
export const getRecurringRules = async (budgetId) => {
  try {
    logger.debug('RecurringRuleService', 'getRecurringRules', 'Fetching recurring rules', {
      budgetId
    });
    
    // Get all documents from the subcollection
    const rulesCollectionRef = collection(db, `budgets/${budgetId}/recurringRules`);
    const q = query(rulesCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const rules = [];
    querySnapshot.forEach((doc) => {
      rules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    logger.info('RecurringRuleService', 'getRecurringRules', 'Recurring rules fetched successfully', {
      budgetId,
      count: rules.length
    });
    
    return rules;
  } catch (error) {
    logger.error('RecurringRuleService', 'getRecurringRules', 'Failed to fetch recurring rules', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId
    });
    
    throw error;
  }
};

/**
 * Get a specific recurring rule by ID
 * @param {string} budgetId - Budget ID
 * @param {string} ruleId - Rule ID to fetch
 * @returns {Promise<Object|null>} - The recurring rule object or null if not found
 */
export const getRecurringRule = async (budgetId, ruleId) => {
  try {
    logger.debug('RecurringRuleService', 'getRecurringRule', 'Fetching recurring rule', {
      budgetId,
      ruleId
    });
    
    const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, ruleId);
    const docSnap = await getDoc(ruleRef);
    
    if (!docSnap.exists()) {
      logger.warn('RecurringRuleService', 'getRecurringRule', 'Recurring rule not found', {
        budgetId,
        ruleId
      });
      return null;
    }
    
    const rule = {
      id: docSnap.id,
      ...docSnap.data()
    };
    
    logger.info('RecurringRuleService', 'getRecurringRule', 'Recurring rule fetched successfully', {
      budgetId,
      ruleId
    });
    
    return rule;
  } catch (error) {
    logger.error('RecurringRuleService', 'getRecurringRule', 'Failed to fetch recurring rule', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      ruleId
    });
    
    throw error;
  }
};

/**
 * Create a new recurring rule for a budget
 * @param {string} budgetId - Budget ID
 * @param {string} userId - User ID of the creator
 * @param {Object} ruleData - The rule data to save
 * @returns {Promise<Object>} - The created rule with ID
 */
export const createRecurringRule = async (budgetId, userId, ruleData) => {
  try {
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Creating new recurring rule', {
      budgetId,
      userId,
      ruleData: JSON.stringify(ruleData, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      )
    });
    
    // Ensure all required fields are present
    const requiredFields = ['name', 'amount', 'categoryId', 'frequency', 'startDate'];
    const missingFields = requiredFields.filter(field => !ruleData[field]);
    
    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
      logger.error('RecurringRuleService', 'createRecurringRule', 'Missing required fields', {
        budgetId,
        userId,
        missingFields,
        error: error.message
      });
      throw error;
    }
    
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Passed required fields check');
    
    // TODO: M4a - Add validation to ensure categoryId exists in this budget
    
    // Reference to the budget's recurring rules subcollection
    const rulesCollectionRef = collection(db, `budgets/${budgetId}/recurringRules`);
    
    // Add creation timestamp, default fields, and explicitly include budgetId and creator
    const ruleWithTimestamp = {
      ...ruleData,
      budgetId, // Denormalized for queries
      createdByUserId: userId,
      lastEditedByUserId: null, // Initially null since it's a new rule
      interval: ruleData.interval || 1, // Default to 1 if not provided
      // Calculate dayOfMonth and dayOfWeek from the startDate
      dayOfMonth: ruleData.frequency === FREQUENCY_TYPES.MONTHLY 
        ? (ruleData.startDate instanceof Date ? getDate(ruleData.startDate) : null) 
        : null,
      dayOfWeek: (ruleData.frequency === FREQUENCY_TYPES.WEEKLY || ruleData.frequency === FREQUENCY_TYPES.BIWEEKLY) 
        ? (ruleData.startDate instanceof Date ? getDay(ruleData.startDate) : null) 
        : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: ruleData.isActive !== undefined ? ruleData.isActive : true
    };
    
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Starting Timestamp conversions');
    
    // Log the date values for debugging
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Date values before conversion', {
      startDate: ruleData.startDate instanceof Date ? ruleData.startDate.toISOString() : String(ruleData.startDate),
      nextDate: ruleData.nextDate instanceof Date ? ruleData.nextDate.toISOString() : String(ruleData.nextDate),
      endDate: ruleData.endDate instanceof Date ? ruleData.endDate?.toISOString() : String(ruleData.endDate),
      dayOfMonth: ruleWithTimestamp.dayOfMonth,
      dayOfWeek: ruleWithTimestamp.dayOfWeek
    });
    
    // Convert Date objects to Firestore Timestamps
    if (ruleWithTimestamp.startDate instanceof Date) {
      ruleWithTimestamp.startDate = Timestamp.fromDate(ruleWithTimestamp.startDate);
    }
    
    if (ruleWithTimestamp.nextDate instanceof Date) {
      ruleWithTimestamp.nextDate = Timestamp.fromDate(ruleWithTimestamp.nextDate);
    }
    
    if (ruleWithTimestamp.endDate instanceof Date) {
      ruleWithTimestamp.endDate = Timestamp.fromDate(ruleWithTimestamp.endDate);
    }
    
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Finished Timestamp conversions');
    
    // Add detailed logging of the final data object being sent to Firestore
    logger.debug('RecurringRuleService', 'createRecurringRule', 'Final data object being sent to addDoc', {
      ruleData: JSON.stringify(ruleWithTimestamp, (key, value) => {
        if (value instanceof Timestamp) {
          return `Timestamp(${value.seconds}, ${value.nanoseconds})`;
        }
        return value;
      }),
      path: `budgets/${budgetId}/recurringRules`
    });
    
    // Add the document to Firestore
    const docRef = await addDoc(rulesCollectionRef, ruleWithTimestamp);
    
    // Get the created document to return with server timestamps
    const docSnap = await getDoc(docRef);
    
    const createdRule = {
      id: docSnap.id,
      ...docSnap.data()
    };
    
    logger.info('RecurringRuleService', 'createRecurringRule', 'Recurring rule created successfully', {
      budgetId,
      userId,
      ruleId: docSnap.id
    });
    
    return createdRule;
  } catch (error) {
    logger.error('RecurringRuleService', 'createRecurringRule', 'Failed to create recurring rule', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      userId,
      ruleData: JSON.stringify(ruleData, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      )
    });
    
    throw error;
  }
};

// Export createRecurringRule as addRecurringRule for backward compatibility
export const addRecurringRule = createRecurringRule;

/**
 * Update an existing recurring rule
 * @param {string} budgetId - Budget ID
 * @param {string} ruleId - Rule ID to update
 * @param {string} userId - User ID of the editor
 * @param {Object} ruleData - Updated rule data
 * @returns {Promise<Object>} - The updated rule
 */
export const updateRecurringRule = async (budgetId, ruleId, userId, ruleData) => {
  try {
    logger.debug('RecurringRuleService', 'updateRecurringRule', 'Updating recurring rule', {
      budgetId,
      ruleId,
      userId,
      ruleData
    });
    
    // Check if rule exists
    const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, ruleId);
    const docSnap = await getDoc(ruleRef);
    
    if (!docSnap.exists()) {
      const error = new Error('Rule not found');
      logger.error('RecurringRuleService', 'updateRecurringRule', 'Rule not found', {
        budgetId,
        ruleId,
        error: error.message
      });
      throw error;
    }
    
    // TODO: M4a - Add validation to ensure categoryId exists in this budget if being changed
    
    // TODO: M4a - Implement full validation to ensure createdByUserId and createdAt are not modified
    
    // Add updatedAt timestamp and user attribution
    const updatedRuleData = {
      ...ruleData,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp()
    };
    
    // Update the document
    await updateDoc(ruleRef, updatedRuleData);
    
    // Get the updated document to return with server timestamps
    const updatedDocSnap = await getDoc(ruleRef);
    
    const updatedRule = {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    };
    
    logger.info('RecurringRuleService', 'updateRecurringRule', 'Recurring rule updated successfully', {
      budgetId,
      ruleId,
      userId
    });
    
    return updatedRule;
  } catch (error) {
    logger.error('RecurringRuleService', 'updateRecurringRule', 'Failed to update recurring rule', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      ruleId,
      userId,
      ruleData
    });
    
    throw error;
  }
};

/**
 * Delete a recurring rule
 * @param {string} budgetId - Budget ID
 * @param {string} ruleId - Rule ID to delete
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteRecurringRule = async (budgetId, ruleId) => {
  try {
    logger.debug('RecurringRuleService', 'deleteRecurringRule', 'Deleting recurring rule', {
      budgetId,
      ruleId
    });
    
    // Check if rule exists first
    const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, ruleId);
    const docSnap = await getDoc(ruleRef);
    
    if (!docSnap.exists()) {
      logger.warn('RecurringRuleService', 'deleteRecurringRule', 'Rule not found, nothing to delete', {
        budgetId,
        ruleId
      });
      return false;
    }
    
    // TODO: M4a - Consider implications for future generated transaction instances (Cloud Function cleanup?)
    
    // Delete the document
    await deleteDoc(ruleRef);
    
    logger.info('RecurringRuleService', 'deleteRecurringRule', 'Recurring rule deleted successfully', {
      budgetId,
      ruleId
    });
    
    return true;
  } catch (error) {
    logger.error('RecurringRuleService', 'deleteRecurringRule', 'Failed to delete recurring rule', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      ruleId
    });
    
    throw error;
  }
};

/**
 * Update the next occurrence date for a recurring rule
 * @param {string} budgetId - Budget ID
 * @param {string} ruleId - Recurring rule ID
 * @param {string} userId - User ID of the editor
 * @param {Date} nextDate - Next occurrence date
 * @returns {Promise<void>}
 */
export const updateNextOccurrence = async (budgetId, ruleId, userId, nextDate) => {
  try {
    logger.debug('RecurringRuleService', 'updateNextOccurrence', 'Updating next occurrence date', { 
      budgetId,
      ruleId,
      userId,
      nextDate: nextDate instanceof Date ? nextDate.toISOString() : String(nextDate)
    });
    
    const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, ruleId);
    
    // Ensure the nextDate is properly formatted as a Firestore Timestamp
    const processedNextDate = nextDate instanceof Date 
      ? Timestamp.fromDate(nextDate)
      : nextDate;
      
    await updateDoc(ruleRef, {
      nextDate: processedNextDate,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp()
    });
    
    logger.info('RecurringRuleService', 'updateNextOccurrence', 'Next occurrence date updated successfully', {
      budgetId,
      ruleId,
      userId,
      nextDate: nextDate instanceof Date ? nextDate.toISOString() : String(nextDate)
    });
  } catch (error) {
    logger.error('RecurringRuleService', 'updateNextOccurrence', 'Failed to update next occurrence date', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      ruleId,
      userId,
      nextDate: nextDate instanceof Date ? nextDate?.toISOString() : String(nextDate)
    });
    throw error;
  }
};

/**
 * Batch update multiple recurring rules
 * @param {string} budgetId - Budget ID
 * @param {string} userId - User ID of the editor
 * @param {Array} ruleUpdates - Array of rule update objects { id, data }
 * @returns {Promise<void>}
 */
export const batchUpdateRules = async (budgetId, userId, ruleUpdates) => {
  try {
    logger.debug('RecurringRuleService', 'batchUpdateRules', 'Batch updating recurring rules', { 
      budgetId,
      userId,
      count: ruleUpdates.length,
      ruleIds: ruleUpdates.map(u => u.id).join(', ')
    });
    
    const batch = writeBatch(db);
    
    ruleUpdates.forEach(update => {
      const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, update.id);
      batch.update(ruleRef, {
        ...update.data,
        lastEditedByUserId: userId,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    logger.info('RecurringRuleService', 'batchUpdateRules', 'Rules batch updated successfully', {
      budgetId,
      userId,
      count: ruleUpdates.length
    });
  } catch (error) {
    logger.error('RecurringRuleService', 'batchUpdateRules', 'Failed to batch update rules', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      userId,
      ruleUpdates: JSON.stringify(ruleUpdates.map(u => ({ id: u.id })))
    });
    throw error;
  }
};

/**
 * Toggle the active state of a recurring rule
 * @param {string} budgetId - Budget ID
 * @param {string} ruleId - Recurring rule ID
 * @param {string} userId - User ID of the editor
 * @param {boolean} active - Active state
 * @returns {Promise<void>}
 */
export const toggleRecurringRuleActive = async (budgetId, ruleId, userId, active) => {
  try {
    logger.debug('RecurringRuleService', 'toggleRecurringRuleActive', 'Toggling recurring rule active state', { 
      budgetId,
      ruleId,
      userId,
      active
    });
    
    const ruleRef = doc(db, `budgets/${budgetId}/recurringRules`, ruleId);
    
    await updateDoc(ruleRef, {
      isActive: active,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp()
    });
    
    logger.info('RecurringRuleService', 'toggleRecurringRuleActive', 'Recurring rule active state updated', { 
      budgetId,
      ruleId,
      userId,
      active
    });
  } catch (error) {
    logger.error('RecurringRuleService', 'toggleRecurringRuleActive', 'Failed to toggle recurring rule active state', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      ruleId,
      userId,
      active
    });
    throw error;
  }
};

/**
 * @deprecated Use getRecurringRules instead
 * List all recurring rules for a budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise<Array>} - Array of recurring rules
 */
export const listRecurringRules = async (budgetId) => {
  console.warn('listRecurringRules is deprecated. Use getRecurringRules instead.');
  return getRecurringRules(budgetId);
}; 