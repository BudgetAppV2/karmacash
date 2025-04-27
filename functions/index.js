const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firestore = require('@google-cloud/firestore');
const logger = require('./utils/logger');
const { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  isBefore, 
  isSameDay,
  isAfter,
  startOfDay, 
  endOfDay,
  subMonths,
  format,
  isLastDayOfMonth,
  getDaysInMonth,
  getDate,
  getDay,
  getMonth,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  differenceInDays
} = require('date-fns');
const { OAuth2Client } = require('google-auth-library');

// This creates direct references to the Firestore classes
const FirestoreTimestamp = firestore.Timestamp;
const FirestoreFieldValue = firestore.FieldValue;

admin.initializeApp();

/* Commented out for compatibility with current Firebase Functions version
// Process recurring transactions - runs daily
exports.processRecurringTransactions = functions.pubsub
  .schedule('0 0 * * *')  // Run daily at midnight
  .timeZone('America/Toronto')
  .onRun(async (context) => {
    try {
      logger.info('processRecurringTransactions', 'Starting recurring transaction processing');
      
      // Get current date at start of day (to avoid time comparison issues)
      const today = startOfDay(new Date());
      logger.info('processRecurringTransactions', 'Processing date', { today: today.toISOString() });
      
      // Calculate retroactive limit (3 months back) and future window (1 year ahead)
      const retroactiveLimit = subMonths(today, 3);
      const futureWindow = addYears(today, 1);
      
      logger.info('processRecurringTransactions', 'Time window', { 
        retroactiveLimit: retroactiveLimit.toISOString(),
        futureWindow: futureWindow.toISOString()
      });
      
      // Get all active recurring rules
      const rulesSnapshot = await admin.firestore()
        .collectionGroup('recurringRules')
        .where('isActive', '==', true)
        .get();
      
      if (rulesSnapshot.empty) {
        logger.info('processRecurringTransactions', 'No active recurring rules found');
        return null;
      }
      
      logger.info('processRecurringTransactions', 'Found active rules', { 
        count: rulesSnapshot.size 
      });
      
      // Process each rule
      let successCount = 0;
      let errorCount = 0;
      
      for (const ruleDoc of rulesSnapshot.docs) {
        try {
          const rule = ruleDoc.data();
          const userId = rule.userId;
          const ruleId = ruleDoc.id;
          
          // Skip rules that don't have required fields
          if (!rule.userId || !rule.amount || !rule.categoryId || !rule.frequency || !rule.startDate) {
            logger.warn('processRecurringTransactions', 'Skipping rule with missing required fields', {
              ruleId,
              userId
            });
            continue;
          }
          
          // Convert Firestore timestamps to JS dates for processing
          const ruleStartDate = rule.startDate.toDate();
          const ruleNextDate = rule.nextDate ? rule.nextDate.toDate() : ruleStartDate;
          const ruleEndDate = rule.endDate ? rule.endDate.toDate() : null;
          
          // Skip if the rule has an end date in the past
          if (ruleEndDate && isBefore(ruleEndDate, today)) {
            logger.info('processRecurringTransactions', 'Rule end date is in the past, deactivating', {
              ruleId,
              userId,
              endDate: format(ruleEndDate, 'yyyy-MM-dd')
            });
            
            // Deactivate the rule since it's ended
            await admin.firestore()
              .collection('users')
              .doc(userId)
              .collection('recurringRules')
              .doc(ruleId)
              .update({
                isActive: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              
            continue;
          }
          
          // Get all future transactions from this rule that we'll replace
          const futureTransactionsSnapshot = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('recurringRuleId', '==', ruleId)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
            .get();
          
          // Generate new transactions batch operations
          const batches = [];
          let currentBatch = admin.firestore().batch();
          let operationCount = 0;
          const MAX_BATCH_OPERATIONS = 490; // Keep under Firestore's 500 limit with some buffer
          
          // First, handle deleting future transactions (add to batch)
          futureTransactionsSnapshot.docs.forEach(transDoc => {
            const transRef = admin.firestore()
              .collection('users')
              .doc(userId)
              .collection('transactions')
              .doc(transDoc.id);
              
            currentBatch.delete(transRef);
            operationCount++;
            
            // If we're approaching the batch limit, commit and create a new batch
            if (operationCount >= MAX_BATCH_OPERATIONS) {
              batches.push(currentBatch);
              currentBatch = admin.firestore().batch();
              operationCount = 0;
            }
          });
          
          logger.info('processRecurringTransactions', 'Deleted future transactions', {
            ruleId,
            userId,
            count: futureTransactionsSnapshot.size
          });
          
          // Generate new transactions within the future window
          let currentDate = calculateFirstOccurrence(rule, today);
          const generatedTransactions = [];
          
          // Generate transactions until we reach the future window or end date
          while (
            isBefore(currentDate, futureWindow) && 
            (!ruleEndDate || isBefore(currentDate, ruleEndDate) || isSameDay(currentDate, ruleEndDate))
          ) {
            const transactionData = {
              userId: userId,
              amount: rule.amount,
              categoryId: rule.categoryId,
              categoryName: rule.categoryName || '',
              categoryColor: rule.categoryColor || '',
              description: rule.name || 'Recurring Transaction',
              date: admin.firestore.Timestamp.fromDate(currentDate),
              notes: rule.notes || '',
              isRecurringInstance: true,
              recurringRuleId: ruleId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const transactionRef = admin.firestore()
              .collection('users')
              .doc(userId)
              .collection('transactions')
              .doc();
              
            currentBatch.set(transactionRef, transactionData);
            operationCount++;
            
            generatedTransactions.push({
              id: transactionRef.id,
              date: currentDate.toISOString()
            });
            
            // Move to next date based on frequency
            currentDate = calculateNextDate(rule, currentDate);
            
            // Check if we've hit the batch limit
            if (operationCount >= MAX_BATCH_OPERATIONS) {
              batches.push(currentBatch);
              currentBatch = admin.firestore().batch();
              operationCount = 0;
            }
          }
          
          // Update the rule's nextDate to the next occurrence
          const nextOccurrence = generatedTransactions.length > 0 
            ? new Date(generatedTransactions[0].date)
            : calculateNextDate(rule, ruleNextDate);
            
          const ruleRef = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('recurringRules')
            .doc(ruleId);
            
          currentBatch.update(ruleRef, {
            nextDate: admin.firestore.Timestamp.fromDate(nextOccurrence),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          operationCount++;
          
          // Add the final batch if it has operations
          if (operationCount > 0) {
            batches.push(currentBatch);
          }
          
          // Commit all batches sequentially
          for (const batch of batches) {
            await batch.commit();
          }
          
          logger.info('processRecurringTransactions', 'Successfully processed rule', {
            ruleId,
            userId,
            transactionsGenerated: generatedTransactions.length,
            nextOccurrence: nextOccurrence.toISOString()
          });
          
          successCount++;
        } catch (ruleError) {
          // Log error but continue processing other rules
          errorCount++;
          logger.error('processRecurringTransactions', 'Error processing individual rule', {
            ruleId: ruleDoc.id,
            userId: ruleDoc.data().userId,
            error: ruleError.message,
            stack: ruleError.stack
          });
        }
      }
      
      logger.info('processRecurringTransactions', 'Completed processing recurring rules', {
        totalRules: rulesSnapshot.size,
        successCount,
        errorCount
      });
      
      return null;
    } catch (error) {
      logger.error('processRecurringTransactions', 'Critical error processing recurring transactions', {
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  });
*/

