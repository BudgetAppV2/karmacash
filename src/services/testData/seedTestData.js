// src/services/testData/seedTestData.js

import {  
  collection,  
  doc,  
  writeBatch,  
  Timestamp,  
  serverTimestamp,  
  getDocs,  
  query,  
  limit  
} from 'firebase/firestore';  
import { db } from '../firebase/firebaseInit';
import logger from '../logger';

// --- Default Categories (Based on Bible [B3.1], [B3.6]) ---  
// Ensure these match the structure expected by your app and rules  
const defaultCategories = [  
  // Expenses  
  { name: 'Épicerie', type: 'expense', color: '#A66962', order: 1, isDefault: true },  
  { name: 'Transport', type: 'expense', color: '#7A8D99', order: 2, isDefault: true },  
  { name: 'Resto', type: 'expense', color: '#C17C74', order: 3, isDefault: true },  
  { name: 'Santé', type: 'expense', color: '#568E8D', order: 4, isDefault: true },  
  { name: 'Loisirs', type: 'expense', color: '#A58D7F', order: 5, isDefault: true },  
  { name: 'Logement', type: 'expense', color: '#919A7F', order: 6, isDefault: true }, // Added based on recurring rule example  
  { name: 'Assurance', type: 'expense', color: '#D9D0C7', order: 7, isDefault: true }, // Added based on recurring rule example  
  { name: 'Gardienne', type: 'expense', color: '#88837A', order: 8, isDefault: true }, // Added based on Bible examples  
  { name: 'Cadeau', type: 'expense', color: '#7A8D99', order: 9, isDefault: true }, // Added based on Bible examples  
  { name: 'Autres Dépenses', type: 'expense', color: '#A58D7F', order: 100, isDefault: true }, // Renamed from 'Autres' for clarity

  // Income  
  { name: 'Salaire', type: 'income', color: '#568E8D', order: 101, isDefault: true },  
  { name: 'Remboursements', type: 'income', color: '#919A7F', order: 102, isDefault: true }, // E.g., general refunds  
  { name: 'Autres Revenus', type: 'income', color: '#A66962', order: 103, isDefault: true },  
];

/**  
 * Initializes default categories for a specific user if they don't exist.  
 * Uses a batch write for efficiency.  
 * (This is similar to the function likely in categories.js, but adapted for seeding)  
 * @param {string} userId - The ID of the user to initialize categories for.  
 * @returns {Promise<boolean>} - True if categories were initialized, false otherwise.  
 */  
export const seedDefaultCategoriesForUser = async (userId) => {  
  const operation = 'seedDefaultCategoriesForUser';  
  logger.info('SeedScript', operation, 'Starting default category seeding check', { userId });

  if (!userId) {  
    logger.error('SeedScript', operation, 'User ID is required for seeding categories.');  
    return false;  
  }

  const categoriesPath = `users/${userId}/categories`;  
  const categoriesCollectionRef = collection(db, categoriesPath);

  try {  
    // Check if categories already exist for this user  
    const q = query(categoriesCollectionRef, limit(1));  
    const existingCategoriesSnapshot = await getDocs(q);

    if (!existingCategoriesSnapshot.empty) {  
      logger.info('SeedScript', operation, 'Categories already exist for user, skipping seeding.', { userId });  
      return false; // Categories already seeded  
    }

    logger.info('SeedScript', operation, 'No categories found, proceeding with seeding.', { userId });

    // Create a new batch  
    const batch = writeBatch(db);

    // Add each default category to the batch  
    defaultCategories.forEach((category) => {  
      const categoryDocRef = doc(categoriesCollectionRef); // Auto-generate ID  
      batch.set(categoryDocRef, {  
        ...category,  
        userId: userId, // IMPORTANT: Include userId in the document data  
        createdAt: serverTimestamp(),  
        updatedAt: serverTimestamp(),  
      });  
    });

    // Commit the batch  
    await batch.commit();  
    logger.info('SeedScript', operation, 'Default categories batch committed successfully.', { userId, count: defaultCategories.length });  
    return true;

  } catch (error) {  
    logger.error('SeedScript', operation, 'Failed to seed default categories', {  
      userId,  
      error: error.message,  
      errorCode: error.code,  
      stack: error.stack,  
    });  
    throw error; // Re-throw the error after logging  
  }  
};

/**  
 * Seeds sample transactions for a specific user.  
 * Assumes default categories have been seeded first to get valid category IDs.  
 * @param {string} userId - The ID of the user to seed transactions for.  
 * @param {number} count - Number of sample transactions to create.  
 * @returns {Promise<void>}  
 */  
