// src/services/testData/seedTestData.js

import {  
  collection,  
  doc,  
  writeBatch,  
  Timestamp,  
  serverTimestamp,  
  getDocs,  
  query,  
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';  
import { db } from '../firebase/firebaseInit';
import logger from '../logger';

// Enhanced logging wrapper for better debugging
const debugLog = {
  info: (operation, message, data = {}) => {
    console.log(`[${operation}] ${message}`, data);
    logger.info('SeedScript', operation, message, data);
  },
  error: (operation, message, error) => {
    console.error(`[${operation}] ERROR: ${message}`, {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    logger.error('SeedScript', operation, message, {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
  },
  debug: (operation, message, data = {}) => {
    console.debug(`[${operation}] DEBUG: ${message}`, data);
    logger.debug('SeedScript', operation, message, data);
  }
};

// Default budget template
const defaultBudget = {
  name: 'Personal Budget',
  currency: 'CAD',
  description: 'My personal budget for tracking expenses and income',
  version: 1  // Required by rules
};

// Default categories (Based on Bible [B3.1], [B3.6])
const defaultCategories = [  
  // Expenses  
  { name: 'Épicerie', type: 'expense', color: '#7FB069', order: 1, isDefault: true }, // Palette v5 - Brighter Leaf Green
  { name: 'Transport', type: 'expense', color: '#709AC7', order: 2, isDefault: true }, // Palette v5 - Stronger Slate Blue
  { name: 'Resto', type: 'expense', color: '#E0B470', order: 3, isDefault: true },     // Palette v5 - Clear Gold/Ochre
  { name: 'Santé', type: 'expense', color: '#4FB0A5', order: 4, isDefault: true },     // Palette v5 - Clear Aqua-Green
  { name: 'Loisirs', type: 'expense', color: '#A08CBF', order: 5, isDefault: true },    // Palette v5 - Clearer Lavender/Violet
  { name: 'Logement', type: 'expense', color: '#9A705A', order: 6, isDefault: true },    // Palette v5 - Mid-Tone Brown
  { name: 'Assurance', type: 'expense', color: '#3A5A78', order: 7, isDefault: true },   // Palette v5 - Deep Navy/Indigo
  { name: 'Gardienne', type: 'expense', color: '#E8B4BC', order: 8, isDefault: true },   // Palette v5 - Soft Pink
  { name: 'Cadeau', type: 'expense', color: '#F4A97F', order: 9, isDefault: true },      // Palette v5 - Clear Peach/Orange
  { name: 'Autres Dépenses', type: 'expense', color: '#C8AD9B', order: 100, isDefault: true },// Palette v5 - Neutral Tan/Beige

  // Income  
  { name: 'Salaire', type: 'income', color: '#7EB5D6', order: 101, isDefault: true },       // Palette v5 - Clear Sky Blue
  { name: 'Remboursements', type: 'income', color: '#99D4C8', order: 102, isDefault: true }, // Palette v5 - Pale Teal/Mint
  { name: 'Autres Revenus', type: 'income', color: '#C8AD9B', order: 103, isDefault: true },   // Palette v5 - Neutral Tan/Beige
];

// Sample recurring rule template
const sampleRecurringRule = {
  name: 'Monthly Rent',
  type: 'expense',
  amount: 1200,
  frequency: 'monthly',
  startDate: new Date(),
  description: 'Regular monthly rent payment',
  categoryId: '', // Will be set during seeding
  isActive: true
};

/**
 * Creates a new budget and establishes user membership
 * @param {string} userId - The ID of the user who will own the budget
 * @returns {Promise<string>} - The ID of the created budget
 */
export const createBudgetWithOwner = async (userId) => {
  const operation = 'createBudgetWithOwner';
  debugLog.info(operation, 'Starting budget creation process', { userId });

  try {
    debugLog.debug(operation, 'Creating batch write');
    const batch = writeBatch(db);
    
    // Create the budget document
    const budgetDocRef = doc(collection(db, 'budgets'));
    const budgetId = budgetDocRef.id;

    // Get user info for membership data
    const userDocRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    const userData = userDoc.data();
    
    // Prepare budget document data
    const budgetData = {
      ...defaultBudget,
      name: defaultBudget.name,  // Explicit string
      currency: defaultBudget.currency,  // Explicit string
      version: 1,  // Explicit number
      ownerId: userId,  // Required string
      members: {  // Required map
        [userId]: {  // Member entry with required fields
          role: 'owner',
          displayName: userData.displayName || 'User',
          email: userData.email || 'user@example.com',
          joinedAt: serverTimestamp()
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Log complete budget data for rule validation
    debugLog.debug(operation, 'Budget document data (for rule L70)', { 
      budgetId, 
      budgetData: JSON.parse(JSON.stringify({
        ...budgetData,
        createdAt: 'serverTimestamp()',
        updatedAt: 'serverTimestamp()',
        'members[userId].joinedAt': 'serverTimestamp()'
      })),
      ruleChecks: {
        hasName: typeof budgetData.name === 'string' && budgetData.name.length > 0,
        nameLength: budgetData.name.length <= 100,
        hasOwnerId: typeof budgetData.ownerId === 'string',
        hasMembers: budgetData.members instanceof Object,
        hasCurrency: typeof budgetData.currency === 'string',
        hasVersion: typeof budgetData.version === 'number',
        memberHasRole: budgetData.members[userId]?.role === 'owner',
        memberHasDisplayName: typeof budgetData.members[userId]?.displayName === 'string',
        memberHasEmail: typeof budgetData.members[userId]?.email === 'string',
        memberHasJoinedAt: budgetData.members[userId]?.joinedAt !== undefined
      }
    });
    
    batch.set(budgetDocRef, budgetData);
    
    // Create the user's budget membership link
    const membershipDocRef = doc(db, `users/${userId}/budgetMemberships/${budgetId}`);
    const membershipData = {
      role: 'owner',  // Required string
      budgetId,  // Required string matching path
      ownerId: userId,  // Required string matching auth
      budgetName: budgetData.name,  // Required string
      currency: budgetData.currency,  // Required string
      joinedAt: serverTimestamp(),  // Required timestamp
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Log complete membership data for rule validation
    debugLog.debug(operation, 'Membership document data (for rule L199)', { 
      userId, 
      budgetId, 
      membershipData: JSON.parse(JSON.stringify({
        ...membershipData,
        joinedAt: 'serverTimestamp()',
        createdAt: 'serverTimestamp()',
        updatedAt: 'serverTimestamp()'
      })),
      ruleChecks: {
        hasRole: membershipData.role === 'owner',
        budgetIdMatches: membershipData.budgetId === budgetId,
        ownerIdMatches: membershipData.ownerId === userId,
        hasBudgetName: typeof membershipData.budgetName === 'string' && membershipData.budgetName.length > 0,
        hasCurrency: typeof membershipData.currency === 'string',
        hasJoinedAt: membershipData.joinedAt !== undefined
      }
    });
    
    batch.set(membershipDocRef, membershipData);
    
    debugLog.info(operation, 'Attempting to commit batch');
    await batch.commit();
    debugLog.info(operation, 'Batch committed successfully', { budgetId, userId });
    
    return budgetId;
  } catch (error) {
    debugLog.error(operation, 'Failed to create budget', error);
    throw error;
  }
};

/**
 * Seeds default categories for a budget
 * @param {string} budgetId - The ID of the budget to seed categories for
 * @param {string} userId - The ID of the user who created the categories
 * @returns {Promise<Array>} - Array of created category IDs
 */
export const seedDefaultCategoriesForBudget = async (budgetId, userId) => {
  const operation = 'seedDefaultCategoriesForBudget';
  debugLog.info(operation, 'Starting category seeding process', { budgetId, userId });

  try {
    // Check if categories already exist
    const categoriesPath = `budgets/${budgetId}/categories`;
    debugLog.debug(operation, 'Checking for existing categories', { categoriesPath });
    
    const categoriesCollectionRef = collection(db, categoriesPath);
    const q = query(categoriesCollectionRef, limit(1));
    const existingSnapshot = await getDocs(q);

    if (!existingSnapshot.empty) {
      debugLog.info(operation, 'Categories already exist, fetching all', { budgetId });
      const fullSnapshot = await getDocs(categoriesCollectionRef);
      const categoryIds = fullSnapshot.docs.map(doc => doc.id);
      debugLog.info(operation, 'Found existing categories', { 
        budgetId, 
        count: categoryIds.length 
      });
      return categoryIds;
    }

    debugLog.info(operation, 'No existing categories found, creating new ones', { budgetId });
    const batch = writeBatch(db);
    const categoryIds = [];

    debugLog.debug(operation, 'Preparing categories batch', { 
      categoryCount: defaultCategories.length 
    });
    
    for (const category of defaultCategories) {
      const categoryDocRef = doc(categoriesCollectionRef);
      categoryIds.push(categoryDocRef.id);
      
      const categoryData = {
        ...category,
        budgetId,
        createdByUserId: userId,
        lastEditedByUserId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Log the first category data for debugging
      if (categoryIds.length === 1) {
        debugLog.debug(operation, 'First category data payload', { 
          categoryId: categoryDocRef.id,
          categoryData: JSON.parse(JSON.stringify({
            ...categoryData,
            createdAt: 'serverTimestamp()',
            updatedAt: 'serverTimestamp()'
          })),
          ruleChecks: {
            hasCreatedByUserId: !!categoryData.createdByUserId,
            hasBudgetId: categoryData.budgetId === budgetId,
            hasName: typeof categoryData.name === 'string',
            nameLength: categoryData.name.length > 0 && categoryData.name.length <= 50,
            hasType: categoryData.type in ['expense', 'income'],
            hasTimestamps: categoryData.createdAt !== undefined && categoryData.updatedAt !== undefined
          }
        });
      }
      
      batch.set(categoryDocRef, categoryData);
    }

    debugLog.info(operation, 'Attempting to commit categories batch');
    await batch.commit();
    debugLog.info(operation, 'Categories batch committed successfully', { 
      budgetId, 
      count: categoryIds.length 
    });

    return categoryIds;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed categories', error);
    throw error;
  }
};

/**
 * Seeds sample transactions for a budget
 * @param {string} budgetId - The budget ID to create transactions for
 * @param {Array} categoryIds - Array of category IDs to use
 * @param {number} count - Number of transactions to create
 * @returns {Promise<Array>} - Array of created transaction IDs
 */
export const seedSampleTransactionsForBudget = async (budgetId, categoryIds, count = 15) => {
  const operation = 'seedSampleTransactionsForBudget';
  debugLog.info(operation, 'Starting transaction seeding process', { 
    budgetId, 
    count 
  });

  try {
    if (!categoryIds?.length) {
      const error = new Error('No category IDs provided for transaction seeding');
      debugLog.error(operation, 'Validation failed', error);
      throw error;
    }

    const batch = writeBatch(db);
    const transactionIds = [];
    const transactionsPath = `budgets/${budgetId}/transactions`;

    debugLog.debug(operation, 'Preparing transactions batch', { 
      count,
      transactionsPath 
    });

    for (let i = 0; i < count; i++) {
      const isExpense = Math.random() > 0.2;
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const amount = isExpense
        ? -(Math.floor(Math.random() * 15000 + 500) / 100)
        : (Math.floor(Math.random() * 150000 + 20000) / 100);

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const transactionDocRef = doc(collection(db, transactionsPath));
      transactionIds.push(transactionDocRef.id);

      const transactionData = {
        budgetId,
        categoryId,
        amount,
        description: `Sample ${amount < 0 ? 'expense' : 'income'} ${i + 1}`,
        date: Timestamp.fromDate(date),
        isRecurringInstance: false,
        recurringRuleId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      debugLog.debug(operation, `Preparing transaction ${i + 1}`, {
        transactionId: transactionDocRef.id,
        transactionData
      });

      batch.set(transactionDocRef, transactionData);
    }

    debugLog.info(operation, 'Attempting to commit transactions batch');
    await batch.commit();
    debugLog.info(operation, 'Transactions batch committed successfully', {
      budgetId,
      count: transactionIds.length
    });

    return transactionIds;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed transactions', error);
    throw error;
  }
};

/**
 * Seeds a sample recurring rule for a budget
 * @param {string} budgetId - The budget ID to create the rule for
 * @param {string} categoryId - Category ID to use for the rule
 * @returns {Promise<string>} - ID of the created rule
 */
export const seedSampleRecurringRule = async (budgetId, categoryId) => {
  const operation = 'seedSampleRecurringRule';
  debugLog.info(operation, 'Starting recurring rule creation', { budgetId });

  try {
    const ruleDocRef = doc(collection(db, `budgets/${budgetId}/recurringRules`));
    
    const ruleData = {
      ...sampleRecurringRule,
      budgetId,
      categoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    debugLog.debug(operation, 'Preparing recurring rule document', {
      ruleId: ruleDocRef.id,
      ruleData
    });

    debugLog.info(operation, 'Attempting to create recurring rule');
    await setDoc(ruleDocRef, ruleData);
    
    debugLog.info(operation, 'Recurring rule created successfully', {
      budgetId,
      ruleId: ruleDocRef.id
    });

    return ruleDocRef.id;
  } catch (error) {
    debugLog.error(operation, 'Failed to create recurring rule', error);
    throw error;
  }
};

/**
 * Main seeding function - Creates a complete budget setup for a user
 * @param {string} userId - The user ID to seed data for
 */
export const runSeedForUser = async (userId) => {
  const operation = 'runSeedForUser';
  debugLog.info(operation, 'Starting full seeding process', { userId });

  try {
    // Step 1: Create a new budget and establish ownership
    debugLog.info(operation, 'Step 1: Creating budget and establishing ownership');
    const budgetId = await createBudgetWithOwner(userId);

    // Step 2: Seed default categories
    debugLog.info(operation, 'Step 2: Seeding default categories', { budgetId });
    const categoryIds = await seedDefaultCategoriesForBudget(budgetId, userId);

    // Step 3: Seed sample transactions
    debugLog.info(operation, 'Step 3: Seeding sample transactions', { 
      budgetId,
      categoryCount: categoryIds.length 
    });
    await seedSampleTransactionsForBudget(budgetId, categoryIds, 15);

    // Step 4: Create a sample recurring rule
    debugLog.info(operation, 'Step 4: Creating sample recurring rule');
    const expenseCategory = categoryIds[0];
    await seedSampleRecurringRule(budgetId, expenseCategory);

    debugLog.info(operation, 'Full seeding process completed successfully', {
      userId,
      budgetId,
      categoryCount: categoryIds.length
    });

    return { budgetId, categoryIds };
  } catch (error) {
    debugLog.error(operation, 'Full seeding process failed', error);
    throw error;
  }
};

// Example usage:
// import { runSeedForUser } from './services/testData/seedTestData';
// const userIdToSeed = 'some_user_id';
// runSeedForUser(userIdToSeed); 