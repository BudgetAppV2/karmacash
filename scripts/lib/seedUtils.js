/**
 * Shared Firebase Admin SDK Seeding Utilities
 * 
 * This module provides reusable functions for seeding test data in the Firestore database
 * for KarmaCash using the Firebase Admin SDK.
 * 
 * These utilities can be used by CLI tools, test scripts, or other applications
 * that need to reliably generate test data conforming to the M4a budget-centric model.
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Debug logging wrapper
const debugLog = {
  info: (operation, message, data = {}) => {
    console.log(`[${operation}] ${message}`, data);
  },
  error: (operation, message, error) => {
    console.error(`[${operation}] ERROR: ${message}`);
    if (error) {
      console.error('  Error:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
    }
  },
  debug: (operation, message, data = {}, verbose = false) => {
    if (verbose) {
      console.debug(`[${operation}] DEBUG: ${message}`, data);
    }
  },
  verbose: (operation, message, data = {}, verbose = false) => {
    if (verbose) {
      console.log(`[${operation}] VERBOSE: ${message}`, JSON.stringify(data, null, 2));
    }
  }
};

// Default categories array (Based on Bible [B3.1], [B3.6])
export const defaultCategories = [  
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

// Sample transaction descriptions for more realistic data
export const sampleTransactions = {
  expense: {
    'Épicerie': [
      'IGA - Épicerie hebdomadaire',
      'Metro - Fruits et légumes',
      'Costco - Provisions du mois',
      'Marché Jean-Talon',
      'Provigo - Essentiels'
    ],
    'Transport': [
      'Essence Petro-Canada',
      'STM - Passe mensuelle',
      'Uber - Trajet travail',
      'Communauto - Location',
      'Stationnement centre-ville'
    ],
    'Resto': [
      'Tim Hortons - Café',
      'Subway - Lunch',
      'Restaurant Le Local',
      'Sushi Shop',
      'St-Hubert - Souper'
    ],
    'Santé': [
      'Pharmacie Jean Coutu',
      'Clinique dentaire',
      'Physio - Session',
      'Uniprix - Médicaments',
      'Lunetterie - Verres'
    ],
    'Loisirs': [
      'Cinéma Cineplex',
      'Spotify Premium',
      'Netflix Abonnement',
      'Gym - Mensuel',
      'Librairie - Livres'
    ],
    'Logement': [
      'Loyer mensuel',
      'Hydro-Québec',
      'Bell - Internet',
      'Vidéotron - Cable',
      'Assurance habitation'
    ]
  },
  income: {
    'Salaire': [
      'Salaire - Période 1',
      'Salaire - Période 2',
      'Prime performance',
      'Bonus annuel',
      'Heures supplémentaires'
    ],
    'Remboursements': [
      'Remb. Assurance',
      'Remb. Taxes',
      'Remb. Dépenses',
      'Remb. Transport',
      'Remb. Formation'
    ]
  }
};

// Amount ranges for realistic values
export const amountRanges = {
  'Épicerie': { min: 25, max: 250 },
  'Transport': { min: 15, max: 150 },
  'Resto': { min: 15, max: 100 },
  'Santé': { min: 20, max: 200 },
  'Loisirs': { min: 10, max: 150 },
  'Logement': { min: 500, max: 2000 },
  'Salaire': { min: 1500, max: 4000 },
  'Remboursements': { min: 50, max: 500 }
};

// Sample recurring rules templates
export const recurringRuleTemplates = [
  {
    name: 'Loyer mensuel',
    type: 'expense',
    amount: 1200,
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: 1,
    dayOfWeek: null,
    description: 'Paiement mensuel du loyer',
    categoryName: 'Logement',
    isActive: true
  },
  {
    name: 'Hydro-Québec',
    type: 'expense',
    amount: 85,
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: 15,
    dayOfWeek: null,
    description: 'Facture mensuelle Hydro-Québec',
    categoryName: 'Logement',
    isActive: true
  },
  {
    name: 'Assurance habitation',
    type: 'expense',
    amount: 45,
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: 5,
    dayOfWeek: null,
    description: 'Prime mensuelle assurance habitation',
    categoryName: 'Assurance',
    isActive: true
  }
];

/**
 * Initialize Firebase Admin SDK with proper error handling
 * @param {Object} options - Options for initialization
 * @param {string} options.projectId - Firebase project ID
 * @param {string} options.emulatorHost - Firestore emulator host
 * @param {boolean} options.debug - Enable verbose debug logging
 * @returns {Promise<FirebaseFirestore.Firestore>}
 */