/**
 * Calculate the first occurrence date for a rule, ensuring it's not before today
 * @param {Object} rule - The recurring rule
 * @param {Date} today - The current date
 * @returns {Date} - The first occurrence date
 */
function calculateFirstOccurrence(rule, today) {
  // Monkey patch for field consistency
  if (!rule.startDate && rule.fromDate) {
    console.log("Monkey patch: Adding startDate getter in calculateFirstOccurrence");
    Object.defineProperty(rule, 'startDate', {
      get: function() { 
        console.log("Accessing fallback for startDate in calculateFirstOccurrence");
        return this.fromDate; 
      }
    });
  }
  
  if (!rule.fromDate && rule.startDate) {
    console.log("Monkey patch: Adding fromDate getter in calculateFirstOccurrence");
    Object.defineProperty(rule, 'fromDate', {
      get: function() { 
        console.log("Accessing fallback for fromDate in calculateFirstOccurrence");
        return this.startDate; 
      }
    });
  }
  
  // Normalize date fields with fallbacks
  const startDateField = rule.startDate || rule.fromDate;
  const nextDateField = rule.nextDate;
  
  // Convert Firestore timestamps to JS dates with defensive coding
  const startDate = startDateField ? startDateField.toDate() : new Date();
  const nextDate = nextDateField ? nextDateField.toDate() : startDate;
  
  // If the next occurrence date is today or in the future, use it
  if (isSameDay(nextDate, today) || isAfter(nextDate, today)) {
    return nextDate;
  }
  
  // If the next occurrence is in the past, calculate the next valid occurrence
  let currentDate = nextDate;
  while (isBefore(currentDate, today) && !isSameDay(currentDate, today)) {
    currentDate = calculateNextDate(rule, currentDate);
  }
  
  return currentDate;
}

/**
 * Calculate the next occurrence date based on frequency
 * @param {Object} rule - The recurring rule
 * @param {Date} currentDate - The current occurrence date
 * @returns {Date} - The next occurrence date
 */
