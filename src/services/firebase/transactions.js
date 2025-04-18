// src/services/firebase/transactions.js

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
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';

/**
 * Add a new transaction
 * @param {string} userId - User ID
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<string>} - Transaction ID
 */
export const addTransaction = async (userId, transactionData) => {
  try {
    logger.debug('TransactionService', 'addTransaction', 'Adding new transaction', { 
      userId,
      transactionType: transactionData.type
    });
    
    // Create a new document reference with auto-generated ID
    const transactionRef = doc(collection(db, 'transactions'));
    
    // Format date as Timestamp if it's a Date object
    const formattedDate = transactionData.date instanceof Date 
      ? Timestamp.fromDate(transactionData.date)
      : transactionData.date;
    
    // Create transaction document
    await setDoc(transactionRef, {
      userId, // Always include user ID for security rules
      ...transactionData,
      date: formattedDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    logger.info('TransactionService', 'addTransaction', 'Transaction added successfully', { 
      userId,
      transactionId: transactionRef.id
    });
    
    return transactionRef.id;
  } catch (error) {
    logger.error('TransactionService', 'addTransaction', 'Failed to add transaction', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Get a transaction by ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export const getTransaction = async (transactionId) => {
  try {
    logger.debug('TransactionService', 'getTransaction', 'Fetching transaction', { 
      transactionId 
    });
    
    const docRef = doc(db, 'transactions', transactionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'getTransaction', 'Transaction not found', { 
        transactionId 
      });
      return null;
    }
    
    logger.info('TransactionService', 'getTransaction', 'Transaction retrieved successfully');
    
    // Convert Firestore Timestamp to JS Date
    const data = docSnap.data();
    if (data.date && data.date instanceof Timestamp) {
      data.date = data.date.toDate();
    }
    
    return {
      id: docSnap.id,
      ...data
    };
  } catch (error) {
    logger.error('TransactionService', 'getTransaction', 'Failed to get transaction', {
      error: error.message,
      transactionId
    });
    throw error;
  }
};

/**
 * Update a transaction
 * @param {string} transactionId - Transaction ID
 * @param {Object} transactionData - Updated transaction data
 * @returns {Promise<void>}
 */
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    logger.debug('TransactionService', 'updateTransaction', 'Updating transaction', { 
      transactionId 
    });
    
    const transactionRef = doc(db, 'transactions', transactionId);
    
    // Format date as Timestamp if it's a Date object
    let updatedData = { ...transactionData };
    if (updatedData.date instanceof Date) {
      updatedData.date = Timestamp.fromDate(updatedData.date);
    }
    
    // Add updated timestamp
    updatedData.updatedAt = serverTimestamp();
    
    // Update transaction
    await updateDoc(transactionRef, updatedData);
    
    logger.info('TransactionService', 'updateTransaction', 'Transaction updated successfully', { 
      transactionId 
    });
  } catch (error) {
    logger.error('TransactionService', 'updateTransaction', 'Failed to update transaction', {
      error: error.message,
      transactionId
    });
    throw error;
  }
};

/**
 * Delete a transaction
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (transactionId) => {
  try {
    logger.debug('TransactionService', 'deleteTransaction', 'Deleting transaction', { 
      transactionId 
    });
    
    await deleteDoc(doc(db, 'transactions', transactionId));
    
    logger.info('TransactionService', 'deleteTransaction', 'Transaction deleted successfully', { 
      transactionId 
    });
  } catch (error) {
    logger.error('TransactionService', 'deleteTransaction', 'Failed to delete transaction', {
      error: error.message,
      transactionId
    });
    throw error;
  }
};

/**
 * Get transactions for a user within a date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Query options (limit, orderDirection)
 * @returns {Promise<Array>} - Array of transactions
 */
export const getTransactionsInRange = async (userId, startDate, endDate, options = {}) => {
  try {
    logger.debug('TransactionService', 'getTransactionsInRange', 'Fetching transactions in range', { 
      userId,
      startDate,
      endDate
    });
    
    const { 
      limit: queryLimit = 100,
      orderDirection = 'desc'
    } = options;
    
    // Convert dates to Firestore Timestamps
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    // Create query
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', orderDirection),
      limit(queryLimit)
    );
    
    const querySnapshot = await getDocs(q);
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to JS Date
      if (data.date && data.date instanceof Timestamp) {
        data.date = data.date.toDate();
      }
      
      return {
        id: doc.id,
        ...data
      };
    });
    
    logger.info('TransactionService', 'getTransactionsInRange', 'Transactions retrieved successfully', { 
      userId,
      count: transactions.length
    });
    
    return transactions;
  } catch (error) {
    logger.error('TransactionService', 'getTransactionsInRange', 'Failed to get transactions', {
      error: error.message,
      userId
    });
    throw error;
  }
}; 