export async function initializeFirebase(options = {}) {
  const operation = 'initializeFirebase';
  try {
    // Get configuration from options or environment or use defaults
    const projectId = options.projectId || process.env.FIREBASE_PROJECT_ID || 'karmacash-6e8f5';
    const emulatorHost = options.emulatorHost || process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8085';
    const debug = options.debug || false;
    
    debugLog.info(operation, 'Initializing Firebase Admin SDK', {
      projectId,
      emulatorHost,
      nodeVersion: process.version
    });
    
    // Initialize the app if not already initialized
    const app = admin.apps.length 
      ? admin.apps[0]
      : admin.initializeApp({
          projectId,
          // No credentials needed for emulator
        });
    
    // Configure Firestore to use emulator
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    
    // Get Firestore instance
    const db = getFirestore(app);
    
    // Test connectivity
    const isConnected = await testConnection(db, debug);
    if (!isConnected) {
      throw new Error('Failed to connect to Firestore emulator');
    }
    
    debugLog.info(operation, 'Firebase Admin SDK initialized successfully', {
      projectId,
      emulatorHost,
      timestamp: new Date().toISOString()
    });
    
    return db;
  } catch (error) {
    debugLog.error(operation, 'Failed to initialize Firebase Admin SDK', error);
    throw error;
  }
}

/**
 * Tests Firestore emulator connectivity
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {boolean} debug - Enable verbose debug logging
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testConnection(db, debug = false) {
  const operation = 'testConnection';
  try {
    debugLog.info(operation, 'Testing Firestore emulator connectivity...');
    
    // Try to read a non-existent document
    const testRef = db.collection('_test_').doc('connectivity');
    await testRef.get();
    
    // Try to write a test document
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true
    });
    
    // Try to delete the test document
    await testRef.delete();
    
    debugLog.info(operation, 'Firestore emulator connection test successful');
    return true;
  } catch (error) {
    debugLog.error(operation, 'Firestore emulator connection test failed', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nERROR: Could not connect to Firestore emulator.');
      console.error('Please ensure:');
      console.error('1. Firebase emulator is running (firebase emulators:start)');
      console.error(`2. Emulator host is correct (${process.env.FIRESTORE_EMULATOR_HOST})`);
      console.error('3. No firewall is blocking the connection\n');
    }
    
    return false;
  }
}

/**
 * Generate a random amount within a realistic range for the category
 * @param {string} categoryName - The name of the category
 * @param {string} type - Transaction type ('expense' or 'income')
 * @returns {number} - The generated amount
 */
export function generateAmount(categoryName, type) {
  const range = amountRanges[categoryName] || { min: 10, max: 100 };
  const amount = Math.random() * (range.max - range.min) + range.min;
  return type === 'expense' ? -Math.round(amount * 100) / 100 : Math.round(amount * 100) / 100;
}

/**
 * Generate a random date within a specified range
 * @param {number} daysBack - How many days back to start the range
 * @param {number} rangeDays - How many days to spread the dates across
 * @returns {Date} - The generated date
 */
