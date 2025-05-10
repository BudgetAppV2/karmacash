const functions = require('firebase-functions');
const admin = require('firebase-admin');
const logger = require('../../utils/logger');
const seedUtils = require('../../../scripts/lib/seedUtils');

/**
 * Helper function to safely get a Firestore timestamp
 * Falls back to new Date() when in emulator or if FieldValue is not available
 * @returns {Object|Date} Firestore ServerTimestamp or JavaScript Date
 */
const getFirestoreTimestamp = () => {
  if (admin.firestore && admin.firestore.FieldValue && admin.firestore.FieldValue.serverTimestamp) {
    return admin.firestore.FieldValue.serverTimestamp();
  }
  logger.warn('Falling back to new Date() for timestamp as serverTimestamp is unavailable (likely emulator).');
  return new Date(); // Fallback for emulator or if FieldValue is not available
};

/**
 * Callable function that triggers data seeding operations for admin purposes
 * This enables admins to generate test data from the UI rather than using command-line scripts
 */
exports.triggerAdminSeed = functions.https.onCall(async (data, context) => {
  // Set the operation name for consistent logging
  const operation = 'triggerAdminSeed';
  
  // Log initial data structure for debugging
  logger.info(`${operation} - DEBUG: Inspecting received data object properties...`);
  if (data && typeof data === 'object') {
    logger.info(`${operation} - DEBUG: Top level keys in data object:`, Object.keys(data));
    
    if (data.data && typeof data.data === 'object') {
      logger.info(`${operation} - DEBUG: Keys in data.data:`, Object.keys(data.data));
    }
  }

  // Extract client payload from nested data structure
  let clientPayload = {};
  if (data && data.data && typeof data.data.data === 'object' && data.data.data !== null) {
    clientPayload = data.data.data;
    logger.info(`${operation} - DEBUG: Successfully extracted innermost client payload from data.data.data.`);
  } else if (data && typeof data.data === 'object' && data.data !== null) {
    // Fallback if it's only one level of 'data' nesting (as previously thought for some scenarios)
    clientPayload = data.data;
    logger.warn(`${operation} - DEBUG: Extracted client payload from data.data (single nesting). This might be unexpected.`);
  } else {
    logger.error(`${operation} - DEBUG: Could not extract client payload from expected nested 'data' properties. Top-level data keys: ${data ? Object.keys(data) : 'null'}`);
  }

  // Log the extracted clientPayload for verification
  logger.info(`${operation} - DEBUG: Keys in extracted clientPayload:`, clientPayload ? Object.keys(clientPayload) : 'clientPayload is null/undefined or not an object');
  logger.info(`${operation} - DEBUG: Value of clientPayload.authToken:`, clientPayload.authToken);
  logger.info(`${operation} - DEBUG: Type of clientPayload.authToken:`, typeof clientPayload.authToken);
  logger.info(`${operation} - DEBUG: Value of clientPayload.targetMonth:`, clientPayload.targetMonth);
  logger.info(`${operation} - DEBUG: Value of clientPayload.recurringInstancesPct:`, clientPayload.recurringInstancesPct);
  logger.info(`${operation} - DEBUG: Value of clientPayload.seedDemoUser:`, clientPayload.seedDemoUser);
  
  // Log initial function call with the extracted client payload
  logger.info(`${operation} called with parameters`, { 
    hasAuth: !!context.auth,
    authTokenProvided: !!clientPayload.authToken,
    targetMonth: clientPayload.targetMonth,
    recurringInstancesPct: clientPayload.recurringInstancesPct,
    seedDemoUser: !!clientPayload.seedDemoUser
  });

  // AUTHENTICATION: Get user ID either from context.auth or verify token manually
  let uid = null;
  let authMethod = null;

  if (context.auth) {
    uid = context.auth.uid;
    authMethod = 'context.auth';
    logger.info(`${operation} authenticated via context.auth`, { uid });
  } 
  else if (clientPayload.authToken) {
    try {
      logger.info(`${operation} attempting manual token verification`);
      const decodedToken = await admin.auth().verifyIdToken(clientPayload.authToken);
      uid = decodedToken.uid;
      authMethod = 'manual token verification';
      logger.info(`${operation} manual token verification successful`, { uid });
    } catch (error) {
      logger.error(`${operation} manual token verification failed`, { 
        error: error.message, 
        code: error.code 
      });
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'The function must be called while authenticated.'
      );
    }
  } else {
    logger.error(`${operation} no authentication method available`);
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'The function must be called while authenticated.'
    );
  }

  // AUTHORIZATION: For initial version, we're using a simplified approach (Option B)
  // TODO: Replace this with proper admin role checking via custom claims 
  // before deploying to production.
  logger.info(`${operation} skipping explicit admin role check temporarily`, { 
    uid,
    reason: 'Initial development implementation' 
  });

  try {
    // Parameter validation and defaulting
    const params = validateAndDefaultParameters(clientPayload);
    
    // Determine which user to seed for
    const userIdToSeedFor = params.seedDemoUser 
      ? 'demo_user_123' // Hardcoded demo user ID (replace with actual demo user ID if needed)
      : uid;
    
    logger.info(`${operation} starting seeding process`, {
      authUserId: uid,
      targetUserId: userIdToSeedFor,
      authMethod,
      params
    });

    // Initialize Firebase Admin SDK for seeding
    const db = await seedUtils.initializeFirebase({ debug: false });
    
    // Create mock user data if needed (for display name, etc.)
    const userData = {
      id: userIdToSeedFor,
      displayName: `Test User (${userIdToSeedFor.substring(0, 6)})`,
      email: `${userIdToSeedFor}@example.com`
    };

    // Create or update the user document
    await createOrUpdateUser(db, userData.id, userData);
    
    // Create a new budget (or use existing if specified)
    let budgetId = clientPayload.budgetId;
    
    if (!budgetId) {
      // Create new budget using seedUtils or similar logic
      budgetId = await createBudgetWithOwner(db, userData.id, userData.displayName, userData.email);
      logger.info(`${operation} created new budget`, { budgetId });
    } else {
      // Verify access to existing budget
      await verifyBudgetAccess(db, budgetId, userData.id);
      logger.info(`${operation} using existing budget`, { budgetId });
    }
    
    // Get or create categories
    let categories = [];
    if (!params.skipCategories) {
      const categoryIds = await seedUtils.seedDefaultCategories(db, budgetId, userData.id, false);
      logger.info(`${operation} categories created`, { count: categoryIds.length });
      
      // Fetch the full category objects
      for (const categoryId of categoryIds) {
        const categoryDoc = await db.doc(`budgets/${budgetId}/categories/${categoryId}`).get();
        categories.push({
          id: categoryId,
          ...categoryDoc.data()
        });
      }
    } else {
      // Fetch existing categories if needed for other operations
      const categoriesSnapshot = await db.collection(`budgets/${budgetId}/categories`).get();
      categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      logger.info(`${operation} using existing categories`, { count: categories.length });
    }
    
    // Create recurring rules if needed
    let rules = [];
    if (!params.skipRules && categories.length > 0) {
      const ruleIds = await seedUtils.seedSampleRecurringRules(db, budgetId, userData.id, categories, false);
      
      if (ruleIds.length > 0) {
        // Fetch the full rule objects
        const rulesSnapshot = await Promise.all(
          ruleIds.map(id => db.doc(`budgets/${budgetId}/recurringRules/${id}`).get())
        );
        rules = rulesSnapshot.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      logger.info(`${operation} recurring rules created`, { count: ruleIds.length });
    }
    
    // Create transactions if needed
    let transactionIds = [];
    if (!params.skipTransactions && categories.length > 0) {
      transactionIds = await seedUtils.seedSampleTransactions(db, budgetId, userData.id, categories, {
        count: 20,
        recurringRules: rules,
        recurringInstancesPercent: params.recurringInstancesPct,
        targetMonth: params.targetMonth,
        debug: false
      });
      
      logger.info(`${operation} transactions created`, { 
        count: transactionIds.length,
        recurringInstancesPercent: params.recurringInstancesPct,
        targetMonth: params.targetMonth || 'default (last 60 days)'
      });
    }
    
    // Create monthly budget allocations if needed
    let monthlyData = null;
    if (!params.skipAllocations && categories.length > 0) {
      monthlyData = await seedUtils.seedMonthlyBudgetAllocations(
        db, 
        budgetId, 
        userData.id, 
        categories, 
        params.targetMonth,
        false
      );
      
      logger.info(`${operation} monthly budget allocations created`, { 
        month: monthlyData.month,
        allocations: Object.keys(monthlyData.allocations).length
      });
    }
    
    // Return success response
    return {
      success: true,
      message: `Seeding completed successfully for user ${userIdToSeedFor}${params.targetMonth ? ` for month ${params.targetMonth}` : ''}.`,
      details: {
        userId: userIdToSeedFor,
        budgetId,
        categoryCount: categories.length,
        transactionCount: transactionIds.length,
        ruleCount: rules.length,
        targetMonth: params.targetMonth || 'default (last 60 days)',
        monthlyAllocations: monthlyData ? true : false
      }
    };
  } catch (error) {
    // Log the error
    logger.error(`${operation} failed`, { 
      error: error.message, 
      code: error.code || 'unknown',
      stack: error.stack
    });
    
    // Determine appropriate error code for HttpsError
    const errorCode = getErrorCode(error);
    
    // Return formatted error
    throw new functions.https.HttpsError(
      errorCode,
      error.message || 'Failed to seed data',
      { originalError: error.message }
    );
  }
});

