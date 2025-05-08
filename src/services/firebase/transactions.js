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
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';

/**
 * Validates transaction amount based on transaction type
 * @param {string} type - Transaction type ('expense' or 'income')
 * @param {number} amount - Transaction amount
 * @returns {boolean} - True if valid, throws error if invalid
 */
const validateTransactionAmount = (type, amount) => {
  // Check if amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    const error = new Error('Transaction amount must be a valid number');
    error.code = 'validation-error';
    throw error;
  }

  // Validate amount sign based on transaction type
  if (type === 'expense' && amount >= 0) {
    const error = new Error('Expense transactions must have a negative amount');
    error.code = 'validation-error';
    throw error;
  }
  
  if (type === 'income' && amount <= 0) {
    const error = new Error('Income transactions must have a positive amount');
    error.code = 'validation-error';
    throw error;
  }
  
  return true;
};

/**
 * Validates that the transaction type matches the category type
 * @param {string} budgetId - Budget ID
 * @param {string} categoryId - Category ID
 * @param {string} transactionType - Transaction type ('expense' or 'income')
 * @returns {Promise<boolean>} - True if valid, throws error if invalid
 */
const validateCategoryTypeMatch = async (budgetId, categoryId, transactionType) => {
  try {
    // Skip validation if no category is selected
    if (!categoryId) {
      logger.debug('TransactionService', 'validateCategoryTypeMatch', 'No category selected, skipping validation');
      return true;
    }

    // Fetch the category document
    const categoryRef = doc(db, `budgets/${budgetId}/categories`, categoryId);
    const categorySnap = await getDoc(categoryRef);

    // Check if the category exists
    if (!categorySnap.exists()) {
      logger.warn('TransactionService', 'validateCategoryTypeMatch', 'Category not found', {
        budgetId,
        categoryId,
        transactionType
      });
      const error = new Error(`La catégorie sélectionnée n'existe pas`);
      error.code = 'validation-error-category';
      throw error;
    }

    // Get category data and check type
    const categoryData = categorySnap.data();
    const categoryType = categoryData.type;

    // Validate the category type matches the transaction type
    if (categoryType !== transactionType) {
      logger.warn('TransactionService', 'validateCategoryTypeMatch', 'Category type mismatch', {
        budgetId,
        categoryId,
        categoryType,
        transactionType
      });
      
      const categoryTypeDisplay = categoryType === 'expense' ? 'dépense' : 'revenu';
      const transactionTypeDisplay = transactionType === 'expense' ? 'dépense' : 'revenu';
      
      const error = new Error(
        `Incompatibilité de type: Impossible d'assigner une transaction de type ${transactionTypeDisplay} à une catégorie de type ${categoryTypeDisplay}`
      );
      error.code = 'validation-error-category';
      throw error;
    }

    logger.debug('TransactionService', 'validateCategoryTypeMatch', 'Category type validated successfully', {
      budgetId,
      categoryId,
      categoryType,
      transactionType
    });
    
    return true;
  } catch (error) {
    // Pass through validation errors
    if (error.code === 'validation-error-category') {
      throw error;
    }
    
    // Handle other errors (network issues, etc.)
    logger.error('TransactionService', 'validateCategoryTypeMatch', 'Error validating category type', {
      error: error.message,
      stack: error.stack,
      budgetId,
      categoryId,
      transactionType
    });
    
    const wrappedError = new Error('Erreur lors de la validation de la catégorie');
    wrappedError.code = 'validation-error-category';
    wrappedError.originalError = error;
    throw wrappedError;
  }
};

/**
 * Add a new transaction
 * @param {string} budgetId - Budget ID
 * @param {string} userId - User ID of the creator
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<string>} - Transaction ID
 */
