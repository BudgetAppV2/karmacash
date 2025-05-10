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
 *   --skip-allocations   Skip monthly budget allocation creation
 *   --target-month=<YYYY-MM> Generate transactions for a specific month (e.g., 2025-05)
 *   --recurring-instances-pct=<N> Percentage of transactions that should be recurring instances (default: 30)
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
import seedUtils from './lib/seedUtils.js';

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
    db = await seedUtils.initializeFirebase({ 
      debug: args.debug 
    });
    
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
      categoryIds = await seedUtils.seedDefaultCategories(db, budgetId, userData.id, args.debug);
      debugLog.info('main', 'Categories created', { count: categoryIds.length });
    } else {
      // If skipping category creation but need IDs for transactions, fetch existing ones
      const categoriesRef = db.collection(`budgets/${budgetId}/categories`);
      const categoriesSnapshot = await categoriesRef.get();
      categoryIds = categoriesSnapshot.docs.map(doc => doc.id);
      debugLog.info('main', 'Using existing categories', { count: categoryIds.length });
    }
    
    const categories = [];
    for (const categoryId of categoryIds) {
      const categoryDoc = await db.doc(`budgets/${budgetId}/categories/${categoryId}`).get();
      categories.push({
        id: categoryId,
        ...categoryDoc.data()
      });
    }
    
    // Create recurring rules if not skipped and we have categories
    let ruleIds = [];
    let rules = [];
    if (!args['skip-rules'] && categoryIds.length > 0) {
      ruleIds = await seedUtils.seedSampleRecurringRules(db, budgetId, userData.id, categories, args.debug);
      
      // Fetch the created rules if any were created
      if (ruleIds.length > 0) {
        const rulesRef = db.collection(`budgets/${budgetId}/recurringRules`);
        const rulesSnapshot = await Promise.all(
          ruleIds.map(id => rulesRef.doc(id).get())
        );
        rules = rulesSnapshot.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      debugLog.info('main', 'Recurring rules created', { count: ruleIds.length });
    }
    
    // Get the recurring instances percentage from CLI args (default to 30%)
    const recurringInstancesPercent = parseInt(args['recurring-instances-pct'] || '30', 10);
    
    // Create transactions if not skipped and we have categories
    let transactionIds = [];
    if (!args['skip-transactions'] && categoryIds.length > 0) {
      transactionIds = await seedUtils.seedSampleTransactions(db, budgetId, userData.id, categories, {
        count: 20,
        recurringRules: rules,
        recurringInstancesPercent,
        targetMonth: args['target-month'],
        debug: args.debug
      });
      debugLog.info('main', 'Transactions created', { 
        count: transactionIds.length,
        recurringInstancesPercent
      });
    }
    
    // Create monthly budget allocations if not skipped and we have categories
    let monthlyData = null;
    if (!args['skip-allocations'] && categoryIds.length > 0) {
      monthlyData = await seedUtils.seedMonthlyBudgetAllocations(
        db, 
        budgetId, 
        userData.id, 
        categories, 
        args['target-month'],
        args.debug
      );
      debugLog.info('main', 'Monthly budget allocations created', { 
        month: monthlyData.month,
        allocations: Object.keys(monthlyData.allocations).length
      });
    }
    
    debugLog.info('main', 'Seeding process completed successfully', {
      userId: userData.id,
      budgetId,
      categoryCount: categoryIds.length,
      transactionCount: transactionIds.length,
      recurringRuleCount: ruleIds.length,
      recurringInstancesPercent,
      monthlyAllocations: monthlyData ? true : false
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
  --skip-allocations      Skip monthly budget allocation creation
  --target-month=<YYYY-MM> Generate transactions for a specific month (e.g., 2025-05)
  --recurring-instances-pct=<N> Percentage of transactions that should be recurring instances (default: 30)
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