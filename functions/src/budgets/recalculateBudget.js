const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { parse, subMonths, format, startOfMonth, endOfMonth } = require('date-fns');

/**
 * Helper function to parse YYYY-MM string and return start/end Date objects.
 * @param {string} monthString The month string in "YYYY-MM" format.
 * @returns {{startDate: Date, endDate: Date}} Object containing start and end Date objects.
 */
const parseMonthStringForDates = (monthString) => {
  if (!monthString || !/^\d{4}-\d{2}$/.test(monthString)) {
    throw new Error(`Invalid monthString format: ${monthString}. Expected YYYY-MM.`);
  }
  try {
    // Use date-fns parse for robust date creation
    const referenceDate = parse(monthString + '-01', 'yyyy-MM-dd', new Date());
    const startDate = startOfMonth(referenceDate);
    const endDate = endOfMonth(referenceDate);
    return { startDate, endDate };
  } catch (error) {
    functions.logger.error("Error parsing monthString with date-fns:", { monthString, error: error.message });
    throw new Error(`Failed to parse monthString: ${monthString}. ${error.message}`);
  }
};

/**
 * Recalculates monthly budget summary figures.
 * @param {object} data The data object passed to the function.
 * @param {string} data.token (Optional) Manually passed ID token.
 * @param {string} data.budgetId The ID of the budget.
 * @param {string} data.monthString The month string in "YYYY-MM" format.
 * @param {object} context The context object containing authentication information.
 * @returns {Promise<object>} A promise that resolves with a success or error object.
 */