export const addTransaction = async (budgetId, userId, transactionData) => {
  try {
    // Debug log the incoming parameters
    console.log(">>> TRANSACTION SERVICE DEBUG: addTransaction called with:", {
      budgetId,
      userId,
      transactionData: { ...transactionData, date: transactionData.date?.toISOString() }
    });

    // Validate budgetId and userId are provided
    if (!budgetId) {
      const error = new Error('Budget ID is required');
      error.code = 'invalid-argument';
      throw error;
    }

    if (!userId) {
      const error = new Error('User ID is required');
      error.code = 'invalid-argument';
      throw error;
    }

    // Validate required transaction data
    if (!transactionData || typeof transactionData !== 'object') {
      console.error(">>> TRANSACTION SERVICE ERROR: Invalid transaction data:", transactionData);
      const error = new Error('Transaction data is required and must be an object');
      error.code = 'invalid-argument';
      throw error;
    }

    // Validate required transaction fields
    const requiredFields = ['type', 'categoryId', 'amount', 'description', 'date'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);
    if (missingFields.length > 0) {
      console.error(">>> TRANSACTION SERVICE ERROR: Missing required fields:", missingFields);
      const error = new Error(`Missing required transaction fields: ${missingFields.join(', ')}`);
      error.code = 'invalid-argument';
      throw error;
    }

    // Validate amount sign based on transaction type
    try {
      validateTransactionAmount(transactionData.type, transactionData.amount);
    } catch (validationError) {
      logger.warn('TransactionService', 'addTransaction', 'Validation error', { 
        error: validationError.message,
        type: transactionData.type,
        amount: transactionData.amount,
        budgetId,
        userId
      });
      throw validationError;
    }

    // Validate category type matches transaction type
    try {
      await validateCategoryTypeMatch(budgetId, transactionData.categoryId, transactionData.type);
    } catch (validationError) {
      logger.warn('TransactionService', 'addTransaction', 'Category validation error', {
        error: validationError.message,
        type: transactionData.type,
        categoryId: transactionData.categoryId,
        budgetId,
        userId
      });
      throw validationError;
    }

    logger.debug('TransactionService', 'addTransaction', 'Adding new transaction', { 
      budgetId,
      userId,
      transactionType: transactionData.type
    });
    
    // Create a new document reference with auto-generated ID in the budget's transactions subcollection
    const path = `budgets/${budgetId}/transactions`;
    console.log('🔍 CREATING TRANSACTION AT PATH:', path);
    const transactionRef = doc(collection(db, path));
    
    // Format date as Timestamp if it's a Date object
    const formattedDate = transactionData.date instanceof Date 
      ? Timestamp.fromDate(transactionData.date)
      : transactionData.date;
    
    // Prepare the transaction data with all necessary fields
    const finalData = {
      // Include budgetId and userId in the document for denormalization and attribution
      budgetId: budgetId,
      createdByUserId: userId,
      lastEditedByUserId: null, // Initially null since it's a new transaction
      // Add required fields for security rules compliance
      isRecurringInstance: false, // Standard transactions are not recurring instances
      recurringRuleId: null,      // Standard transactions have no recurring rule
      ...transactionData,
      date: formattedDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log(">>> TRANSACTION SERVICE DEBUG: Final data to be written:", {
      ...finalData,
      date: finalData.date instanceof Timestamp ? finalData.date.toDate().toISOString() : finalData.date,
      createdAt: 'serverTimestamp()',
      updatedAt: 'serverTimestamp()'
    });
    
    // Log the complete data object being sent to Firestore
    logger.debug('TransactionService', 'addTransaction', 'Final data object being sent', { 
      transactionData: JSON.parse(JSON.stringify(finalData)) 
    });
    
    // Log data types before saving
    logger.debug('TransactionService', 'addTransaction', 'Data types before setDoc', {
      budgetIdType: typeof finalData.budgetId,
      userIdType: typeof finalData.createdByUserId,
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
        budgetId,
        userId,
        transactionId: transactionRef.id,
        data: JSON.parse(JSON.stringify(verifyDocSnap.data()))
      });
    } else {
      console.log('❌ TRANSACTION VERIFICATION FAILED:', transactionRef.id, 'does not exist in Firestore');
      logger.warn('TransactionService', 'addTransaction', 'Transaction document not found after creation', {
        budgetId,
        userId,
        transactionId: transactionRef.id
      });
    }
    
    logger.info('TransactionService', 'addTransaction', 'Transaction added successfully', { 
      budgetId,
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
    
    console.error(">>> TRANSACTION SERVICE ERROR:", error.message, {
      code: error.code,
      budgetId,
      userId,
      transactionData: transactionData ? { 
        ...transactionData, 
        date: transactionData.date?.toISOString() 
      } : undefined
    });
    
    logger.error('TransactionService', 'addTransaction', 'Failed to add transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      userId
    });
    throw error;
  }
};

/**
 * Get a transaction by ID
 * @param {string} budgetId - Budget ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} - Transaction data
 */
export const getTransaction = async (budgetId, transactionId) => {
  try {
    logger.debug('TransactionService', 'getTransaction', 'Fetching transaction', { 
      budgetId,
      transactionId 
    });
    
    const docRef = doc(db, `budgets/${budgetId}/transactions`, transactionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'getTransaction', 'Transaction not found', { 
        budgetId,
        transactionId 
      });
      return null;
    }
    
    logger.info('TransactionService', 'getTransaction', 'Transaction retrieved successfully', {
      budgetId,
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
      budgetId,
      transactionId
    });
    throw error;
  }
};