/**
 * Validate and set default values for function parameters
 * @param {Object} clientPayload - The client payload object (data.data)
 * @returns {Object} - The validated and defaulted parameters
 */
function validateAndDefaultParameters(clientPayload) {
  const params = {
    targetMonth: clientPayload.targetMonth || null,
    recurringInstancesPct: parseInt(clientPayload.recurringInstancesPct || '30', 10),
    skipCategories: !!clientPayload.skipCategories,
    skipTransactions: !!clientPayload.skipTransactions,
    skipRules: !!clientPayload.skipRules,
    skipAllocations: !!clientPayload.skipAllocations,
    seedDemoUser: !!clientPayload.seedDemoUser,
    budgetId: clientPayload.budgetId || null
  };
  
  // Validate targetMonth format if provided
  if (params.targetMonth && !/^\d{4}-\d{2}$/.test(params.targetMonth)) {
    throw new Error(`Invalid targetMonth format: ${params.targetMonth}. Expected format: YYYY-MM`);
  }
  
  // Validate recurringInstancesPct
  if (isNaN(params.recurringInstancesPct) || params.recurringInstancesPct < 0 || params.recurringInstancesPct > 100) {
    throw new Error('recurringInstancesPct must be a number between 0 and 100');
  }
  
  // Validate budgetId if provided
  if (params.budgetId && params.budgetId.length < 5) {
    throw new Error('Invalid budgetId: Must be at least 5 characters');
  }
  
  return params;
}