export const seedSampleTransactionsForUser = async (userId, count = 10) => {  
  const operation = 'seedSampleTransactionsForUser';  
  logger.info('SeedScript', operation, `Starting sample transaction seeding for ${count} items`, { userId });

  if (!userId) {  
    logger.error('SeedScript', operation, 'User ID is required for seeding transactions.');  
    return;  
  }

  try {  
    // Fetch the user's actual categories to get valid IDs  
    const categoriesPath = `users/${userId}/categories`;  
    const categoriesCollectionRef = collection(db, categoriesPath);  
    const categoriesSnapshot = await getDocs(categoriesCollectionRef);

    if (categoriesSnapshot.empty) {  
      logger.warn('SeedScript', operation, 'Cannot seed transactions: No categories found for user. Run seedDefaultCategoriesForUser first.', { userId });  
      return;  
    }

    const userCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));  
    const expenseCategories = userCategories.filter(c => c.type === 'expense');  
    const incomeCategories = userCategories.filter(c => c.type === 'income');

    if (expenseCategories.length === 0 || incomeCategories.length === 0) {  
       logger.warn('SeedScript', operation, 'Cannot seed transactions: Missing expense or income categories.', { userId });  
       return;  
    }

    const batch = writeBatch(db);  
    const transactionsPath = `users/${userId}/transactions`;  
    const transactionsCollectionRef = collection(db, transactionsPath);

    for (let i = 0; i < count; i++) {  
      const isExpense = Math.random() > 0.2; // 80% chance of expense  
      const category = isExpense  
        ? expenseCategories[Math.floor(Math.random() * expenseCategories.length)]  
        : incomeCategories[Math.floor(Math.random() * incomeCategories.length)];

      const amount = isExpense  
        ? -(Math.random() * 100 + 5).toFixed(2) // Expense between -5 and -105  
        : (Math.random() * 500 + 50).toFixed(2); // Income between 50 and 550

      // Generate a date within the last 30 days  
      const dateOffset = Math.floor(Math.random() * 30);  
      const transactionDate = new Date();  
      transactionDate.setDate(transactionDate.getDate() - dateOffset);

      const transactionData = {  
        userId: userId, // IMPORTANT: Include userId  
        categoryId: category.id,  
        type: category.type,  
        amount: parseFloat(amount),  
        description: `Sample ${category.type} ${i + 1} (${category.name})`,  
        date: Timestamp.fromDate(transactionDate), // Use Firestore Timestamp  
        isRecurringInstance: false,  
        recurringRuleId: null,  
        createdAt: serverTimestamp(),  
        updatedAt: serverTimestamp(),  
      };

      // Add debug logging for each transaction being prepared
      logger.debug('SeedScript', operation, `Preparing transaction ${i + 1} for batch`, {
        index: i,
        transactionData: JSON.parse(JSON.stringify(transactionData)) // Log the specific object
      });

      const transactionDocRef = doc(transactionsCollectionRef); // Auto-generate ID  
      batch.set(transactionDocRef, transactionData);  
    }

    await batch.commit();  
    logger.info('SeedScript', operation, `Sample transactions batch committed successfully.`, { userId, count });

  } catch (error) {  
    logger.error('SeedScript', operation, 'Failed to seed sample transactions', {  
      userId,  
      error: error.message,  
      errorCode: error.code,  
      stack: error.stack,  
    });  
    throw error;  
  }  
};

/**  
 * Main seeding function - Call this to seed data for a user  
 * @param {string} userId - The user ID to seed data for  
 */  
export const runSeedForUser = async (userId) => {  
  const operation = 'runSeedForUser';  
  logger.info('SeedScript', operation, 'Starting full seed process for user.', { userId });  
  try {  
    const categoriesSeeded = await seedDefaultCategoriesForUser(userId);  
    if (categoriesSeeded || !categoriesSeeded) { // Proceed even if categories existed  
      await seedSampleTransactionsForUser(userId, 15); // Seed 15 sample transactions  
    }  
    logger.info('SeedScript', operation, 'Full seed process completed for user.', { userId });  
  } catch (error) {  
    logger.error('SeedScript', operation, 'Full seed process failed for user.', { userId, error: error.message });  
  }  
};

// Example of how you might call this (e.g., from a test script or a temporary button in dev)  
// import { runSeedForUser } from './services/testData/seedTestData';  
// const userIdToSeed = 'some_user_id';  
// runSeedForUser(userIdToSeed); 