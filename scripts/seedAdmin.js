/**
 * Firebase Admin SDK Seeding Script for KarmaCash
 * 
 * This script uses the Firebase Admin SDK to reliably populate the Firestore emulator
 * with test data conforming to the M4a budget-centric model.
 * 
 * Usage:
 *   node scripts/seedAdmin.js --userId=<uid> [options]
 * 
 * Required:
 *   --userId=<uid>        Firebase Auth User ID
 * 
 * Options:
 *   --budgetId=<id>      Target an existing budget (creates new if not provided)
 *   --displayName=<name>  User's display name (optional)
 *   --email=<email>      User's email address (optional)
 *   --list-budgets       List user's existing budgets and exit
 *   --skip-categories    Skip category creation
 *   --skip-transactions  Skip transaction creation
 *   --skip-rules         Skip recurring rule creation
 *   --target-month=<YYYY-MM> Generate transactions for a specific month (e.g., 2025-05)
 *   --debug             Enable verbose debug logging
 *   --help              Show this help message
 * 
 * Example:
 *   # Create new budget with all data
 *   node scripts/seedAdmin.js --userId=abc123 --displayName="John Doe"
 * 
 *   # Add transactions to existing budget
 *   node scripts/seedAdmin.js --userId=abc123 --budgetId=xyz789 --skip-categories --skip-rules
 * 
 *   # List user's budgets
 *   node scripts/seedAdmin.js --userId=abc123 --list-budgets
 *
 *   # Generate transactions for May 2025
 *   node scripts/seedAdmin.js --userId=abc123 --budgetId=xyz789 --target-month=2025-05 --skip-categories --skip-rules
 * 
 * Environment Variables:
 *   FIRESTORE_EMULATOR_HOST - Firestore emulator host (default: localhost:8085)
 *   FIREBASE_PROJECT_ID - Firebase project ID (default: karmacash-6e8f5)
 * 
 * Requirements:
 *   - Firebase Emulator must be running
 *   - Firebase Admin SDK credentials must be properly configured
 *   - Node.js v14+ recommended
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    if (value === undefined) {
      // Flag without value
      acc[key] = true;
    } else {
      acc[key] = value;
    }
  }
  return acc;
}, {});

// Debug logging wrapper with verbose mode
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
      if (args.debug) {
        console.error('  Stack:', error.stack);
      }
    }
  },
  debug: (operation, message, data = {}) => {
    if (args.debug) {
      console.debug(`[${operation}] DEBUG: ${message}`, data);
    }
  },
  verbose: (operation, message, data = {}) => {
    if (args.debug) {
      console.log(`[${operation}] VERBOSE: ${message}`, JSON.stringify(data, null, 2));
    }
  }
};

/**
 * Validates command line arguments
 * @returns {boolean} - True if arguments are valid
 */
function validateArgs() {
  const operation = 'validateArgs';
  try {
    if (args.help) {
      showHelp();
      return false;
    }

    if (!args.userId) {
      throw new Error('Missing required argument: --userId');
    }

    if (args.userId.length < 5) {
      throw new Error('Invalid userId: Must be at least 5 characters');
    }

    if (args.budgetId && args.budgetId.length < 5) {
      throw new Error('Invalid budgetId: Must be at least 5 characters');
    }

    debugLog.debug(operation, 'Arguments validated successfully', args);
    return true;
  } catch (error) {
    debugLog.error(operation, 'Argument validation failed', error);
    console.error('\nUsage: node scripts/seedAdmin.js --userId=<uid> [options]');
    console.error('Run with --help for more information\n');
    return false;
  }
}

/**
 * Tests Firestore emulator connectivity
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testConnection(db) {
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
 * Initialize Firebase Admin SDK with proper error handling
 * @returns {Promise<FirebaseFirestore.Firestore>}
 */