function calculateNextDate(rule, currentDate) {
  const frequency = rule.frequency;
  const interval = rule.interval || 1;
  
  // Clone the date to avoid modifying the original
  let nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;
      
    case 'weekly':
      nextDate = addWeeks(nextDate, interval);
      break;
      
    case 'biweekly':
      nextDate = addWeeks(nextDate, 2 * interval);
      break;
      
    case 'monthly':
      // Handle special cases for month-end dates
      if (isLastDayOfMonth(currentDate)) {
        // If it's the last day of the month, keep it as the last day
        nextDate = addMonths(nextDate, interval);
        const daysInNextMonth = getDaysInMonth(nextDate);
        nextDate.setDate(daysInNextMonth);
      } else {
        // Regular case - try to maintain the same day of month
        nextDate = addMonths(nextDate, interval);
        
        // Handle cases where the day doesn't exist in the target month
        const targetDay = getDate(currentDate);
        const daysInMonth = getDaysInMonth(nextDate);
        
        if (targetDay > daysInMonth) {
          // If the target day doesn't exist in this month, use the last day
          nextDate.setDate(daysInMonth);
        }
      }
      break;
      
    case 'quarterly':
      // Handle special cases for quarter-end dates
      if (isLastDayOfMonth(currentDate)) {
        // If it's the last day of the month, keep it as the last day
        nextDate = addMonths(nextDate, 3 * interval);
        const daysInNextMonth = getDaysInMonth(nextDate);
        nextDate.setDate(daysInNextMonth);
      } else {
        // Regular case - try to maintain the same day of month
        nextDate = addMonths(nextDate, 3 * interval);
        
        // Handle cases where the day doesn't exist in the target month
        const targetDay = getDate(currentDate);
        const daysInMonth = getDaysInMonth(nextDate);
        
        if (targetDay > daysInMonth) {
          // If the target day doesn't exist in this month, use the last day
          nextDate.setDate(daysInMonth);
        }
      }
      break;
      
    case 'yearly':
      nextDate = addYears(nextDate, interval);
      
      // Handle February 29 in leap years
      if (getDate(currentDate) === 29 && nextDate.getMonth() === 1) {
        const daysInMonth = getDaysInMonth(nextDate);
        nextDate.setDate(daysInMonth);
      }
      break;
      
    default:
      // Default to monthly if frequency is unknown
      nextDate = addMonths(nextDate, interval);
  }
  
  return startOfDay(nextDate);
}

/**
 * HTTP-triggered Cloud Function that generates recurring transactions for all users
 * Implementation of algorithm described in [B5.5.8]
 * 
 * To be triggered by Google Cloud Scheduler with OIDC token authentication
 */
exports.generateRecurringTransactionsHTTP = functions.https.onRequest(async (req, res) => {
  try {
    logger.info('Received request to generate recurring transactions');

    // Verify Firebase ID token
    logger.debug('Verifying token');
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      logger.error('No ID token provided');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
      await admin.auth().verifyIdToken(idToken);
      logger.info('Token verification successful');
    } catch (error) {
      logger.error('Token verification failed', error);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.info('Starting recurring transaction generation (authenticated)');

    // Date range processing
    logger.info('Processing date range');
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setDate(end.getDate() + 7); // Default to 7 days ahead if no end date

    // Test Firestore connection
    logger.info('Testing Firestore connection...');
    const userTest = await admin.firestore().collection('users').limit(1).get();
    logger.info(`Firestore connection test: Found ${userTest.docs.length} documents in 'users' collection`);

    // Fetch active recurring rules
    logger.info('Fetching active recurring rules...');
    const rules = await admin.firestore()
      .collectionGroup('recurringRules')
      .where('isActive', '==', true)
      .get();

    let totalInstances = 0;

    logger.info(`Processing ${rules.docs.length} active recurring rules`);
    
    // Process each rule
    for (const ruleDoc of rules.docs) {
      const ruleId = ruleDoc.id;
      const rule = ruleDoc.data();
      
      try {
        logger.info(`Processing rule ${ruleId} for user ${rule.userId}`);
        
        // Generate instances for this rule
        const instances = await generateInstancesForRule(ruleId, rule, start, end);
        totalInstances += instances.length;
        
        logger.info(`Generated ${instances.length} instances for rule ${ruleId}`);
      } catch (error) {
        logger.error(`Error processing rule ${ruleId}`, error);
      }
    }

    logger.info(`Recurring transaction generation completed: ${totalInstances} instances created`);
    res.status(200).json({ 
      success: true, 
      message: `Generated ${totalInstances} recurring transactions` 
    });
  } catch (error) {
    logger.error('Error generating recurring transactions', error);
    res.status(500).json({ error: 'Failed to generate recurring transactions' });
  }
});