export function generateDate(daysBack, rangeDays) {
  const end = new Date();
  end.setDate(end.getDate() - daysBack);
  const start = new Date(end);
  start.setDate(start.getDate() - rangeDays);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate a random date within a specific month (YYYY-MM)
 * @param {string} yearMonthString - Month in YYYY-MM format (e.g., "2025-05")
 * @returns {Date} - The generated date as a UTC Date object
 */
export function generateDateInMonth(yearMonthString) {
  const operation = 'generateDateInMonth';
  
  try {
    // Parse the YYYY-MM string
    const [year, month] = yearMonthString.split('-').map(Number);
    
    // Validate input
    if (isNaN(year) || isNaN(month) || year < 2000 || year > 2100 || month < 1 || month > 12) {
      throw new Error(`Invalid month format: ${yearMonthString}. Expected YYYY-MM (e.g., 2025-05)`);
    }
    
    // Calculate days in month (accounting for leap years)
    // Month parameter for Date constructor is 0-based, so month-1 gives last day of month
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getDate();
    
    // Generate random day in month (1 to daysInMonth)
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    
    // Generate random time
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    // Create date in UTC as per KarmaCash standards [B2.3]
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    
    debugLog.debug(operation, 'Generated date in month', {
      yearMonthString,
      year,
      month,
      day,
      hour,
      minute,
      second,
      daysInMonth,
      dateUTC: date.toISOString()
    }, false);
    
    return date;
  } catch (error) {
    debugLog.error(operation, 'Error generating date in month', error);
    throw error;
  }
}

/**
 * Seeds default categories for a budget
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} budgetId - The budget ID to create categories for
 * @param {string} userId - The user ID creating the categories
 * @param {boolean} debug - Enable verbose debug logging
 * @returns {Promise<string[]>} - Array of created category IDs
 */
export async function seedDefaultCategories(db, budgetId, userId, debug = false) {
  const operation = 'seedDefaultCategories';
  try {
    debugLog.info(operation, 'Starting category seeding process', { 
      budgetId, 
      userId,
      categoryCount: defaultCategories.length
    });

    // Create batch operation for multiple categories
    const batch = db.batch();
    const categoryIds = [];

    // Reference to categories collection
    const categoriesRef = db.collection(`budgets/${budgetId}/categories`);

    // Create each category
    for (const category of defaultCategories) {
      const categoryDocRef = categoriesRef.doc();
      const categoryId = categoryDocRef.id;
      categoryIds.push(categoryId);

      const categoryData = {
        ...category,
        budgetId,  // Required by security rules
        createdByUserId: userId,  // Required by security rules
        lastEditedByUserId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Log the first category for validation
      if (categoryIds.length === 1) {
        debugLog.debug(operation, 'First category data payload', {
          categoryId,
          categoryData: {
            ...categoryData,
            createdAt: 'serverTimestamp()',
            updatedAt: 'serverTimestamp()'
          },
          validation: {
            hasCreatedByUserId: !!categoryData.createdByUserId,
            hasBudgetId: categoryData.budgetId === budgetId,
            hasName: typeof categoryData.name === 'string',
            nameLength: categoryData.name.length > 0 && categoryData.name.length <= 50,
            hasType: categoryData.type in ['expense', 'income'],
            hasTimestamps: true,
            hasColor: typeof categoryData.color === 'string',
            hasOrder: typeof categoryData.order === 'number'
          }
        }, debug);
      }

      batch.set(categoryDocRef, categoryData);
    }

    // Commit the batch
    debugLog.info(operation, 'Committing categories batch', { 
      budgetId,
      count: categoryIds.length 
    });
    
    await batch.commit();

    debugLog.info(operation, 'Categories created successfully', {
      budgetId,
      count: categoryIds.length,
      expenseCount: defaultCategories.filter(c => c.type === 'expense').length,
      incomeCount: defaultCategories.filter(c => c.type === 'income').length
    });

    return categoryIds;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed categories', error);
    
    // Enhance error message based on common issues
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. User has editor/owner role in the budget');
      console.error('2. All required category fields are present');
      console.error('3. Category names are within length limits');
      console.error('4. Category types are valid (expense/income)\n');
    }
    
    throw error;
  }
}

/**
 * Seeds sample transactions for a budget
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} budgetId - The budget ID
 * @param {string} userId - The user ID creating the transactions
 * @param {Object[]} categories - Array of category objects with their IDs and details
 * @param {Object} options - Options for transaction creation
 * @param {number} [options.count=20] - Number of transactions to create
 * @param {Array} [options.recurringRules=[]] - Recurring rules to use for recurring instances
 * @param {number} [options.recurringInstancesPercent=30] - Percentage of transactions that should be recurring instances
 * @param {string} [options.targetMonth] - Target month in YYYY-MM format
 * @param {boolean} [options.debug] - Enable verbose debug logging
 * @returns {Promise<string[]>} - Array of created transaction IDs
 */
export async function seedSampleTransactions(db, budgetId, userId, categories, options = {}) {
  const operation = 'seedSampleTransactions';
  try {
    // Get existing options with defaults
    const {
      count = 20,
      recurringRules = [],
      recurringInstancesPercent = 30,
      targetMonth = null,
      debug = false
    } = options;

    debugLog.info(operation, 'Starting transaction seeding process', { 
      budgetId, 
      userId,
      categoryCount: categories.length,
      targetCount: count,
      targetMonth: targetMonth || 'default (last 60 days)',
      recurringRulesAvailable: recurringRules.length,
      recurringInstancesPercent
    });

    if (!categories?.length) {
      throw new Error('No categories provided for transaction seeding');
    }

    // Create batch operation
    const batch = db.batch();
    const transactionIds = [];
    const transactionsRef = db.collection(`budgets/${budgetId}/transactions`);

    // Group categories by type for easier selection
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    debugLog.debug(operation, 'Category distribution', {
      expenseCount: expenseCategories.length,
      incomeCount: incomeCategories.length
    }, debug);

    // Create transactions
    for (let i = 0; i < count; i++) {
      // Determine transaction type (70% expenses, 30% income)
      const isExpense = Math.random() < 0.7;
      const categoryPool = isExpense ? expenseCategories : incomeCategories;
      const category = categoryPool[Math.floor(Math.random() * categoryPool.length)];

      // Generate transaction date based on command-line argument
      const date = targetMonth
        ? generateDateInMonth(targetMonth) // Generate date in specific month
        : generateDate(0, 60);             // Spread across last 60 days (default)
      
      // Create document reference
      const transactionDocRef = transactionsRef.doc();
      const transactionId = transactionDocRef.id;
      transactionIds.push(transactionId);

      // Determine if this should be a recurring instance
      // Only make expense transactions recurring instances, and only if we have recurring rules
      const shouldBeRecurringInstance = 
        category.type === 'expense' && 
        recurringRules.length > 0 && 
        Math.random() * 100 < recurringInstancesPercent;

      let description, amount, isRecurringInstance = false, recurringRuleId = null;

      if (shouldBeRecurringInstance) {
        // Pick a random recurring rule
        const randomRuleIndex = Math.floor(Math.random() * recurringRules.length);
        const recurringRule = recurringRules[randomRuleIndex];
        
        // Use the rule's details
        isRecurringInstance = true;
        recurringRuleId = recurringRule.id;
        description = `${recurringRule.name} (récurrent)`;
        
        // Find the category for this rule
        const ruleCategory = categories.find(c => c.id === recurringRule.categoryId);
        
        // Generate a realistic amount based on the rule's amount (with some variation)
        const variationPercent = Math.random() * 10 - 5; // -5% to +5% variation
        const baseAmount = Math.abs(recurringRule.amount);
        const variation = baseAmount * (variationPercent / 100);
        amount = -Math.abs(baseAmount + variation); // Ensure negative for expenses
      } else {
        // Regular non-recurring transaction
        const descriptions = sampleTransactions[category.type][category.name] || ['Transaction'];
        description = descriptions[Math.floor(Math.random() * descriptions.length)];
        amount = generateAmount(category.name, category.type);
      }

      const transactionData = {
        budgetId,
        categoryId: category.id,
        type: category.type,
        amount,
        description,
        date: admin.firestore.Timestamp.fromDate(date),
        isRecurringInstance,
        recurringRuleId,
        createdByUserId: userId,
        lastEditedByUserId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Log first transaction for validation
      if (i === 0) {
        debugLog.debug(operation, 'First transaction data payload', {
          transactionId,
          transactionData: {
            ...transactionData,
            date: date.toISOString(),
            createdAt: 'serverTimestamp()',
            updatedAt: 'serverTimestamp()'
          },
          validation: {
            hasBudgetId: transactionData.budgetId === budgetId,
            hasCategoryId: !!transactionData.categoryId,
            hasAmount: typeof transactionData.amount === 'number',
            hasDescription: typeof transactionData.description === 'string',
            hasDate: transactionData.date instanceof admin.firestore.Timestamp,
            hasCreatedByUserId: transactionData.createdByUserId === userId,
            isRecurringInstance: transactionData.isRecurringInstance,
            hasRecurringRuleId: transactionData.isRecurringInstance ? !!transactionData.recurringRuleId : true
          }
        }, debug);
      }

      batch.set(transactionDocRef, transactionData);
    }

    // Commit the batch
    debugLog.info(operation, 'Committing transactions batch');
    await batch.commit();

    // Count regular vs recurring transactions
    const recurringCount = transactionIds.filter((_, i) => i % 10 < (recurringInstancesPercent / 10)).length;
    const regularCount = transactionIds.length - recurringCount;
    
    // Log success with statistics
    debugLog.info(operation, 'Transactions created successfully', {
      budgetId,
      totalCount: transactionIds.length,
      regularCount,
      recurringCount,
      targetMonth: targetMonth || 'default (last 60 days)'
    });

    return transactionIds;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed transactions', error);
    
    // Enhance error message based on common issues
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. User has editor/owner role in the budget');
      console.error('2. All required transaction fields are present');
      console.error('3. Category IDs are valid');
      console.error('4. Amount and date formats are correct\n');
    }
    
    throw error;
  }
}

/**
 * Seeds sample recurring rules for a budget
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} budgetId - The budget ID
 * @param {string} userId - The user ID creating the rules
 * @param {Object[]} categories - Array of category objects with their IDs and details
 * @param {boolean} debug - Enable verbose debug logging
 * @returns {Promise<string[]>} - Array of created rule IDs
 */
export async function seedSampleRecurringRules(db, budgetId, userId, categories, debug = false) {
  const operation = 'seedSampleRecurringRules';
  try {
    debugLog.info(operation, 'Starting recurring rules seeding process', { 
      budgetId, 
      userId,
      templateCount: recurringRuleTemplates.length
    });

    // Create batch operation
    const batch = db.batch();
    const ruleIds = [];
    const rulesRef = db.collection(`budgets/${budgetId}/recurringRules`);

    // Process each template
    for (const template of recurringRuleTemplates) {
      // Find matching category
      const category = categories.find(c => c.name === template.categoryName);
      if (!category) {
        debugLog.error(operation, `No matching category found for template: ${template.name}`, {
          categoryName: template.categoryName,
          availableCategories: categories.map(c => c.name)
        });
        continue;
      }

      // Create rule document
      const ruleDocRef = rulesRef.doc();
      const ruleId = ruleDocRef.id;
      ruleIds.push(ruleId);

      // Set start date to beginning of next month
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setMonth(startDate.getMonth() + 1);
      startDate.setHours(0, 0, 0, 0);

      const ruleData = {
        budgetId,
        categoryId: category.id,
        name: template.name,
        type: template.type,
        amount: -Math.abs(template.amount), // Ensure negative for expenses
        frequency: template.frequency,
        interval: template.interval,
        dayOfMonth: template.dayOfMonth,
        dayOfWeek: template.dayOfWeek,
        description: template.description,
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        endDate: null,
        isActive: template.isActive,
        createdByUserId: userId,
        lastEditedByUserId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Log first rule for validation
      if (ruleIds.length === 1) {
        debugLog.debug(operation, 'First recurring rule data payload', {
          ruleId,
          ruleData: {
            ...ruleData,
            startDate: startDate.toISOString(),
            createdAt: 'serverTimestamp()',
            updatedAt: 'serverTimestamp()'
          },
          validation: {
            hasBudgetId: ruleData.budgetId === budgetId,
            hasCategoryId: !!ruleData.categoryId,
            hasName: typeof ruleData.name === 'string',
            nameLength: ruleData.name.length > 0 && ruleData.name.length <= 100,
            hasType: ruleData.type === 'expense' || ruleData.type === 'income',
            hasAmount: typeof ruleData.amount === 'number',
            hasFrequency: ['daily', 'weekly', 'bi-weekly', 'monthly', 'annual'].includes(ruleData.frequency),
            hasInterval: typeof ruleData.interval === 'number' && ruleData.interval > 0,
            hasStartDate: ruleData.startDate instanceof admin.firestore.Timestamp,
            hasCreatedByUserId: ruleData.createdByUserId === userId
          }
        }, debug);
      }

      batch.set(ruleDocRef, ruleData);
    }

    // Commit the batch if we have any rules to create
    if (ruleIds.length > 0) {
      debugLog.info(operation, 'Committing recurring rules batch');
      await batch.commit();

      debugLog.info(operation, 'Recurring rules created successfully', {
        budgetId,
        count: ruleIds.length,
        rules: ruleIds.map((id, index) => ({
          id,
          name: recurringRuleTemplates[index].name
        }))
      });
    } else {
      debugLog.warn(operation, 'No recurring rules created - no matching categories found');
    }

    return ruleIds;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed recurring rules', error);
    
    // Enhance error message based on common issues
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. User has editor/owner role in the budget');
      console.error('2. All required rule fields are present');
      console.error('3. Category IDs are valid');
      console.error('4. Frequency and interval values are valid\n');
    }
    
    throw error;
  }
}

/**
 * Seeds monthly budget allocations for a given budget and month
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} budgetId - The budget ID to seed allocations for
 * @param {string} userId - The user ID creating the allocations
 * @param {Array} categories - Array of category objects with their IDs and details
 * @param {string} [targetMonth=null] - Target month in YYYY-MM format (use current month if not specified)
 * @param {boolean} debug - Enable verbose debug logging
 * @returns {Promise<Object>} - The created monthly data document
 */
export async function seedMonthlyBudgetAllocations(db, budgetId, userId, categories, targetMonth = null, debug = false) {
  const operation = 'seedMonthlyBudgetAllocations';
  try {
    // Determine month to use (either specified target month or current month)
    const now = new Date();
    const monthToUse = targetMonth || 
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    debugLog.info(operation, 'Starting monthly budget allocation seeding', { 
      budgetId, 
      userId,
      monthToUse,
      categoryCount: categories.length
    });

    // Get only expense categories
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    if (expenseCategories.length === 0) {
      throw new Error('No expense categories found to create allocations');
    }
    
    // Calculate a reasonable total budget amount (between 2000-3500)
    const totalBudget = Math.floor(Math.random() * 1500) + 2000;
    
    // Create allocations map with sensible allocated amounts
    const allocations = {};
    let remainingBudget = totalBudget;
    
    // Process all categories except the last one with random amounts
    for (let i = 0; i < expenseCategories.length - 1; i++) {
      const category = expenseCategories[i];
      // Ensure we don't allocate more than 60% of remaining budget to any category
      // Also ensure we leave some minimum for remaining categories
      const maxAllocation = Math.min(
        remainingBudget * 0.6, 
        remainingBudget - (expenseCategories.length - i - 1) * 50
      );
      
      // Generate a random allocation between 50 and maxAllocation
      const allocation = Math.max(50, Math.floor(Math.random() * maxAllocation));
      allocations[category.id] = allocation;
      remainingBudget -= allocation;
    }
    
    // Allocate the remaining budget to the last category
    const lastCategory = expenseCategories[expenseCategories.length - 1];
    allocations[lastCategory.id] = Math.max(50, remainingBudget);
    
    debugLog.debug(operation, 'Generated allocations', {
      budgetId,
      monthToUse,
      totalAllocated: Object.values(allocations).reduce((sum, val) => sum + val, 0),
      allocations
    }, debug);

    // Create the monthlyData document
    const monthlyDataRef = db.doc(`budgets/${budgetId}/monthlyData/${monthToUse}`);
    
    // Calculate sample month values for the calculated field
    // These values won't be perfectly accurate without real calculation logic,
    // but they provide reasonable test data
    const income = Math.floor(Math.random() * 1000) + totalBudget; // Income > totalBudget
    const recurringExpenses = Math.floor(totalBudget * 0.4); // 40% of budget is recurring
    const rollover = Math.floor(Math.random() * 300) - 100; // Between -100 and 200
    const availableToAllocate = income - recurringExpenses + rollover;
    const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    const remainingToAllocate = availableToAllocate - totalAllocated;
    const spent = Math.floor(totalAllocated * 0.7); // 70% of budget spent
    const savings = income - spent;

    // Prepare document data following B5.2 schema
    const monthlyData = {
      budgetId,
      month: monthToUse,
      year: parseInt(monthToUse.split('-')[0], 10),
      calculated: {
        revenue: income,
        recurringExpenses: recurringExpenses,
        rolloverFromPrevious: rollover,
        availableToAllocate: availableToAllocate,
        totalAllocated: totalAllocated,
        remainingToAllocate: remainingToAllocate,
        totalSpent: spent,
        monthlySavings: savings
      },
      allocations,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastEditedByUserId: userId
    };

    await monthlyDataRef.set(monthlyData);
    
    debugLog.info(operation, 'Monthly budget allocations created successfully', {
      budgetId,
      monthToUse,
      totalAllocated,
      categoryCount: Object.keys(allocations).length
    });

    return monthlyData;
  } catch (error) {
    debugLog.error(operation, 'Failed to seed monthly budget allocations', error);
    
    // Enhance error message based on common issues
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. User has editor/owner role in the budget');
      console.error('2. All required fields are present and valid');
      console.error('3. Budget and categories exist\n');
    }
    
    throw error;
  }
}

// Export all utility functions
export default {
  initializeFirebase,
  seedDefaultCategories,
  seedSampleTransactions,
  seedSampleRecurringRules,
  seedMonthlyBudgetAllocations,
  generateAmount,
  generateDate,
  generateDateInMonth,
  defaultCategories,
  sampleTransactions,
  amountRanges,
  recurringRuleTemplates
}; 