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
    // Validate userId is provided
    if (!userId) {
      const error = new Error('User ID is required');
      error.code = 'invalid-argument';
      throw error;
    }

    logger.debug('TransactionService', 'addTransaction', 'Adding new transaction', { 
      userId,
      transactionType: transactionData.type
    });
    
    // Create a new document reference with auto-generated ID in the user's subcollection
    const path = `users/${userId}/transactions`;
    console.log('🔍 CREATING TRANSACTION AT PATH:', path);
    const transactionRef = doc(collection(db, path));
    
    // Format date as Timestamp if it's a Date object
    const formattedDate = transactionData.date instanceof Date 
      ? Timestamp.fromDate(transactionData.date)
      : transactionData.date;
    
    // Prepare the transaction data with all necessary fields
    const finalData = {
      // Include userId in the document even though it's in the path (for security rules)
      userId: userId,
      ...transactionData,
      date: formattedDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Log the complete data object being sent to Firestore
    logger.debug('TransactionService', 'addTransaction', 'Final data object being sent', { 
      transactionData: JSON.parse(JSON.stringify(finalData)) 
    });
    
    // Log data types before saving
    logger.debug('TransactionService', 'addTransaction', 'Data types before setDoc', {
      userIdType: typeof finalData.userId,
      amountType: typeof finalData.amount,
      dateType: finalData.date?.constructor?.name || typeof finalData.date, // Check if it's a Timestamp
      categoryIdType: typeof finalData.categoryId,
      typeType: typeof finalData.type,
      descriptionType: typeof finalData.description
    });
    
    // Create transaction document
    await setDoc(transactionRef, finalData);
    
    // ADDED: Verify the document was actually created by trying to read it back
    console.log('🔍 VERIFYING TRANSACTION CREATION:', transactionRef.id);
    const verifyDocSnap = await getDoc(transactionRef);
    
    if (verifyDocSnap.exists()) {
      console.log('✅ TRANSACTION VERIFIED:', transactionRef.id, 'exists in Firestore');
      logger.info('TransactionService', 'addTransaction', 'Transaction verified to exist', {
        userId,
        transactionId: transactionRef.id,
        data: JSON.parse(JSON.stringify(verifyDocSnap.data()))
      });
    } else {
      console.log('❌ TRANSACTION VERIFICATION FAILED:', transactionRef.id, 'does not exist in Firestore');
      logger.warn('TransactionService', 'addTransaction', 'Transaction document not found after creation', {
        userId,
        transactionId: transactionRef.id
      });
    }
    
    logger.info('TransactionService', 'addTransaction', 'Transaction added successfully', { 
      userId,
      transactionId: transactionRef.id
    });
    
    console.log('✅ TRANSACTION CREATED:', transactionRef.id, 'at path:', path);
    return transactionRef.id;
  } catch (error) {
    // Make sure the error is properly formatted
    if (!error.code && error.name === 'FirebaseError') {
      // Convert Firebase error code format (auth/invalid-email) to our format (invalid-email)
      error.code = error.code.split('/')[1] || error.code;
    }
    
    logger.error('TransactionService', 'addTransaction', 'Failed to add transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId
    });
    throw error;
  }
};

/**
 * Get a transaction by ID
 * @param {string} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export const getTransaction = async (userId, transactionId) => {
  try {
    logger.debug('TransactionService', 'getTransaction', 'Fetching transaction', { 
      userId,
      transactionId 
    });
    
    const docRef = doc(db, `users/${userId}/transactions`, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'getTransaction', 'Transaction not found', { 
        userId,
        transactionId 
      });
      return null;
    }
    
    logger.info('TransactionService', 'getTransaction', 'Transaction retrieved successfully', {
      userId,
      transactionId
    });
    
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
      errorCode: error.code,
      stack: error.stack,
      userId,
      transactionId
    });
    throw error;
  }
};

/**
 * Update a transaction
 * @param {string} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @param {Object} transactionData - Updated transaction data
 * @returns {Promise<void>}
 */
export const updateTransaction = async (userId, transactionId, transactionData) => {
  try {
    logger.debug('TransactionService', 'updateTransaction', 'Updating transaction', { 
      userId,
      transactionId 
    });
    
    // Check if transaction exists
    const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
    const docSnap = await getDoc(transactionRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'updateTransaction', 'Transaction not found', {
        userId,
        transactionId
      });
      
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    // Format date as Timestamp if it's a Date object
    let updatedData = { ...transactionData };
    if (updatedData.date instanceof Date) {
      updatedData.date = Timestamp.fromDate(updatedData.date);
    }
    
    // Add updated timestamp
    updatedData.updatedAt = serverTimestamp();
    
    // Update the transaction
    await updateDoc(transactionRef, updatedData);
    
    logger.info('TransactionService', 'updateTransaction', 'Transaction updated successfully', { 
      userId,
      transactionId 
    });
  } catch (error) {
    logger.error('TransactionService', 'updateTransaction', 'Failed to update transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
      transactionId
    });
    throw error;
  }
};

/**
 * Delete a transaction
 * @param {string} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (userId, transactionId) => {
  try {
    logger.debug('TransactionService', 'deleteTransaction', 'Deleting transaction', { 
      userId,
      transactionId 
    });
    
    const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
    
    // First check if the transaction exists
    const docSnap = await getDoc(transactionRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'deleteTransaction', 'Transaction not found', {
        userId,
        transactionId
      });
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    // Delete the transaction
    await deleteDoc(transactionRef);
    
    logger.info('TransactionService', 'deleteTransaction', 'Transaction deleted successfully', { 
      userId,
      transactionId 
    });
  } catch (error) {
    logger.error('TransactionService', 'deleteTransaction', 'Failed to delete transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
      transactionId
    });
    throw error;
  }
};

/**
 * Get transactions for a user within a date range
 * @param {string} userId - User ID
 * @param {Date|Timestamp} startDate - Start date
 * @param {Date|Timestamp} endDate - End date
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
    
    // Ensure dates are Firestore Timestamps
    const startTimestamp = startDate instanceof Timestamp 
      ? startDate 
      : Timestamp.fromDate(new Date(startDate));
    
    const endTimestamp = endDate instanceof Timestamp 
      ? endDate 
      : Timestamp.fromDate(new Date(endDate));
    
    // Get transactions from the user's transactions subcollection
    const transactionsPath = `users/${userId}/transactions`;
    logger.debug('TransactionService', 'getTransactionsInRange', 'Accessing transactions path', { path: transactionsPath });
    const transactionsCollection = collection(db, transactionsPath);
    
    // Build query
    const q = query(
      transactionsCollection,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', orderDirection),
      limit(queryLimit)
    );
    
    const querySnapshot = await getDocs(q);
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to JS Date if needed
      if (data.date && data.date instanceof Timestamp) {
        data.date = data.date.toDate();
      }
      
      return {
        id: doc.id,
        ...data
      };
    });
    
    logger.info('TransactionService', 'getTransactionsInRange', 'Transactions fetched successfully', {
      userId,
      count: transactions.length,
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
    });
    
    return transactions;
  } catch (error) {
    logger.error('TransactionService', 'getTransactionsInRange', 'Failed to fetch transactions', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
    });
    throw error;
  }
}; 