// Helper function to generate instances for a single rule
async function generateInstancesForRule(ruleId, rule, startDate, endDate) {
  console.log('Generating instances for rule', ruleId, {
    ruleProperties: Object.keys(rule),
    startDate: startDate.toISOString(),
    endDate: endDate ? endDate.toISOString() : 'null'
  });
  
  // MONKEY PATCH: Add fallback getters for missing fields
  if (!rule.fromDate && rule.startDate) {
    console.log("Adding fallback getter for fromDate in generateInstancesForRule");
    Object.defineProperty(rule, 'fromDate', {
      get: function() { 
        console.log("Accessing fallback for fromDate in generateInstancesForRule");
        return this.startDate; 
      }
    });
  }
  
  if (!rule.toDate && rule.endDate) {
    console.log("Adding fallback getter for toDate in generateInstancesForRule");
    Object.defineProperty(rule, 'toDate', {
      get: function() { 
        console.log("Accessing fallback for toDate in generateInstancesForRule");
        return this.endDate; 
      }
    });
  }
  
  if (!rule.startDate && rule.fromDate) {
    console.log("Adding fallback getter for startDate in generateInstancesForRule");
    Object.defineProperty(rule, 'startDate', {
      get: function() { 
        console.log("Accessing fallback for startDate in generateInstancesForRule");
        return this.fromDate; 
      }
    });
  }
  
  if (!rule.endDate && rule.toDate) {
    console.log("Adding fallback getter for endDate in generateInstancesForRule");
    Object.defineProperty(rule, 'endDate', {
      get: function() { 
        console.log("Accessing fallback for endDate in generateInstancesForRule");
        return this.toDate; 
      }
    });
  }
  
  // Generate instances based on frequency
  const instances = [];
  
  // Find the last instance of this rule before the start date
  const lastInstance = await admin.firestore()
    .collection('transactions')
    .where('recurringRuleId', '==', ruleId)
    .where('date', '<', startDate)
    .orderBy('date', 'desc')
    .limit(1)
    .get();
  
  // Calculate the generation date range
  let currentDate = new Date(startDate);
  let queryStartDate = new Date(startDate);
  
  if (lastInstance.docs.length > 0) {
    const lastDate = lastInstance.docs[0].data().date.toDate();
    queryStartDate = new Date(lastDate);
    
    // Advance to next occurrence from the last instance
    if (rule.frequency === 'daily') {
      queryStartDate.setDate(queryStartDate.getDate() + 1);
    } else if (rule.frequency === 'weekly') {
      queryStartDate.setDate(queryStartDate.getDate() + 7);
    } else if (rule.frequency === 'biweekly') {
      queryStartDate.setDate(queryStartDate.getDate() + 14);
    } else if (rule.frequency === 'monthly') {
      queryStartDate.setMonth(queryStartDate.getMonth() + 1);
    } else if (rule.frequency === 'yearly') {
      queryStartDate.setFullYear(queryStartDate.getFullYear() + 1);
    }
    
    // If the calculated query start date is after our start window, use it
    if (queryStartDate > currentDate) {
      currentDate = new Date(queryStartDate);
    }
  }
  
  // Generate transactions based on rule frequency
  while (currentDate <= endDate) {
    // Check if we should generate a transaction on this date
    let shouldGenerate = true;
    
    // Add more logic here for validating dates based on rule
    
    if (shouldGenerate) {
      console.log(`✅ Generating instance for date (UTC): ${currentDate.toISOString()}`);
      
      // Create a transaction instance object
      const instance = {
        userId: rule.userId,
        categoryId: rule.categoryId,
        date: FirestoreTimestamp.fromDate(currentDate),
        description: rule.name || 'Recurring Transaction',
        // Fix amount sign for expenses
        amount: (rule.categoryType === 'expense' || rule.type === 'expense') ? -Math.abs(rule.amount) : Math.abs(rule.amount),
        isRecurringInstance: true,
        recurringRuleId: ruleId,
        createdAt: FirestoreFieldValue.serverTimestamp(),
        updatedAt: FirestoreFieldValue.serverTimestamp()
      };
      
      // Add optional fields if they exist in the rule
      if (rule.categoryName) instance.categoryName = rule.categoryName;
      if (rule.categoryColor) instance.categoryColor = rule.categoryColor;
      if (rule.categoryType) instance.categoryType = rule.categoryType;
      if (rule.notes) instance.notes = rule.notes;
      
      // Add to instances array
      instances.push(instance);
    }
    
    // Move to next occurrence based on frequency
    if (rule.frequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (rule.frequency === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (rule.frequency === 'biweekly') {
      currentDate.setDate(currentDate.getDate() + 14);
    } else if (rule.frequency === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (rule.frequency === 'yearly') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }
  
  // Batch commit all instances for this rule
  if (instances.length > 0) {
    const batch = admin.firestore().batch();
    
    instances.forEach(instance => {
      const docRef = admin.firestore().collection('transactions').doc();
      batch.set(docRef, instance);
    });
    
    await batch.commit();
    logger.debug(`Committed batch of ${instances.length} instances`);
  }
  
  return instances;
}

// Simple HTTP trigger for testing
exports.processRecurringTransactionsHttp = functions.https.onRequest(async (req, res) => {
  try {
    console.log('Starting test execution via HTTP');
    
    // Get current date at start of day (to avoid time comparison issues)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Processing date', { today: today.toISOString() });
    
    // Calculate future window (1 year ahead)
    const futureWindow = new Date(today);
    futureWindow.setFullYear(futureWindow.getFullYear() + 1);
    
    // Return success for testing
    res.status(200).json({ 
      success: true, 
      message: 'HTTP trigger executed successfully',
      today: today.toISOString(),
      futureWindow: futureWindow.toISOString()
    });
  } catch (error) {
    console.error('Error processing HTTP request', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Simple callable function for testing
exports.testProcessRule = functions.https.onCall(async (data, context) => {
  try {
    // For testing purposes, just return mock data
    return {
      success: true,
      message: 'Function called successfully',
      mockTransactions: [
        { date: '2023-05-01', amount: 100 },
        { date: '2023-06-01', amount: 100 },
        { date: '2023-07-01', amount: 100 }
      ]
    };
  } catch (error) {
    console.error('Error in test function', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Simple log sink function for testing
exports.logSink = functions.https.onRequest((request, response) => {
  console.log('Log sink function called');
  response.status(200).send('Logged successfully');
});

/**
 * Callable function to manage recurring transaction instances (generation and deletion)
 * Updated for M4a budget-centric schema
 * 
 * @param {Object} data - Function input data
 * @param {string} data.ruleId - ID of the recurring rule to manage
 * @param {string} data.budgetId - Budget ID containing the rule (required for budget-centric schema)
 * @param {string} data.action - Action to perform ('generate' or 'delete')
 * @param {Object} context - Function execution context containing authentication info
 * @returns {Object} Result object with status and counts
 */
exports.manageRecurringInstances = functions.https.onCall(async (data, context) => {
  try {
    // Basic setup (keep this)
    console.log("=== ENVIRONMENT INFO ===");
    console.log("Node.js version:", process.version);
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("FUNCTIONS_EMULATOR:", process.env.FUNCTIONS_EMULATOR);
    
    // Get parameters
    const params = data.data || {};
    const ruleId = params.ruleId;
    const budgetId = params.budgetId; // Now required
    const action = params.action;
    const emulatorUserId = params.emulatorUserId;
    
    console.log("Received parameters:", { ruleId, budgetId, action, emulatorUserId });
    
    // Input validation
    if (!ruleId || !budgetId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Both ruleId and budgetId are required'
      );
    }
    
    // Auth check (keep this)
    let userId;
    if (!context.auth && process.env.FUNCTIONS_EMULATOR === 'true' && emulatorUserId) {
      console.log("⚠️ ACTIVATING EMULATOR WORKAROUND for authentication");
      console.log("👤 Using emulator user ID:", emulatorUserId);
      userId = emulatorUserId;
    } else if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be authenticated to manage recurring transactions'
      );
    } else {
      userId = context.auth.uid;
    }
    
    console.log(`Processing ${action} action for rule ${ruleId} in budget ${budgetId} by user ${userId}`);
    
    // STEP 1: Retrieve rule document from Firestore
    console.log("Retrieving rule document from Firestore...");
    const db = admin.firestore();
    
    try {
      // Updated path for budget-centric schema
      const ruleRef = db.collection(`budgets/${budgetId}/recurringRules`).doc(ruleId);
      const ruleSnap = await ruleRef.get();
      
      if (!ruleSnap.exists) {
        console.log(`Rule ${ruleId} not found in budget ${budgetId}`);
        throw new functions.https.HttpsError(
          'not-found',
          `Rule with ID ${ruleId} not found in budget ${budgetId}`
        );
      }
      
      const rule = ruleSnap.data();
      console.log("Retrieved rule document with fields:", Object.keys(rule).join(", "));
      console.log("Rule details:", {
        name: rule.name || rule.description,
        amount: rule.amount,
        frequency: rule.frequency,
        category: rule.categoryId
      });
      
      // Verify the denormalized budgetId matches the path budgetId
      if (rule.budgetId !== budgetId) {
        console.log(`Warning: Rule budgetId field (${rule.budgetId}) does not match path budgetId (${budgetId})`);
        // Continue anyway, using the path budgetId
      }
      
      // Process based on action
      switch(action) {
        case 'generate': {
          // STEP 2: Delete future instances for this rule
          const today = startOfDay(new Date());
          console.log(`Deleting future instances for rule ${ruleId} in budget ${budgetId} from date:`, today.toISOString());
          
          // Use the direct FirestoreTimestamp reference instead
          console.log("Using direct FirestoreTimestamp class:", typeof FirestoreTimestamp);
          
          // Updated query path for budget-centric schema
          const futureTransactionsQuery = db.collection(`budgets/${budgetId}/transactions`)
            .where('recurringRuleId', '==', ruleId)
            .where('date', '>=', FirestoreTimestamp.fromDate(today));
          
          const futureTransactionsSnapshot = await futureTransactionsQuery.get();
          console.log(`Found ${futureTransactionsSnapshot.size} future transaction instances to delete`);
          
          // Batch delete the future transactions
          const MAX_BATCH_OPERATIONS = 400; // Firestore limit is 500, keeping below for safety
          let deleteCount = 0;
          
          if (futureTransactionsSnapshot.size > 0) {
            const batches = [];
            let currentBatch = db.batch();
            let operationCount = 0;
            
            futureTransactionsSnapshot.forEach(doc => {
              // Updated delete reference for budget-centric schema
              const transRef = db.collection(`budgets/${budgetId}/transactions`).doc(doc.id);
              currentBatch.delete(transRef);
              operationCount++;
              deleteCount++;
              
              if (operationCount >= MAX_BATCH_OPERATIONS) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                operationCount = 0;
              }
            });
            
            // Push the last batch if it contains operations
            if (operationCount > 0) {
              batches.push(currentBatch);
            }
            
            // Commit all batches sequentially
            console.log(`Committing ${batches.length} batches for deletion...`);
            for (const batch of batches) {
              await batch.commit();
            }
            console.log(`Successfully deleted ${deleteCount} future instances`);
          }
          
          // STEP 3: Generate new instances
          console.log("Starting instance generation calculation...");
          
          // Calculate date boundaries
          const oneYearFromNow = addYears(today, 1);
          const threeMonthsAgo = subMonths(today, 3);
          
          // Get rule date fields
          const ruleStartDate = rule.startDate ? rule.startDate.toDate() : 
                               (rule.fromDate ? rule.fromDate.toDate() : today);
          const ruleEndDate = rule.endDate ? rule.endDate.toDate() : 
                             (rule.toDate ? rule.toDate.toDate() : null);
          
          console.log("Date calculations:", {
            today: today.toISOString(),
            oneYearFromNow: oneYearFromNow.toISOString(),
            threeMonthsAgo: threeMonthsAgo.toISOString(),
            ruleStartDate: ruleStartDate.toISOString(),
            ruleEndDate: ruleEndDate ? ruleEndDate.toISOString() : "none"
          });
          
          // Determine the current date to start generating from
          // Correctly determine the loop's starting point
          let effectiveStartDate = new Date(Math.max(ruleStartDate.getTime(), threeMonthsAgo.getTime()));
          let currentDate = startOfDay(effectiveStartDate); // Ensure we start at the beginning of the day
          
          // Initialize array for instances
          const instances = [];
          
          // Log the initial currentDate value before starting the loop
          console.log(`Starting generation loop. Initial currentDate (UTC): ${currentDate.toISOString()}`);
          
          // Day-by-day iteration
          while (
            // Continue until we reach one year from now
            isBefore(currentDate, oneYearFromNow) && 
            // And stop if we hit the rule's end date (if it has one)
            (!ruleEndDate || isBefore(currentDate, ruleEndDate) || isSameDay(currentDate, ruleEndDate))
          ) {
            // Determine if we should generate an instance for this date based on frequency
            let shouldGenerate = false;
            
            // Get interval (default to 1 if not specified)
            const interval = rule.interval || 1;
            
            switch (rule.frequency) {
              case 'daily':
                // Check if currentDate is a multiple of the interval from the start date
                const daysSinceStart = differenceInDays(currentDate, ruleStartDate);
                console.log(`Daily Check: Date=${currentDate.toISOString()}, DaysSinceStart=${daysSinceStart}, Interval=${interval}`);
                shouldGenerate = daysSinceStart % interval === 0;
                break;
                
              case 'weekly':
                // For weekly, check if the day of the week matches
                console.log(`Weekly Check: Date=${currentDate.toISOString()}, Day=${getDay(currentDate)}, RuleDay=${rule.dayOfWeek}`);
                shouldGenerate = getDay(currentDate) === rule.dayOfWeek;
                break;
                
              case 'biweekly':
                // For biweekly, check if it's the right day of the week and the right week
                const weeksSinceStart = differenceInWeeks(currentDate, ruleStartDate);
                console.log(`Biweekly Check: Date=${currentDate.toISOString()}, Day=${getDay(currentDate)}, RuleDay=${rule.dayOfWeek}, WeeksSinceStart=${weeksSinceStart}`);
                shouldGenerate = getDay(currentDate) === rule.dayOfWeek && weeksSinceStart % 2 === 0;
                break;
                
              case 'monthly':
                // For monthly, check if it's the right day of month
                console.log(`Monthly Check: Date=${currentDate.toISOString()}, DateOfMonth=${getDate(currentDate)}, RuleDate=${rule.dayOfMonth}`);
                shouldGenerate = getDate(currentDate) === rule.dayOfMonth;
                // Check for end of month rule
                if (!shouldGenerate && rule.dayOfMonth > 28) {
                  // If rule day is > 28 and this is the last day of the month, generate
                  const daysInCurrentMonth = getDaysInMonth(currentDate);
                  const isLastDayOfMonth = getDate(currentDate) === daysInCurrentMonth;
                  console.log(`  Monthly End-of-Month Check: IsLastDay=${isLastDayOfMonth}, DaysInMonth=${daysInCurrentMonth}, CurrentDay=${getDate(currentDate)}`);
                  shouldGenerate = isLastDayOfMonth && rule.dayOfMonth >= daysInCurrentMonth;
                }
                break;
                
              case 'quarterly':
                // For quarterly, check if the month is a multiple of 3 months from start month
                // and it's the correct day of month
                const monthsSinceStart = differenceInMonths(currentDate, ruleStartDate);
                console.log(`Quarterly Check: Date=${currentDate.toISOString()}, Month=${getMonth(currentDate)}, StartMonth=${getMonth(ruleStartDate)}, MonthsSinceStart=${monthsSinceStart}, DateOfMonth=${getDate(currentDate)}, RuleDate=${rule.dayOfMonth}`);
                shouldGenerate = monthsSinceStart % 3 === 0 && getDate(currentDate) === rule.dayOfMonth;
                break;
                
              case 'yearly':
                // For yearly, check if it's the anniversary of the start date (same month and day)
                const yearsSinceStart = differenceInYears(currentDate, ruleStartDate);
                console.log(`Yearly Check: Date=${currentDate.toISOString()}, Month=${getMonth(currentDate)}, StartMonth=${getMonth(ruleStartDate)}, Day=${getDate(currentDate)}, StartDay=${getDate(ruleStartDate)}, YearsSinceStart=${yearsSinceStart}`);
                shouldGenerate = getMonth(currentDate) === getMonth(ruleStartDate) && 
                                getDate(currentDate) === getDate(ruleStartDate);
                break;
                
              default:
                // Default to no generation for unknown frequencies
                shouldGenerate = false;
            }
            
            // If interval is specified (e.g., every 2 months), adjust shouldGenerate
            if (shouldGenerate && rule.interval && rule.interval > 1) {
              let unitsSinceStart;
              
              switch (rule.frequency) {
                case 'daily':
                  unitsSinceStart = differenceInDays(currentDate, ruleStartDate);
                  break;
                case 'weekly':
                  unitsSinceStart = differenceInWeeks(currentDate, ruleStartDate);
                  break;
                case 'monthly':
                  unitsSinceStart = differenceInMonths(currentDate, ruleStartDate);
                  break;
                case 'quarterly':
                  unitsSinceStart = Math.floor(differenceInMonths(currentDate, ruleStartDate) / 3);
                  break;
                case 'yearly':
                  unitsSinceStart = differenceInYears(currentDate, ruleStartDate);
                  break;
                default:
                  unitsSinceStart = 0;
              }
              
              // Only generate on the interval
              shouldGenerate = unitsSinceStart % rule.interval === 0;
            }
            
            // If we should generate an instance for this date
            if (shouldGenerate) {
              console.log(`✅ Rule matches date (UTC): ${currentDate.toISOString()}`);
              
              // Create a transaction instance object following the budget-centric schema
              const instance = {
                budgetId: budgetId, // Denormalized budgetId for collection group queries
                createdByUserId: rule.createdByUserId || 'system', // Use rule creator's ID
                categoryId: rule.categoryId,
                date: FirestoreTimestamp.fromDate(currentDate),
                description: rule.name || rule.description || 'Recurring Transaction',
                type: rule.type || rule.categoryType || 'expense', // Ensure we get the type
                // Fix amount sign for expenses consistently with existing logic
                amount: (rule.categoryType === 'expense' || rule.type === 'expense') 
                  ? -Math.abs(rule.amount) 
                  : Math.abs(rule.amount),
                isRecurringInstance: true,
                recurringRuleId: ruleId,
                createdAt: FirestoreFieldValue.serverTimestamp(),
                updatedAt: FirestoreFieldValue.serverTimestamp(),
                lastEditedByUserId: null
              };
              
              // Add optional fields if they exist in the rule
              if (rule.categoryName) instance.categoryName = rule.categoryName;
              if (rule.categoryColor) instance.categoryColor = rule.categoryColor;
              if (rule.notes) instance.notes = rule.notes;
              
              // Add to instances array
              instances.push(instance);
            }
            
            // Move to next day
            currentDate = addDays(currentDate, 1);
          }
          
          console.log(`Prepared ${instances.length} instances for generation in budget ${budgetId}`);
          
          if (instances.length > 0) {
            console.log('First prepared instance:', {
              date: instances[0].date.toDate().toISOString(),
              amount: instances[0].amount,
              description: instances[0].description,
              budgetId: instances[0].budgetId
            });
          }
          
          // STEP 4: Batch write instances to Firestore
          if (instances.length > 0) {
            console.log("Starting batch writes to save instances to Firestore...");
            
            // Set a safe batch size limit
            const MAX_BATCH_OPERATIONS = 400;
            let generatedCount = 0;
            
            // Create batches array and first batch
            const batches = [];
            let currentBatch = db.batch();
            let operationCount = 0;
            
            // Process each instance
            for (const instance of instances) {
              // Create a new document reference with updated path for budget-centric schema
              const newRef = db.collection(`budgets/${budgetId}/transactions`).doc();
              
              // Add to current batch
              currentBatch.set(newRef, instance);
              operationCount++;
              generatedCount++;
              
              // If we hit the batch limit, push this batch and start a new one
              if (operationCount >= MAX_BATCH_OPERATIONS) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                operationCount = 0;
              }
            }
            
            // Push the final batch if it has any operations
            if (operationCount > 0) {
              batches.push(currentBatch);
            }
            
            // Commit all batches sequentially
            console.log(`Committing ${batches.length} batches for ${generatedCount} instances in budget ${budgetId}...`);
            for (const batch of batches) {
              await batch.commit();
            }
            console.log(`Successfully committed all batches. Total instances saved: ${generatedCount}`);
            
            // Update the rule's nextDate field to the day after the last calculated date
            console.log(`Updating rule's nextDate field to: ${currentDate.toISOString()}`);
            await ruleRef.update({
              nextDate: FirestoreTimestamp.fromDate(currentDate),
              updatedAt: FirestoreFieldValue.serverTimestamp(),
              lastEditedByUserId: 'system'
            });
            
            // Return success with counts and timestamps
            return {
              success: true,
              message: `Successfully deleted ${deleteCount} future instances and generated ${generatedCount} new instances for budget ${budgetId}`,
              deleted: deleteCount,
              generated: generatedCount,
              budgetId: budgetId,
              nextCalculationDate: currentDate.toISOString()
            };
          } else {
            // No instances were generated
            console.log(`No instances were generated for rule ${ruleId} in budget ${budgetId}`);
            
            // Update the rule's nextDate field to the day after the last calculated date
            console.log(`Updating rule's nextDate field to: ${currentDate.toISOString()}`);
            await ruleRef.update({
              nextDate: FirestoreTimestamp.fromDate(currentDate),
              updatedAt: FirestoreFieldValue.serverTimestamp(),
              lastEditedByUserId: 'system'
            });
            
            // Return success with counts
            return {
              success: true,
              message: `Successfully deleted ${deleteCount} future instances but no new instances were generated for budget ${budgetId}`,
              deleted: deleteCount,
              generated: 0,
              budgetId: budgetId,
              nextCalculationDate: currentDate.toISOString()
            };
          }
        }
        
        case 'delete': {
          // Modified to delete ALL transactions for this rule in the specified budget
          console.log(`Deleting ALL transactions for rule ID: ${ruleId} in budget ${budgetId}`);
          
          // Updated query path for budget-centric schema
          const allTransactionsQuery = db.collection(`budgets/${budgetId}/transactions`)
            .where('recurringRuleId', '==', ruleId);
          
          const allTransactionsSnapshot = await allTransactionsQuery.get();
          console.log(`Found ${allTransactionsSnapshot.size} total transactions to delete`);
          
          // Batch delete all transactions
          const MAX_BATCH_OPERATIONS = 400;
          let deleteCount = 0;
          
          if (allTransactionsSnapshot.size > 0) {
            const batches = [];
            let currentBatch = db.batch();
            let operationCount = 0;
            
            allTransactionsSnapshot.forEach(doc => {
              // Updated delete reference for budget-centric schema
              const transRef = db.collection(`budgets/${budgetId}/transactions`).doc(doc.id);
              currentBatch.delete(transRef);
              operationCount++;
              deleteCount++;
              
              if (operationCount >= MAX_BATCH_OPERATIONS) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                operationCount = 0;
              }
            });
            
            // Push the last batch if it contains operations
            if (operationCount > 0) {
              batches.push(currentBatch);
            }
            
            // Commit all batches sequentially
            console.log(`Committing ${batches.length} batches for deletion...`);
            for (const batch of batches) {
              await batch.commit();
            }
            console.log(`Successfully deleted ${deleteCount} total transactions`);
          }
          
          // For delete action, we're done after deletion
          return {
            success: true,
            message: `Successfully deleted all ${deleteCount} transactions for rule ${rule.name || 'Recurring Rule'} in budget ${budgetId}`,
            ruleId,
            budgetId,
            deleted: deleteCount
          };
        }
        
        default:
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Unknown action: ${action}. Supported actions are 'generate' and 'delete'.`
          );
      }
      
    } catch (firestoreError) {
      console.error("Firestore operation error:", firestoreError);
      throw firestoreError;
    }
    
  } catch (error) {
    console.error("!!! manageRecurringInstances Error Caught !!!");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("Full Error Object:", error);
    
    throw new functions.https.HttpsError(
      'internal',
      `Error processing recurring instances: ${error.message}`
    );
  }
});

/**
 * Test function to diagnose authentication issues
 * This function logs information about the context.auth object and returns it
 * @param {Object} data - Function input data (not used)
 * @param {Object} context - Function execution context containing authentication info
 * @returns {Object} Result object with auth info
 */
exports.testAuth = functions.https.onCall(async (data, context) => {
  // Log environment info
  console.log("=== TEST AUTH FUNCTION ===");
  console.log("Node.js version:", process.version);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("FUNCTIONS_EMULATOR:", process.env.FUNCTIONS_EMULATOR);
  
  // Log full context object and data safely
  console.log("Context has auth:", !!context.auth);
  console.log("Context keys:", Object.keys(context));
  console.log("Received data type:", typeof data);
  console.log("Received data keys:", data ? Object.keys(data) : "null");
  
  // The actual user params are nested in the data object
  console.log("Data object:", data?.data ? Object.keys(data.data) : "null");
  console.log("emulatorUserId from nested data:", data?.data?.emulatorUserId);
  console.log("isEmulator from nested data:", data?.data?.isEmulator);
  
  // Emulator workaround for development - improved detection logic
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
  const hasEmulatorUserId = data?.data?.emulatorUserId && typeof data.data.emulatorUserId === 'string' && data.data.emulatorUserId.length > 0;
  
  console.log("Is emulator environment:", isEmulator);
  console.log("Has emulator user ID:", hasEmulatorUserId);
  
  if (!context.auth && isEmulator && hasEmulatorUserId) {
    console.log("⚠️ ACTIVATING EMULATOR WORKAROUND with userId:", data.data.emulatorUserId);
    
    return {
      status: "authenticated (emulator)",
      userId: data.data.emulatorUserId,
      authTime: new Date().getTime(),
      nodeVersion: process.version,
      note: "Using emulator workaround with provided userId"
    };
  }
  
  // Return different responses based on auth state
  if (context.auth) {
    return {
      status: "authenticated",
      userId: context.auth.uid,
      authTime: context.auth.token.auth_time,
      nodeVersion: process.version
    };
  } else {
    return {
      status: "unauthenticated",
      nodeVersion: process.version,
      note: "Auth verification passed but context.auth is undefined",
      receivedEmulatorId: data?.data?.emulatorUserId || "none",
      emulatorDetected: isEmulator
    };
  }
});

// Simple test function that just returns whatever it receives
exports.echoTest = functions.https.onCall(async (data, context) => {
  console.log("=== ECHO TEST FUNCTION ===");
  // Use a safer approach to log objects that might have circular references
  console.log("Received data:", typeof data, data ? Object.keys(data) : "null");
  console.log("Data nested object:", data?.data ? Object.keys(data.data) : "null");
  console.log("emulatorUserId value:", data?.data?.emulatorUserId);
  console.log("isEmulator value:", data?.data?.isEmulator);
  
  // Don't try to stringify the entire context object
  console.log("Context auth:", context.auth);
  console.log("Context auth token:", context.auth?.token);
  
  return {
    success: true,
    echoData: {
      emulatorUserId: data?.data?.emulatorUserId,
      isEmulator: data?.data?.isEmulator,
      dataKeys: data ? Object.keys(data) : [],
      nestedDataKeys: data?.data ? Object.keys(data.data) : []
    },
    contextAuthExists: !!context.auth,
    emulator: process.env.FUNCTIONS_EMULATOR === 'true'
  };
});