async function initializeFirebase() {
  const operation = 'initializeFirebase';
  try {
    // Get configuration from environment or use defaults
    const projectId = process.env.FIREBASE_PROJECT_ID || 'karmacash-6e8f5';
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8085';
    
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
    const isConnected = await testConnection(db);
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

// Export initialized db for other modules
let db;

/**
 * Creates or updates a user document
 * @param {string} userId - The user ID to create/update
 * @param {Object} userData - User data
 * @returns {Promise<void>}
 */
async function createOrUpdateUser(userId, userData) {
  const operation = 'createOrUpdateUser';
  try {
    debugLog.info(operation, 'Checking user document', { userId });
    
    const userDocRef = db.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      debugLog.info(operation, 'User document exists, updating if needed', { 
        userId,
        existing: userDoc.data()
      });
      
      // Only update if display name or email has changed
      const existingData = userDoc.data();
      const updates = {};
      
      if (userData.displayName && userData.displayName !== existingData.displayName) {
        updates.displayName = userData.displayName;
      }
      if (userData.email && userData.email !== existingData.email) {
        updates.email = userData.email;
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await userDocRef.update(updates);
        debugLog.info(operation, 'User document updated', { userId, updates });
      } else {
        debugLog.info(operation, 'No updates needed for user document', { userId });
      }
    } else {
      debugLog.info(operation, 'Creating new user document', { userId });
      
      await userDocRef.set({
        email: userData.email || `${userId}@example.com`,
        displayName: userData.displayName || 'Test User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        settings: {
          currency: 'CAD',
          balanceDisplayMode: 'cumulative'
        }
      });
      
      debugLog.info(operation, 'User document created successfully', { userId });
    }
  } catch (error) {
    debugLog.error(operation, 'Failed to create/update user', error);
    throw error;
  }
}

// Default budget template matching B5.2 schema
const defaultBudget = {
  name: 'Test Budget',
  currency: 'CAD',
  description: 'Test budget for development',
  version: 1
};

/**
 * Creates a budget and establishes user membership using Admin SDK batch operation
 * @param {string} userId - The user ID who will own the budget
 * @param {string} userName - The user's display name
 * @param {string} userEmail - The user's email
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.budgetName] - Custom budget name (defaults to 'Test Budget')
 * @param {string} [options.currency] - Custom currency code (defaults to 'CAD')
 * @returns {Promise<string>} - The ID of the created budget
 */
async function createBudgetWithOwner(userId, userName, userEmail, options = {}) {
  const operation = 'createBudgetWithOwner';
  try {
    debugLog.info(operation, 'Starting budget creation process', { 
      userId, 
      userName,
      options 
    });

    // Create batch operation
    const batch = db.batch();
    
    // Create budget document reference with auto-generated ID
    const budgetDocRef = db.collection('budgets').doc();
    const budgetId = budgetDocRef.id;
    
    // Get current timestamp
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Prepare budget document data
    const budgetData = {
      ...defaultBudget,
      name: options.budgetName || defaultBudget.name,
      currency: options.currency || defaultBudget.currency,
      ownerId: userId,
      members: {
        [userId]: {
          role: 'owner',
          displayName: userName,
          email: userEmail,
          joinedAt: timestamp
        }
      },
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Log budget data for validation
    debugLog.debug(operation, 'Budget document data', {
      budgetId,
      budgetData: {
        ...budgetData,
        createdAt: 'serverTimestamp()',
        updatedAt: 'serverTimestamp()',
        'members[userId].joinedAt': 'serverTimestamp()'
      },
      validation: {
        hasName: typeof budgetData.name === 'string' && budgetData.name.length > 0,
        nameLength: budgetData.name.length <= 100,
        hasOwnerId: typeof budgetData.ownerId === 'string',
        hasMembers: budgetData.members instanceof Object,
        hasCurrency: typeof budgetData.currency === 'string',
        hasVersion: typeof budgetData.version === 'number',
        memberHasRole: budgetData.members[userId]?.role === 'owner',
        memberHasDisplayName: typeof budgetData.members[userId]?.displayName === 'string',
        memberHasEmail: typeof budgetData.members[userId]?.email === 'string'
      }
    });

    // Add budget document to batch
    batch.set(budgetDocRef, budgetData);

    // Create budget membership document
    const membershipDocRef = db.doc(`users/${userId}/budgetMemberships/${budgetId}`);
    const membershipData = {
      budgetId,
      role: 'owner',
      ownerId: userId,
      budgetName: budgetData.name,
      currency: budgetData.currency,
      joinedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Log membership data for validation
    debugLog.debug(operation, 'Membership document data', {
      userId,
      budgetId,
      membershipData: {
        ...membershipData,
        joinedAt: 'serverTimestamp()',
        createdAt: 'serverTimestamp()',
        updatedAt: 'serverTimestamp()'
      },
      validation: {
        hasRole: membershipData.role === 'owner',
        budgetIdMatches: membershipData.budgetId === budgetId,
        ownerIdMatches: membershipData.ownerId === userId,
        hasBudgetName: typeof membershipData.budgetName === 'string' && membershipData.budgetName.length > 0,
        hasCurrency: typeof membershipData.currency === 'string'
      }
    });

    // Add membership document to batch
    batch.set(membershipDocRef, membershipData);

    // Commit the batch
    debugLog.info(operation, 'Committing batch write');
    await batch.commit();
    
    debugLog.info(operation, 'Budget creation successful', {
      budgetId,
      userId,
      name: budgetData.name
    });

    return budgetId;
  } catch (error) {
    debugLog.error(operation, 'Failed to create budget', error);
    
    // Enhance error message based on common issues
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. Firestore security rules allow budget creation');
      console.error('2. All required fields are present and valid');
      console.error('3. User document exists\n');
    }
    
    throw error;
  }
}

// Default categories array (Based on Bible [B3.1], [B3.6])
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

/**
 * Seeds default categories for a budget
 * @param {string} budgetId - The budget ID to create categories for
 * @param {string} userId - The user ID creating the categories
 * @returns {Promise<string[]>} - Array of created category IDs
 */
async function seedDefaultCategories(budgetId, userId) {
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
        });
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