/**
 * Update a transaction
 * @param {string} budgetId - Budget ID
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID of the editor
 * @param {Object} transactionData - Updated transaction data
 * @returns {Promise<void>}
 */
export const updateTransaction = async (budgetId, transactionId, userId, transactionData) => {
  try {
    logger.debug('TransactionService', 'updateTransaction', 'Updating transaction', { 
      budgetId,
      transactionId,
      userId
    });
    
    // Check if transaction exists
    const transactionRef = doc(db, `budgets/${budgetId}/transactions`, transactionId);
    const docSnap = await getDoc(transactionRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'updateTransaction', 'Transaction not found', {
        budgetId,
        transactionId
      });
      
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    // Get existing transaction data
    const existingData = docSnap.data();
    
    // Format date as Timestamp if it's a Date object
    let updatedData = { ...transactionData };
    if (updatedData.date instanceof Date) {
      updatedData.date = Timestamp.fromDate(updatedData.date);
    }
    
    // Validate amount sign based on transaction type if both fields are present in the update
    if (updatedData.type && 'amount' in updatedData) {
      try {
        validateTransactionAmount(updatedData.type, updatedData.amount);
      } catch (validationError) {
        logger.warn('TransactionService', 'updateTransaction', 'Validation error', { 
          error: validationError.message,
          type: updatedData.type,
          amount: updatedData.amount,
          budgetId,
          transactionId,
          userId
        });
        throw validationError;
      }
    } 
    // If only amount is being updated, check against the existing transaction type
    else if ('amount' in updatedData && !updatedData.type) {
      const existingType = existingData.type;
      try {
        validateTransactionAmount(existingType, updatedData.amount);
      } catch (validationError) {
        logger.warn('TransactionService', 'updateTransaction', 'Validation error with existing type', { 
          error: validationError.message,
          existingType,
          amount: updatedData.amount,
          budgetId,
          transactionId,
          userId
        });
        throw validationError;
      }
    }
    // If only type is being updated, check against the existing amount
    else if (updatedData.type && !('amount' in updatedData)) {
      const existingAmount = existingData.amount;
      try {
        validateTransactionAmount(updatedData.type, existingAmount);
      } catch (validationError) {
        logger.warn('TransactionService', 'updateTransaction', 'Validation error with existing amount', { 
          error: validationError.message,
          type: updatedData.type,
          existingAmount,
          budgetId,
          transactionId,
          userId
        });
        throw validationError;
      }
    }
    
    // Validate category type matches transaction type
    
    // Case 1: Both transaction type and categoryId are being updated
    if (updatedData.type && updatedData.categoryId) {
      try {
        await validateCategoryTypeMatch(budgetId, updatedData.categoryId, updatedData.type);
      } catch (validationError) {
        logger.warn('TransactionService', 'updateTransaction', 'Category validation error - both fields updated', {
          error: validationError.message,
          newType: updatedData.type,
          newCategoryId: updatedData.categoryId,
          budgetId,
          transactionId,
          userId
        });
        throw validationError;
      }
    }
    // Case 2: Only categoryId is being updated, use existing transaction type
    else if (updatedData.categoryId && !updatedData.type) {
      const existingType = existingData.type;
      try {
        await validateCategoryTypeMatch(budgetId, updatedData.categoryId, existingType);
      } catch (validationError) {
        logger.warn('TransactionService', 'updateTransaction', 'Category validation error - categoryId updated', {
          error: validationError.message,
          existingType,
          newCategoryId: updatedData.categoryId,
          budgetId,
          transactionId,
          userId
        });
        throw validationError;
      }
    }
    // Case 3: Only transaction type is being updated, use existing categoryId
    else if (updatedData.type && !updatedData.categoryId) {
      const existingCategoryId = existingData.categoryId;
      if (existingCategoryId) { // Skip if no category is set
        try {
          await validateCategoryTypeMatch(budgetId, existingCategoryId, updatedData.type);
        } catch (validationError) {
          logger.warn('TransactionService', 'updateTransaction', 'Category validation error - type updated', {
            error: validationError.message,
            newType: updatedData.type,
            existingCategoryId,
            budgetId,
            transactionId,
            userId
          });
          throw validationError;
        }
      }
    }
    
    // Add updated timestamp and last editor
    updatedData.updatedAt = serverTimestamp();
    updatedData.lastEditedByUserId = userId;
    
    // TODO: M4a - Implement full validation to ensure createdByUserId and createdAt are not modified
    
    // Update the transaction
    await updateDoc(transactionRef, updatedData);
    
    logger.info('TransactionService', 'updateTransaction', 'Transaction updated successfully', { 
      budgetId,
      transactionId,
      userId
    });
  } catch (error) {
    logger.error('TransactionService', 'updateTransaction', 'Failed to update transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      transactionId,
      userId
    });
    throw error;
  }
};