/**
 * Map error types to Firebase HttpsError codes
 * @param {Error} error - The original error
 * @returns {string} - The appropriate HttpsError code
 */
function getErrorCode(error) {
  // Map common error patterns to appropriate codes
  if (error.code === 'permission-denied' || error.message?.includes('permission')) {
    return 'permission-denied';
  }
  if (error.code === 'not-found' || error.message?.includes('not found')) {
    return 'not-found';
  }
  if (error.code === 'invalid-argument' || error.message?.includes('invalid')) {
    return 'invalid-argument';
  }
  
  // Default to internal error
  return 'internal';
}

/**
 * Creates or updates a user document
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - The user ID to create/update
 * @param {Object} userData - User data
 * @returns {Promise<void>}
 */
async function createOrUpdateUser(db, userId, userData) {
  const userDocRef = db.doc(`users/${userId}`);
  const userDoc = await userDocRef.get();
  
  if (userDoc.exists) {
    const existingData = userDoc.data();
    const updates = {};
    
    if (userData.displayName && userData.displayName !== existingData.displayName) {
      updates.displayName = userData.displayName;
    }
    if (userData.email && userData.email !== existingData.email) {
      updates.email = userData.email;
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = getFirestoreTimestamp();
      await userDocRef.update(updates);
    }
  } else {
    await userDocRef.set({
      email: userData.email || `${userId}@example.com`,
      displayName: userData.displayName || 'Test User',
      createdAt: getFirestoreTimestamp(),
      updatedAt: getFirestoreTimestamp(),
      settings: {
        currency: 'CAD',
        balanceDisplayMode: 'cumulative'
      }
    });
  }
}

/**
 * Creates a budget with the user as owner
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - The user ID who will own the budget
 * @param {string} userName - The user's display name
 * @param {string} userEmail - The user's email
 * @returns {Promise<string>} - The ID of the created budget
 */
async function createBudgetWithOwner(db, userId, userName, userEmail) {
  // Create batch operation
  const batch = db.batch();
  
  // Create budget document reference with auto-generated ID
  const budgetDocRef = db.collection('budgets').doc();
  const budgetId = budgetDocRef.id;
  
  // Get current timestamp
  const timestamp = getFirestoreTimestamp();
  
  // Default budget template
  const budgetData = {
    name: 'Test Budget',
    currency: 'CAD',
    ownerId: userId,
    members: {
      [userId]: {
        role: 'owner',
        displayName: userName || 'Test User',
        email: userEmail || `${userId}@example.com`,
        joinedAt: timestamp
      }
    },
    settings: {
      isArchived: false
    },
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  // 1. Set the budget document
  batch.set(budgetDocRef, budgetData);
  
  // 2. Create the budget membership document for the user
  const membershipRef = db.doc(`users/${userId}/budgetMemberships/${budgetId}`);
  batch.set(membershipRef, {
    budgetId,
    budgetName: budgetData.name,
    role: 'owner',
    ownerId: userId,
    currency: budgetData.currency,
    joinedAt: timestamp
  });
  
  // Commit batch
  await batch.commit();
  
  return budgetId;
}

/**
 * Verifies user has access to a budget
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} budgetId - The budget ID to check
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - Budget data if accessible
 */
async function verifyBudgetAccess(db, budgetId, userId) {
  const budgetDocRef = db.doc(`budgets/${budgetId}`);
  const budgetDoc = await budgetDocRef.get();
  
  if (!budgetDoc.exists) {
    throw new Error(`Budget with ID ${budgetId} not found`);
  }
  
  const budgetData = budgetDoc.data();
  
  if (!budgetData.members || !budgetData.members[userId]) {
    throw new Error(`User ${userId} does not have access to budget ${budgetId}`);
  }
  
  return {
    budgetId,
    budgetName: budgetData.name,
    userRole: budgetData.members[userId].role
  };
} 