// Sample transaction descriptions for more realistic data
const sampleTransactions = {
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
const amountRanges = {
  'Épicerie': { min: 25, max: 250 },
  'Transport': { min: 15, max: 150 },
  'Resto': { min: 15, max: 100 },
  'Santé': { min: 20, max: 200 },
  'Loisirs': { min: 10, max: 150 },
  'Logement': { min: 500, max: 2000 },
  'Salaire': { min: 1500, max: 4000 },
  'Remboursements': { min: 50, max: 500 }
};

/**
 * Generate a random amount within a realistic range for the category
 * @param {string} categoryName - The name of the category
 * @param {string} type - Transaction type ('expense' or 'income')
 * @returns {number} - The generated amount
 */
function generateAmount(categoryName, type) {
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
function generateDate(daysBack, rangeDays) {
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
function generateDateInMonth(yearMonthString) {
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
    });
    
    return date;
  } catch (error) {
    debugLog.error(operation, 'Error generating date in month', error);
    throw error;
  }
}

/**
 * Seeds sample transactions for a budget
 * @param {string} budgetId - The budget ID
 * @param {string} userId - The user ID creating the transactions
 * @param {Object[]} categories - Array of category objects with their IDs and details
 * @param {number} [count=15] - Number of transactions to create
 * @returns {Promise<string[]>} - Array of created transaction IDs
 */
