/**
 * Test Data Seeding Utility
 * 
 * This file contains utility functions to generate test data for development and testing purposes.
 * It provides functions to seed categories and transactions with realistic sample data.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch, 
  getDocs, 
  query, 
  limit, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase/firebaseInit';
import logger from '../services/logger';

// Default categories for testing
const defaultCategories = [
  // Expenses  
  { name: 'Épicerie', type: 'expense', color: '#A66962', order: 1, isDefault: true },  
  { name: 'Transport', type: 'expense', color: '#7A8D99', order: 2, isDefault: true },  
  { name: 'Resto', type: 'expense', color: '#C17C74', order: 3, isDefault: true },  
  { name: 'Santé', type: 'expense', color: '#568E8D', order: 4, isDefault: true },  
  { name: 'Loisirs', type: 'expense', color: '#A58D7F', order: 5, isDefault: true },  
  { name: 'Logement', type: 'expense', color: '#919A7F', order: 6, isDefault: true },
  { name: 'Assurance', type: 'expense', color: '#D9D0C7', order: 7, isDefault: true },
  { name: 'Autres Dépenses', type: 'expense', color: '#A58D7F', order: 100, isDefault: true },

  // Income  
  { name: 'Salaire', type: 'income', color: '#568E8D', order: 101, isDefault: true },  
  { name: 'Remboursements', type: 'income', color: '#919A7F', order: 102, isDefault: true },
  { name: 'Autres Revenus', type: 'income', color: '#A66962', order: 103, isDefault: true },  
];

/**
 * Seed test categories for a user
 * @param {string} userId - User ID to create categories for
 * @returns {Promise<Array>} - Array of created category IDs
 */
export const seedTestCategories = async (userId) => {
  try {
    logger.info('SeedTestData', 'seedTestCategories', 'Seeding test categories', { userId });
    
    // Check for existing categories in user's subcollection
    const categoriesPath = `users/${userId}/categories`;
    const categoriesCollectionRef = collection(db, categoriesPath);
    const q = query(categoriesCollectionRef, limit(1));
    const existingSnapshot = await getDocs(q);
    
    // If categories exist, return their IDs
    if (!existingSnapshot.empty) {
      logger.info('SeedTestData', 'seedTestCategories', 'User already has categories, fetching all', { userId });
      
      const fullSnapshot = await getDocs(categoriesCollectionRef);
      const categoryIds = fullSnapshot.docs.map(doc => doc.id);
      
      logger.info('SeedTestData', 'seedTestCategories', 'Found existing categories', { 
        userId, count: categoryIds.length 
      });
      
      return categoryIds;
    }
    
    // Create categories using batch write
    logger.info('SeedTestData', 'seedTestCategories', 'Creating new test categories', { userId });
    
    const batch = writeBatch(db);
    const categoryIds = [];
    
    // Add each category to the batch
    for (const category of defaultCategories) {
      const categoryDocRef = doc(collection(db, categoriesPath));
      categoryIds.push(categoryDocRef.id);
      
      batch.set(categoryDocRef, {
        ...category,
        userId, // Include userId in the document for security rules
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    logger.info('SeedTestData', 'seedTestCategories', 'Categories created successfully', { 
      userId, count: categoryIds.length 
    });
    
    return categoryIds;
  } catch (error) {
    logger.error('SeedTestData', 'seedTestCategories', 'Failed to seed categories', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Seed test transactions for a user
 * @param {string} userId - User ID to create transactions for
 * @param {Array} categoryIds - Array of category IDs to use
 * @param {number} count - Number of transactions to create
 * @returns {Promise<Array>} - Array of created transaction IDs
 */
export const seedTestTransactions = async (userId, categoryIds, count = 30) => {
  try {
    logger.info('SeedTestData', 'seedTestTransactions', 'Seeding test transactions', { 
      userId, count 
    });
    
    if (!categoryIds || categoryIds.length === 0) {
      throw new Error('No category IDs provided for transaction seeding');
    }
    
    const transactionsPath = `users/${userId}/transactions`;
    const transactionIds = [];
    
    // Use batch for better performance
    const batch = writeBatch(db);
    
    // Create transactions
    for (let i = 0; i < count; i++) {
      const isExpense = Math.random() > 0.3; // 70% chance of expense
      const categoryIndex = Math.floor(Math.random() * categoryIds.length);
      const categoryId = categoryIds[categoryIndex];
      
      // Generate random amount
      const amount = isExpense
        ? -Math.floor(Math.random() * 15000 + 500) / 100 // Between -5 and -155
        : Math.floor(Math.random() * 150000 + 20000) / 100; // Between 200 and 1700
      
      // Generate a date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Create transaction document
      const transactionDocRef = doc(collection(db, transactionsPath));
      transactionIds.push(transactionDocRef.id);
      
      const transactionData = {
        userId, // Include userId in the document for security rules
        type: isExpense ? 'expense' : 'income',
        amount,
        description: `Test ${isExpense ? 'expense' : 'income'} ${i + 1}`,
        categoryId,
        date: Timestamp.fromDate(date),
        isRecurringInstance: false,
        recurringRuleId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Log detailed debugging information for each transaction
      logger.debug('SeedTestData', 'seedTestTransactions', `Preparing transaction ${i + 1} for batch`, {
        index: i,
        transactionData: JSON.parse(JSON.stringify(transactionData)) // Log the complete object
      });
      
      batch.set(transactionDocRef, transactionData);
    }
    
    // Commit the batch
    logger.info('SeedTestData', 'seedTestTransactions', 'Committing transaction batch', { 
      userId, count: transactionIds.length 
    });
    
    await batch.commit();
    
    logger.info('SeedTestData', 'seedTestTransactions', 'Transactions created successfully', { 
      userId, count: transactionIds.length 
    });
    
    return transactionIds;
  } catch (error) {
    logger.error('SeedTestData', 'seedTestTransactions', 'Failed to seed transactions', {
      userId,
      count,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Main function to seed all test data
 * @param {string} userId - User ID to create data for
 * @param {number} transactionCount - Number of transactions to create
 * @returns {Promise<Object>} - Object with created category and transaction IDs
 */
const seedTestData = async (userId, transactionCount = 30) => {
  try {
    logger.info('SeedTestData', 'seedTestData', 'Starting full test data seeding', { 
      userId, transactionCount 
    });
    
    // Step 1: Seed categories
    const categoryIds = await seedTestCategories(userId);
    
    // Step 2: Seed transactions
    const transactionIds = await seedTestTransactions(userId, categoryIds, transactionCount);
    
    logger.info('SeedTestData', 'seedTestData', 'Test data seeding completed', { 
      userId, categoryCount: categoryIds.length, transactionCount: transactionIds.length 
    });
    
    return { categoryIds, transactionIds };
  } catch (error) {
    logger.error('SeedTestData', 'seedTestData', 'Failed to seed test data', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export default seedTestData; 