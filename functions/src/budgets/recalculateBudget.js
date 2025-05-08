const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { parse, subMonths, format, startOfMonth, endOfMonth } = require('date-fns');

// admin.initializeApp() is called globally in functions/index.js.

/**
 * Recalculates monthly budget summary figures.
 * @param {object} data The data object passed to the function.
 * @param {string} data.budgetId The ID of the budget.
 * @param {string} data.monthString The month string in "YYYY-MM" format.
 * @param {object} context The context object containing authentication information.
 * @returns {Promise<object>} A promise that resolves with a success or error object.
 */
exports.recalculateBudget = functions.https.onCall(async (data, context) => {
  // Input Validation
  if (!context.auth) {
    functions.logger.error('User unauthenticated for recalculateBudget call.');
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
  }

  const { budgetId, monthString } = data;

  if (!budgetId || typeof budgetId !== 'string' || budgetId.trim() === '') {
    functions.logger.error('Invalid or missing budgetId for recalculateBudget.', { budgetId });
    throw new functions.https.HttpsError('invalid-argument', 'A valid budgetId (string) is required.');
  }

  if (!monthString || typeof monthString !== 'string' || monthString.trim() === '') {
    functions.logger.error('Invalid or missing monthString for recalculateBudget.', { monthString });
    throw new functions.https.HttpsError('invalid-argument', 'A valid monthString (string) is required.');
  }

  const monthStringRegex = /^\d{4}-\d{2}$/;
  if (!monthStringRegex.test(monthString)) {
    functions.logger.error('Invalid monthString format for recalculateBudget. Expected YYYY-MM.', { monthString });
    throw new functions.https.HttpsError('invalid-argument', 'Invalid monthString format. Expected YYYY-MM.');
  }

  const userId = context.auth.uid;

  // Initial Logging
  functions.logger.info('recalculateBudget function invoked.', {
    userId,
    budgetId,
    monthString,
  });

  const db = admin.firestore();
  const currentMonthlyDataRef = db.doc(`budgets/${budgetId}/monthlyData/${monthString}`);

  try {
    // A. Fetch Transactions for the Month
    const referenceDate = parse(monthString + "-01", 'yyyy-MM-dd', new Date()); 
    const startOfMonthTimestamp = admin.firestore.Timestamp.fromDate(startOfMonth(referenceDate));
    const endOfMonthTimestamp = admin.firestore.Timestamp.fromDate(endOfMonth(referenceDate));

    const transactionsQuery = db.collection(`budgets/${budgetId}/transactions`)
      .where('date', '>=', startOfMonthTimestamp)
      .where('date', '<=', endOfMonthTimestamp);

    const transactionsSnapshot = await transactionsQuery.get();
    const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    functions.logger.info(`Fetched ${transactions.length} transactions for month ${monthString}.`, { userId, budgetId });

    // B. Fetch Current Allocations
    const currentMonthlyDataSnap = await currentMonthlyDataRef.get();
    const currentAllocations = currentMonthlyDataSnap.exists ? currentMonthlyDataSnap.data().allocations || {} : {};
    functions.logger.info(`Fetched current allocations for month ${monthString}. Found: ${currentMonthlyDataSnap.exists}`, { userId, budgetId, allocationsCount: Object.keys(currentAllocations).length });

    // C. Fetch Previous Month's Calculated Data (for Rollover)
    const previousMonthDate = subMonths(referenceDate, 1);
    const previousMonthString = format(previousMonthDate, 'yyyy-MM');
    const previousMonthlyDataRef = db.doc(`budgets/${budgetId}/monthlyData/${previousMonthString}`);
    const previousMonthlyDataSnap = await previousMonthlyDataRef.get();
    
    const previousCalculatedData = previousMonthlyDataSnap.exists ? previousMonthlyDataSnap.data().calculated : null;
    const prevAvailableToAllocate = previousCalculatedData?.availableToAllocate ?? 0;
    const prevTotalAllocated = previousCalculatedData?.totalAllocated ?? 0;

    if (previousMonthlyDataSnap.exists) {
      functions.logger.info(`Found previous month's (${previousMonthString}) data for rollover.`, { userId, budgetId, prevAvailableToAllocate, prevTotalAllocated });
    } else {
      functions.logger.info(`No previous month's (${previousMonthString}) data found for rollover. Rollover values will be 0.`, { userId, budgetId });
    }

    // TODO: Task 3 - Perform B6.1 Calculations

    // A. Calculate monthlyRevenue (B6.1 - 3.1)
    const calculatedMonthlyRevenue = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // B. Calculate monthlyRecurringExpenses_absolute_sum (B6.1 - 3.2)
    const calculatedMonthlyRecurringExpensesAbsoluteSum = transactions
      .filter(tx => tx.type === 'expense' && tx.isRecurringInstance === true)
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    // C. Calculate rolloverAmount (B6.1 - 3.3)
    const calculatedRolloverAmount = prevAvailableToAllocate - prevTotalAllocated;

    // D. Calculate availableFunds (B6.1 - 3.4)
    const calculatedAvailableFunds = calculatedMonthlyRevenue - calculatedMonthlyRecurringExpensesAbsoluteSum + calculatedRolloverAmount;

    // E. Calculate totalAllocated (B6.1 - 3.5)
    const calculatedTotalAllocated = Object.values(currentAllocations)
      .reduce((sum, alloc) => sum + (typeof alloc === 'number' && alloc >= 0 ? alloc : 0), 0);

    // F. Calculate remainingToAllocate (B6.1 - 3.6)
    const calculatedRemainingToAllocate = calculatedAvailableFunds - calculatedTotalAllocated;

    // G. Calculate totalSpent (B6.1 - 3.8)
    const calculatedTotalSpent = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

    // H. Calculate monthlySavings (B6.1 - 3.9)
    const calculatedMonthlySavings = calculatedMonthlyRevenue - calculatedTotalSpent;

    // I. Assemble calculatedData Object
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

    functions.logger.info('Completed B6.1 calculations.', { userId, budgetId, monthString, calculatedData });

    // TODO: Task 4 - Write Calculated Data
    await currentMonthlyDataRef.set({
      budgetId, // Denormalize budgetId as per B5.2 schema for monthlyData
      month: monthString, // Denormalize month as per B5.2 schema for monthlyData
      year: parseInt(monthString.substring(0, 4), 10), // Denormalize year as per B5.2
      calculated: calculatedData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // Ensure createdAt is only set if the document is new, or handle appropriately
      // For simplicity here, we rely on merge:true; a more robust solution might check doc.exists
      // and conditionally add createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    functions.logger.info(`Successfully wrote calculated data to monthlyData for ${monthString}.`, { userId, budgetId });

    // Return success
    return { success: true, message: "Budget successfully recalculated and data persisted." }; // Updated success message
  } catch (error) {
    functions.logger.error('Error during data fetching in recalculateBudget', { 
      userId, 
      budgetId, 
      monthString, 
      errorMessage: error.message, 
      errorStack: error.stack 
    });
    throw new functions.https.HttpsError('internal', 'An error occurred while fetching budget data.', error.message);
  }
}); 