async function seedSampleTransactions(budgetId, userId, categories, count = 15) {
  const operation = 'seedSampleTransactions';
  try {
    debugLog.info(operation, 'Starting transaction seeding process', { 
      budgetId, 
      userId,
      categoryCount: categories.length,
      targetCount: count,
      targetMonth: args['target-month'] || 'default (last 60 days)'
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
    });

    // Create transactions
    for (let i = 0; i < count; i++) {
      // Determine transaction type (70% expenses, 30% income)
      const isExpense = Math.random() < 0.7;
      const categoryPool = isExpense ? expenseCategories : incomeCategories;
      const category = categoryPool[Math.floor(Math.random() * categoryPool.length)];

      // Generate transaction date based on command-line argument
      const date = args['target-month']
        ? generateDateInMonth(args['target-month']) // Generate date in specific month
        : generateDate(0, 60);                      // Spread across last 60 days (default)
        
      const descriptions = sampleTransactions[category.type][category.name] || ['Transaction'];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const amount = generateAmount(category.name, category.type);

      // Create document reference
      const transactionDocRef = transactionsRef.doc();
      const transactionId = transactionDocRef.id;
      transactionIds.push(transactionId);

      const transactionData = {
        budgetId,
        categoryId: category.id,
        type: category.type,
        amount,
        description,
        date: admin.firestore.Timestamp.fromDate(date),
        isRecurringInstance: false,
        recurringRuleId: null,
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
            hasCreatedByUserId: transactionData.createdByUserId === userId
          }
        });
      }

      batch.set(transactionDocRef, transactionData);
    }

    // Commit the batch
    debugLog.info(operation, 'Committing transactions batch');
    await batch.commit();

    // Log success with statistics
    const expenseCount = transactionIds.length * 0.7;
    const incomeCount = transactionIds.length * 0.3;
    
    debugLog.info(operation, 'Transactions created successfully', {
      budgetId,
      totalCount: transactionIds.length,
      expenseCount: Math.round(expenseCount),
      incomeCount: Math.round(incomeCount),
      targetMonth: args['target-month'] || 'default (last 60 days)'
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

// Sample recurring rules templates
const recurringRuleTemplates = [
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
 * Seeds sample recurring rules for a budget
 * @param {string} budgetId - The budget ID
 * @param {string} userId - The user ID creating the rules
 * @param {Object[]} categories - Array of category objects with their IDs and details
 * @returns {Promise<string[]>} - Array of created rule IDs
 */
async function seedSampleRecurringRules(budgetId, userId, categories) {
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
        });
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
 * Lists all budgets for a user
 * @param {string} userId - The user ID to list budgets for
 * @returns {Promise<Array>} - Array of budget objects
 */
async function listUserBudgets(userId) {
  const operation = 'listUserBudgets';
  try {
    debugLog.info(operation, 'Fetching user budgets', { userId });
    
    const membershipsRef = db.collection('users').doc(userId).collection('budgetMemberships');
    const membershipsSnapshot = await membershipsRef.get();
    
    const budgets = membershipsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (budgets.length === 0) {
      console.log('\nNo budgets found for user.');
    } else {
      console.log('\nUser Budgets:');
      budgets.forEach(budget => {
        console.log(`- ${budget.budgetName} (${budget.id})`);
        console.log(`  Role: ${budget.role}, Currency: ${budget.currency}`);
        console.log(`  Joined: ${budget.joinedAt?.toDate().toLocaleString() || 'N/A'}`);
      });
    }
    
    return budgets;
  } catch (error) {
    debugLog.error(operation, 'Failed to list budgets', error);
    throw error;
  }
}

/**
 * Verifies that a budget exists and belongs to the user
 * @param {string} budgetId - The budget ID to verify
 * @param {string} userId - The user ID to check ownership for
 * @returns {Promise<Object>} - The budget data if valid
 */
async function verifyBudgetAccess(budgetId, userId) {
  const operation = 'verifyBudgetAccess';
  try {
    debugLog.info(operation, 'Verifying budget access', { budgetId, userId });
    
    const membershipRef = db.collection('users').doc(userId).collection('budgetMemberships').doc(budgetId);
    const membership = await membershipRef.get();
    
    if (!membership.exists) {
      throw new Error(`Budget ${budgetId} not found or user does not have access`);
    }
    
    const membershipData = membership.data();
    debugLog.info(operation, 'Budget access verified', {
      budgetId,
      userId,
      role: membershipData.role
    });
    
    return membershipData;
  } catch (error) {
    debugLog.error(operation, 'Budget access verification failed', error);
    throw error;
  }
}

/**
 * Main seeding function that orchestrates the entire process
 */
async function main() {
  const operation = 'main';
  try {
    debugLog.info(operation, 'Starting seeding process', { args });
    
    // Validate arguments
    if (!validateArgs()) {
      process.exit(1);
    }
    
    // Initialize Firebase Admin SDK
    db = await initializeFirebase();
    
    // Handle --list-budgets flag
    if (args['list-budgets']) {
      await listUserBudgets(args.userId);
      process.exit(0);
    }
    
    // Create or update user document
    const userData = {
      id: args.userId,
      email: args.email,
      displayName: args.displayName
    };
    
    await createOrUpdateUser(userData.id, userData);
    
    // Handle existing or new budget
    let budgetId;
    if (args.budgetId) {
      // Verify access to existing budget
      const budgetData = await verifyBudgetAccess(args.budgetId, userData.id);
      budgetId = args.budgetId;
      debugLog.info('main', 'Using existing budget', {
        budgetId,
        budgetName: budgetData.budgetName
      });
    } else {
      // Create new budget
      budgetId = await createBudgetWithOwner(
        userData.id,
        userData.displayName || 'Test User',
        userData.email || `${userData.id}@example.com`,
        { budgetName: 'Test Budget', currency: 'CAD' }
      );
      debugLog.info('main', 'Created new budget', { budgetId });
    }
    
    // Get full category objects for transaction seeding
    let categoryIds = [];
    if (!args['skip-categories']) {
      categoryIds = await seedDefaultCategories(budgetId, userData.id);
      debugLog.info('main', 'Categories created', { count: categoryIds.length });
    } else {
      // If skipping category creation but need IDs for transactions, fetch existing ones
      const categoriesRef = db.collection(`budgets/${budgetId}/categories`);
      const categoriesSnapshot = await categoriesRef.get();
      categoryIds = categoriesSnapshot.docs.map(doc => doc.id);
      debugLog.info('main', 'Using existing categories', { count: categoryIds.length });
    }
    
    const categories = defaultCategories.map((cat, index) => ({
      ...cat,
      id: categoryIds[index]
    }));
    
    // Create transactions if not skipped and we have categories
    let transactionIds = [];
    if (!args['skip-transactions'] && categoryIds.length > 0) {
      transactionIds = await seedSampleTransactions(budgetId, userData.id, categories, 20);
      debugLog.info('main', 'Transactions created', { count: transactionIds.length });
    }
    
    // Create recurring rules if not skipped and we have categories
    let ruleIds = [];
    if (!args['skip-rules'] && categoryIds.length > 0) {
      ruleIds = await seedSampleRecurringRules(budgetId, userData.id, categories);
      debugLog.info('main', 'Recurring rules created', { count: ruleIds.length });
    }
    
    debugLog.info('main', 'Seeding process completed successfully', {
      userId: userData.id,
      budgetId,
      categoryCount: categoryIds.length,
      transactionCount: transactionIds.length,
      recurringRuleCount: ruleIds.length
    });
    
    process.exit(0);
  } catch (error) {
    debugLog.error(operation, 'Seeding process failed', error);
    
    // Enhanced error reporting
    if (error.code === 'permission-denied') {
      console.error('\nPermission denied. Please check:');
      console.error('1. Firestore security rules');
      console.error('2. User document exists');
      console.error('3. Budget access permissions\n');
    } else if (error.code === 'not-found') {
      console.error('\nResource not found. Please check:');
      console.error('1. User ID exists');
      console.error('2. Budget ID exists (if specified)');
      console.error('3. Collection paths are correct\n');
    }
    
    process.exit(1);
  }
}

// Run the script if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  // Handle uncaught errors
  process.on('unhandledRejection', (error) => {
    debugLog.error('unhandledRejection', 'An unhandled promise rejection occurred', error);
    process.exit(1);
  });
  
  process.on('uncaughtException', (error) => {
    debugLog.error('uncaughtException', 'An uncaught exception occurred', error);
    process.exit(1);
  });
  
  main().catch(error => {
    debugLog.error('fatal', 'A fatal error occurred', error);
    process.exit(1);
  });
}

/**
 * Displays help information about this script
 */
function showHelp() {
  console.log(`
Firebase Admin SDK Seeding Script for KarmaCash
===============================================

Usage:
  node scripts/seedAdmin.js --userId=<uid> [options]

Required:
  --userId=<uid>          Firebase Auth User ID

Options:
  --budgetId=<id>         Target an existing budget (creates new if not provided)
  --displayName=<name>    User's display name (optional)
  --email=<email>         User's email address (optional)
  --list-budgets          List user's existing budgets and exit
  --skip-categories       Skip category creation
  --skip-transactions     Skip transaction creation
  --skip-rules            Skip recurring rule creation
  --target-month=<YYYY-MM> Generate transactions for a specific month (e.g., 2025-05)
  --debug                 Enable verbose debug logging
  --help                  Show this help message

Examples:
  # Create new budget with all data
  node scripts/seedAdmin.js --userId=abc123 --displayName="John Doe"

  # Add transactions to existing budget
  node scripts/seedAdmin.js --userId=abc123 --budgetId=xyz789 --skip-categories --skip-rules

  # Generate transactions for May 2025
  node scripts/seedAdmin.js --userId=abc123 --budgetId=xyz789 --target-month=2025-05 --skip-categories --skip-rules
  `);
} 