exports.recalculateBudget = functions.https.onCall(async (data, context) => {
  let userId;
  
  // Try regular auth context first
  if (context.auth) {
    userId = context.auth.uid;
    functions.logger.info("Authentication successful via context.auth", { userId });
  } 
  // Fallback to manual verification if context.auth is missing
  else {
    functions.logger.warn("context.auth missing, attempting manual token verification.");
    try {
      // Extract token from potentially nested data structure
      const inputData = data.data || data; // Handle potential nesting from some client versions
      const token = inputData.token;
      
      if (!token) {
        functions.logger.error("Manual verification failed: No token provided in data.");
        throw new functions.https.HttpsError('unauthenticated', 'Authentication token is required.');
      }
      
      // Verify the token manually
      functions.logger.debug("Attempting manual token verification...");
      const decodedToken = await admin.auth().verifyIdToken(token);
      userId = decodedToken.uid;
      functions.logger.info("Authentication successful via manual token verification", { userId });
    } catch (error) {
      functions.logger.error("Manual token verification failed:", { errorMessage: error.message, errorCode: error.code });
      // Throw specific error details if helpful, otherwise generic unauthenticated
      throw new functions.https.HttpsError('unauthenticated', `Token verification failed: ${error.message}`);
    }
  }
  
  // Re-check if userId was obtained
  if (!userId) {
    functions.logger.error("Fatal: userId could not be determined after auth checks.");
    throw new functions.https.HttpsError('internal', 'Could not determine user authentication.');
  }

  // Extract budget parameters from the correct location (handle nesting)
  const inputData = data.data || data;
  const { budgetId, monthString } = inputData;
  
  // Validate required parameters
  if (!budgetId || typeof budgetId !== 'string' || budgetId.trim() === '') {
    functions.logger.error("Missing or invalid budgetId", { userId });
    throw new functions.https.HttpsError('invalid-argument', 'A valid budgetId (string) is required.');
  }
  
  if (!monthString || typeof monthString !== 'string' || !/^\d{4}-\d{2}$/.test(monthString)) {
    functions.logger.error("Missing or invalid monthString", { userId, budgetId });
    throw new functions.https.HttpsError('invalid-argument', 'A valid monthString (YYYY-MM) is required.');
  }
  
  functions.logger.info("recalculateBudget invoked with valid auth and parameters", { 
    userId, 
    budgetId, 
    monthString 
  });
  
  try {
    // *** Add Check for Budget Document Existence ***
    const db = admin.firestore();
    const budgetRef = db.doc(`budgets/${budgetId}`); // Use db instance
    const budgetDoc = await budgetRef.get();
    if (!budgetDoc.exists) {
      functions.logger.error(`Budget document not found: ${budgetId}`, { userId });
      throw new functions.https.HttpsError('not-found', `Budget with ID ${budgetId} not found`);
    }
    functions.logger.debug("Budget document exists.", { userId, budgetId });

    const currentMonthlyDataRef = db.doc(`budgets/${budgetId}/monthlyData/${monthString}`);

    // A. Fetch Transactions for the Month
    const { startDate, endDate } = parseMonthStringForDates(monthString);
    functions.logger.debug('Querying transactions between:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    const transactionsQuery = db.collection(`budgets/${budgetId}/transactions`)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate);

    const transactionsSnapshot = await transactionsQuery.get();
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    functions.logger.debug(`Fetched ${transactions.length} transactions for month ${monthString}.`, { userId, budgetId });

    // B. Fetch Current Allocations
    const currentMonthlyDataSnap = await currentMonthlyDataRef.get();
    const currentAllocations = currentMonthlyDataSnap.exists ? currentMonthlyDataSnap.data().allocations || {} : {};
    functions.logger.debug(`Fetched current allocations. Found: ${currentMonthlyDataSnap.exists}`, { userId, budgetId });

    // C. Fetch Previous Month's Calculated Data (for Rollover)
    const previousMonthDate = subMonths(startDate, 1);
    const previousMonthString = format(previousMonthDate, 'yyyy-MM');
    const previousMonthlyDataRef = db.doc(`budgets/${budgetId}/monthlyData/${previousMonthString}`);
    const previousMonthlyDataSnap = await previousMonthlyDataRef.get();
    
    const previousCalculatedData = previousMonthlyDataSnap.exists ? previousMonthlyDataSnap.data().calculated : null;
    const prevAvailableToAllocate = previousCalculatedData?.availableToAllocate ?? 0;
    const prevTotalAllocated = previousCalculatedData?.totalAllocated ?? 0;
    functions.logger.debug(`Previous month (${previousMonthString}) data found: ${previousMonthlyDataSnap.exists}`, { userId, budgetId });

    // --- B6.1 Calculations --- 
    const calculatedMonthlyRevenue = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const calculatedMonthlyRecurringExpensesAbsoluteSum = transactions.filter(tx => tx.type === 'expense' && tx.isRecurringInstance === true).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
    const calculatedRolloverAmount = prevAvailableToAllocate - prevTotalAllocated;
    const calculatedAvailableFunds = calculatedMonthlyRevenue - calculatedMonthlyRecurringExpensesAbsoluteSum + calculatedRolloverAmount;
    const calculatedTotalAllocated = Object.values(currentAllocations).reduce((sum, alloc) => sum + (typeof alloc === 'number' && alloc >= 0 ? alloc : 0), 0);
    const calculatedRemainingToAllocate = calculatedAvailableFunds - calculatedTotalAllocated;
    const calculatedTotalSpent = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
    const calculatedMonthlySavings = calculatedMonthlyRevenue - calculatedTotalSpent;

    const calculatedData = {
      revenue: calculatedMonthlyRevenue,
      recurringExpenses: calculatedMonthlyRecurringExpensesAbsoluteSum,
      rolloverFromPrevious: calculatedRolloverAmount,
      availableToAllocate: calculatedAvailableFunds,
      totalAllocated: calculatedTotalAllocated,
      remainingToAllocate: calculatedRemainingToAllocate,
      totalSpent: calculatedTotalSpent,
      monthlySavings: calculatedMonthlySavings
    };
    functions.logger.info('Completed B6.1 calculations.', { userId, budgetId, monthString }); // Removed verbose calculatedData log

    // --- Write Calculated Data --- 
    // Add this right before line 160 (actual serverTimestamp usage):
    functions.logger.debug('Admin objects directly before serverTimestamp usage:', {
      hasAdminObject: !!admin,
      hasFirestoreProperty: !!(admin && admin.firestore), // Check if firestore property exists
      isFirestoreFunction: typeof admin?.firestore === 'function', // Check if admin.firestore is a function (it should be)
      hasFieldValueProperty: !!(admin && admin.firestore && admin.firestore.FieldValue), // Check if FieldValue exists
      // Check if serverTimestamp is a function on FieldValue IF FieldValue exists
      hasServerTimestampFunction: typeof admin?.firestore?.FieldValue?.serverTimestamp === 'function',
      // Attempt to log a small part of admin stringified, might still fail if too complex early
      // adminJsonPreview: admin ? (JSON.stringify(admin).substring(0, 100) + '...') : "admin object is null/undefined"
      // Let's avoid stringifying admin directly if it's causing issues.
      // Instead, focus on the path to serverTimestamp.
    });

    // Replace the serverTimestamp line with a fallback
    let updatedAtValue;
    // Try to use serverTimestamp, but have a fallback
    if (admin && admin.firestore && admin.firestore.FieldValue && typeof admin.firestore.FieldValue.serverTimestamp === 'function') {
      updatedAtValue = admin.firestore.FieldValue.serverTimestamp();
    } else {
      functions.logger.warn('Could not access admin.firestore.FieldValue.serverTimestamp(). Using new Date() as fallback for updatedAt.', {
        userId, budgetId, monthString
      });
      updatedAtValue = new Date(); // Using plain Date instead of serverTimestamp due to issues in emulator
    }

    await currentMonthlyDataRef.set({
      budgetId, 
      month: monthString, 
      year: parseInt(monthString.substring(0, 4), 10),
      calculated: calculatedData,
      updatedAt: updatedAtValue, // Use the obtained timestampValue
    }, { merge: true });
    functions.logger.info(`Successfully wrote calculated data to monthlyData for ${monthString}.`, { userId, budgetId });

    // Return success
    return { success: true, message: "Budget successfully recalculated and data persisted." }; 

  } catch (error) {
    // Catch errors from the main logic (fetching, calculating, writing)
    functions.logger.error('Error during budget recalculation logic', { 
      userId, 
      budgetId, 
      monthString, 
      errorMessage: error.message, 
      errorStack: error.stack 
    });
    // Use 'internal' for server-side processing errors
    throw new functions.https.HttpsError('internal', 'An error occurred while recalculating the budget.', error.message);
  }
}); 