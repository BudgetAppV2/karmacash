// src/services/firebase/budgets.js

import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firestore';
import logger from '../logger';

/**
 * Create or update a budget for a specific month
 * @param {string} userId - User ID
 * @param {string} period - Budget period in format 'YYYY-MM'
 * @param {Object} budgetData - Budget data
 * @returns {Promise<void>}
 */
export const saveBudget = async (userId, period, budgetData) => {
  try {
    logger.debug('BudgetService', 'saveBudget', 'Saving budget', { 
      userId,
      period
    });
    
    const budgetRef = doc(db, 'budgets', `${userId}_${period}`);
    const docSnap = await getDoc(budgetRef);
    
    if (docSnap.exists()) {
      // Update existing budget
      await updateDoc(budgetRef, {
        ...budgetData,
        updatedAt: serverTimestamp()
      });
      
      logger.info('BudgetService', 'saveBudget', 'Budget updated successfully', { 
        userId,
        period
      });
    } else {
      // Create new budget
      await setDoc(budgetRef, {
        userId,
        period,
        ...budgetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      logger.info('BudgetService', 'saveBudget', 'Budget created successfully', { 
        userId,
        period
      });
    }
  } catch (error) {
    logger.error('BudgetService', 'saveBudget', 'Failed to save budget', {
      error: error.message,
      userId,
      period
    });
    throw error;
  }
};

/**
 * Get a budget for a specific month
 * @param {string} userId - User ID
 * @param {string} period - Budget period in format 'YYYY-MM'
 * @returns {Promise<Object|null>} - Budget data or null if not found
 */
export const getBudget = async (userId, period) => {
  try {
    logger.debug('BudgetService', 'getBudget', 'Fetching budget', { 
      userId,
      period
    });
    
    const budgetRef = doc(db, 'budgets', `${userId}_${period}`);
    const docSnap = await getDoc(budgetRef);
    
    if (!docSnap.exists()) {
      logger.info('BudgetService', 'getBudget', 'No budget found for period', { 
        userId,
        period
      });
      return null;
    }
    
    logger.info('BudgetService', 'getBudget', 'Budget retrieved successfully', {
      userId,
      period
    });
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('BudgetService', 'getBudget', 'Failed to get budget', {
      error: error.message,
      userId,
      period
    });
    throw error;
  }
};

/**
 * Get budgets for a user within a range of periods
 * @param {string} userId - User ID
 * @param {string} startPeriod - Start period in format 'YYYY-MM'
 * @param {string} endPeriod - End period in format 'YYYY-MM'
 * @returns {Promise<Array>} - Array of budgets
 */
export const getBudgetsInRange = async (userId, startPeriod, endPeriod) => {
  try {
    logger.debug('BudgetService', 'getBudgetsInRange', 'Fetching budgets in range', { 
      userId,
      startPeriod,
      endPeriod
    });
    
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      where('period', '>=', startPeriod),
      where('period', '<=', endPeriod),
      orderBy('period', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const budgets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info('BudgetService', 'getBudgetsInRange', 'Budgets retrieved successfully', { 
      userId,
      count: budgets.length
    });
    
    return budgets;
  } catch (error) {
    logger.error('BudgetService', 'getBudgetsInRange', 'Failed to get budgets', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Update budget allocations for a specific month
 * @param {string} userId - User ID
 * @param {string} period - Budget period in format 'YYYY-MM'
 * @param {Object} allocations - Category allocations map {categoryId: amount}
 * @returns {Promise<void>}
 */
export const updateBudgetAllocations = async (userId, period, allocations) => {
  try {
    logger.debug('BudgetService', 'updateBudgetAllocations', 'Updating budget allocations', { 
      userId,
      period
    });
    
    const budgetRef = doc(db, 'budgets', `${userId}_${period}`);
    const docSnap = await getDoc(budgetRef);
    
    if (!docSnap.exists()) {
      // Create new budget with allocations
      await setDoc(budgetRef, {
        userId,
        period,
        allocations,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing budget allocations
      await updateDoc(budgetRef, {
        'allocations': allocations,
        'updatedAt': serverTimestamp()
      });
    }
    
    logger.info('BudgetService', 'updateBudgetAllocations', 'Budget allocations updated successfully', { 
      userId,
      period
    });
  } catch (error) {
    logger.error('BudgetService', 'updateBudgetAllocations', 'Failed to update budget allocations', {
      error: error.message,
      userId,
      period
    });
    throw error;
  }
}; 