/**
 * Delete a transaction
 * @param {string} budgetId - Budget ID
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (budgetId, transactionId) => {
  try {
    logger.debug('TransactionService', 'deleteTransaction', 'Deleting transaction', { 
      budgetId,
      transactionId 
    });
    
    const transactionRef = doc(db, `budgets/${budgetId}/transactions`, transactionId);
    
    // First check if the transaction exists
    const docSnap = await getDoc(transactionRef);
    
    if (!docSnap.exists()) {
      logger.warn('TransactionService', 'deleteTransaction', 'Transaction not found', {
        budgetId,
        transactionId
      });
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    // TODO: M4a - Implement additional permission validation or soft deletion if needed
    
    // Delete the transaction
    await deleteDoc(transactionRef);
    
    logger.info('TransactionService', 'deleteTransaction', 'Transaction deleted successfully', { 
      budgetId,
      transactionId 
    });
  } catch (error) {
    logger.error('TransactionService', 'deleteTransaction', 'Failed to delete transaction', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      transactionId
    });
    throw error;
  }
};

/**
 * Get transactions for a budget within a date range
 * @param {string} budgetId - Budget ID
 * @param {Date|Timestamp} startDate - Start date
 * @param {Date|Timestamp} endDate - End date
 * @param {Object} options - Query options (limit, orderDirection)
 * @returns {Promise<Array>} - Array of transactions
 */
export const getTransactionsInRange = async (budgetId, startDate, endDate, options = {}) => {
  try {
    logger.debug('TransactionService', 'getTransactionsInRange', 'Fetching transactions in range', { 
      budgetId,
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
    
    // Get transactions from the budget's transactions subcollection
    const transactionsPath = `budgets/${budgetId}/transactions`;
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
    
    // TODO: M4a - Implement additional filtering options (by category, creator, etc.)
    
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
      budgetId,
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
      budgetId,
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
    });
    throw error;
  }
};

/**
 * Get real-time updates for transactions in a specific month
 * @param {string} budgetId - Budget ID
 * @param {string} monthString - Month in YYYY-MM format
 * @param {Function} onDataChange - Callback function to handle transaction data updates
 * @param {Function} onError - Callback function to handle errors (optional)
 * @returns {Function} - Unsubscribe function to stop listening
 */
export const getTransactionsForMonth = (budgetId, monthString, onDataChange, onError) => {
  try {
    logger.debug('TransactionService', 'getTransactionsForMonth', 'Setting up listener', { 
      budgetId, 
      monthString 
    });

    // Input validation
    if (!budgetId || !monthString || typeof monthString !== 'string' || !monthString.match(/^\d{4}-\d{2}$/)) {
      const error = new Error('Invalid budgetId or monthString format (required: YYYY-MM)');
      logger.error('TransactionService', 'getTransactionsForMonth', 'Invalid input', {
        error: error.message,
        budgetId,
        monthString
      });
      if (onError) onError(error);
      return () => {}; // Return a no-op unsubscribe function
    }

    // Parse the month string into year and month components (as numbers)
    const [year, month] = monthString.split('-').map(Number);
    
    // Create UTC start date (first day of month at 00:00:00.000)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    
    // Create UTC end date (last day of month at 23:59:59.999)
    // Using day 0 of next month gives the last day of current month
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    // Convert to Firestore Timestamps for query
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    logger.debug('TransactionService', 'getTransactionsForMonth', 'Date range calculated', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthString
    });

    // Build reference to the transactions collection for this budget
    const transactionsPath = `budgets/${budgetId}/transactions`;
    const transactionsCollection = collection(db, transactionsPath);
    
    // Create query for transactions within the date range
    const q = query(
      transactionsCollection,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc')
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamp to JS Date for easier client-side handling
        if (data.date && data.date instanceof Timestamp) {
          data.date = data.date.toDate();
        }
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      logger.debug('TransactionService', 'getTransactionsForMonth', 'Transactions updated', {
        budgetId,
        monthString,
        count: transactions.length
      });
      
      // Pass the transactions to the callback
      onDataChange(transactions);
    }, (error) => {
      logger.error('TransactionService', 'getTransactionsForMonth', 'Error in snapshot listener', {
        error: error.message,
        stack: error.stack,
        budgetId,
        monthString
      });
      if (onError) onError(error);
    });
    
    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    logger.error('TransactionService', 'getTransactionsForMonth', 'Error setting up listener', {
      error: error.message,
      stack: error.stack,
      budgetId,
      monthString
    });
    if (onError) onError(error);
    return () => {}; // Return a no-op unsubscribe function
  }
}; 