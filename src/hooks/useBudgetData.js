import { useState, useEffect, useMemo } from 'react';
import { getMonthlyBudgetData } from '../services/firebase/budgetService'; // Adjust path as needed
import { getCategoriesListener } from '../services/firebase/categories'; // Adjust path as needed
import { getTransactionsForMonth } from '../services/firebase/transactions'; // Import new function
import logger from '../services/logger'; // Assuming logger is available

/**
 * Custom hook to fetch budget data including monthly details, categories, transactions, and category activity.
 * @param {string} budgetId - The ID of the budget to fetch data for.
 * @param {string} monthString - The month string in "YYYY-MM" format.
 * @param {object} [editingAllocations] - Optional. Current in-flight edits for allocations { categoryId: amountStr }.
 * @returns {object} - { monthlyData, categories, transactions, categoryActivityMap, monthlyRevenue, monthlyRecurringSpending, availableFunds, totalAllocated, remainingToAllocate, totalSpent, monthlySavings, rolloverAmount, isUsingServerCalculations, loading, error }
 */
function useBudgetData(budgetId, monthString, editingAllocations = {}) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); // New state for transactions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derived constants based on state, should be defined early if other useMemos depend on them.
  const serverCalculated = monthlyData?.calculated;
  const isUsingServerCalculations = !!serverCalculated;

  // Client-side calculation logic (fallbacks)
  const clientCalculatedMonthlyRevenue = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const clientCalculatedMonthlyRecurringSpending = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'expense' && tx.isRecurringInstance === true).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  const clientCalculatedRolloverAmount = 0; // Static client-side fallback

  const clientCalculatedAvailableFunds = useMemo(() => {
    return clientCalculatedMonthlyRevenue - clientCalculatedMonthlyRecurringSpending + clientCalculatedRolloverAmount;
  }, [clientCalculatedMonthlyRevenue, clientCalculatedMonthlyRecurringSpending]); // Removed clientCalculatedRolloverAmount as it's constant

  // Total allocated, considering unsaved edits from editingAllocations
  const currentTotalAllocatedBasedOnEdits = useMemo(() => {
    let total = 0;
    const baseAllocations = monthlyData?.allocations || {};
    const allCategoryIds = new Set([
      ...Object.keys(baseAllocations),
      ...Object.keys(editingAllocations)
    ]);

    allCategoryIds.forEach(catId => {
      const amountStr = editingAllocations[catId];
      if (amountStr !== undefined) {
        const numericAmount = parseFloat(amountStr);
        if (!isNaN(numericAmount)) {
          total += numericAmount;
        }
      } else if (baseAllocations[catId] !== undefined) {
        total += parseFloat(baseAllocations[catId]) || 0;
      }
    });

    console.log(`[useBudgetData] Calculating currentTotalAllocatedBasedOnEdits:`);
    console.log(`  - Base Allocations (monthlyData?.allocations or equivalent):`, baseAllocations); // Ensure 'baseAllocations' is the correct variable
    console.log(`  - Editing Allocations (editingAllocations param):`, editingAllocations);
    console.log(`  - Resulting currentTotalAllocatedBasedOnEdits:`, total); // 'total' is the sum calculated in this memo

    return total;
  }, [monthlyData, editingAllocations, categories]);

  // Use currentTotalAllocatedBasedOnEdits for remainingToAllocate calculation
  const currentRemainingToAllocateBasedOnEdits = useMemo(() => {
    const available = isUsingServerCalculations 
                      ? (serverCalculated?.availableToAllocate ?? clientCalculatedAvailableFunds) 
                      : clientCalculatedAvailableFunds;

    // In useBudgetData.js, inside useMemo for currentRemainingToAllocateBasedOnEdits
    const resolvedAvailableFunds = isUsingServerCalculations ? (serverCalculated?.availableToAllocate ?? clientCalculatedAvailableFunds) : clientCalculatedAvailableFunds;
    const calculatedRemaining = resolvedAvailableFunds - currentTotalAllocatedBasedOnEdits; // Calculate for logging before returning
    
    console.log(`[useBudgetData] Calculating currentRemainingToAllocateBasedOnEdits:`);
    console.log(`  - Resolved Available Funds:`, resolvedAvailableFunds);
    console.log(`  - currentTotalAllocatedBasedOnEdits (input to this calc):`, currentTotalAllocatedBasedOnEdits);
    console.log(`  - Resulting remainingToAllocate:`, calculatedRemaining);
    
    return available - currentTotalAllocatedBasedOnEdits;
  }, [isUsingServerCalculations, serverCalculated, clientCalculatedAvailableFunds, currentTotalAllocatedBasedOnEdits]); // Added serverCalculated to dependencies
  
  const clientCalculatedTotalSpent = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  const clientCalculatedMonthlySavings = useMemo(() => {
    return clientCalculatedMonthlyRevenue - clientCalculatedTotalSpent;
  }, [clientCalculatedMonthlyRevenue, clientCalculatedTotalSpent]);

  const categoryActivityMap = useMemo(() => {
    if (!transactions || transactions.length === 0) return {};
    logger.debug('useBudgetData', 'Calculating category activity map', { transactionCount: transactions.length });
    const activityMap = {};
    transactions.forEach(transaction => {
      if (!transaction.categoryId || typeof transaction.amount !== 'number') {
        logger.warn('useBudgetData', 'Invalid transaction data for activity calculation', { transactionId: transaction.id, categoryId: transaction.categoryId, amount: transaction.amount });
        return;
      }
      if (!activityMap[transaction.categoryId]) activityMap[transaction.categoryId] = 0;
      activityMap[transaction.categoryId] += transaction.amount;
    });
    logger.debug('useBudgetData', 'Category activity map calculated', { categoryCount: Object.keys(activityMap).length });
    return activityMap;
  }, [transactions]);

  // Final figures for export, prioritizing server data or edited values
  const monthlyRevenue = isUsingServerCalculations ? (serverCalculated.revenue ?? clientCalculatedMonthlyRevenue) : clientCalculatedMonthlyRevenue;
  const monthlyRecurringSpending = isUsingServerCalculations ? (serverCalculated.recurringExpenses ?? clientCalculatedMonthlyRecurringSpending) : clientCalculatedMonthlyRecurringSpending;
  const rolloverAmount = isUsingServerCalculations ? (serverCalculated.rolloverFromPrevious ?? clientCalculatedRolloverAmount) : clientCalculatedRolloverAmount;
  const availableFunds = isUsingServerCalculations ? (serverCalculated.availableToAllocate ?? clientCalculatedAvailableFunds) : clientCalculatedAvailableFunds;
  
  const totalAllocated = currentTotalAllocatedBasedOnEdits;
  const remainingToAllocate = currentRemainingToAllocateBasedOnEdits;
  
  const totalSpent = isUsingServerCalculations ? (serverCalculated.totalSpent ?? clientCalculatedTotalSpent) : clientCalculatedTotalSpent;
  const monthlySavings = isUsingServerCalculations ? (serverCalculated.monthlySavings ?? clientCalculatedMonthlySavings) : clientCalculatedMonthlySavings;

  // Logging the source of calculations
  useEffect(() => {
    if (budgetId && monthString) {
      if (isUsingServerCalculations) {
        logger.debug('useBudgetData', 'Using SERVER-calculated budget figures where available', { budgetId, monthString, serverCalculated });
      } else if (monthlyData) { 
        logger.debug('useBudgetData', 'Using CLIENT-calculated budget figures (server data incomplete or not used for all fields)', { budgetId, monthString });
      }
    }
  }, [monthlyData, isUsingServerCalculations, budgetId, monthString, serverCalculated]); // Added serverCalculated to dep array

  useEffect(() => {
    // Ensure budgetId and monthString are provided before fetching
    if (!budgetId || !monthString) {
      setLoading(false);
      setError(new Error("Budget ID and Month String are required."));
      setMonthlyData(null);
      setCategories([]);
      setTransactions([]); // Reset transactions
      logger.warn('useBudgetData', 'Hook called without budgetId or monthString', { budgetId, monthString });
      return;
    }

    setLoading(true);
    setError(null);
    let categoriesUnsubscribe = null; // To store the categories listener unsubscribe function
    let transactionsUnsubscribe = null; // To store the transactions listener unsubscribe function
    let monthlyDataUnsubscribe = null; // To store the monthly data listener unsubscribe function

    const setupListeners = () => {
      try {
        // Set up monthly data listener
        logger.debug('useBudgetData', 'Setting up monthly data listener', { budgetId, monthString });
        monthlyDataUnsubscribe = getMonthlyBudgetData(
          budgetId, 
          monthString, 
          (updatedMonthlyData) => {
            setMonthlyData(updatedMonthlyData);
            logger.debug('useBudgetData', 'Monthly data updated via listener', { 
              budgetId, 
              monthString, 
              dataExists: !!updatedMonthlyData 
            });
          },
          (monthlyDataError) => {
            logger.error('useBudgetData', 'Error in monthly data listener', {
              error: monthlyDataError.message,
              stack: monthlyDataError.stack,
              budgetId,
              monthString
            });
            setError(monthlyDataError);
          }
        );

        // Set up categories listener
        logger.debug('useBudgetData', 'Setting up categories listener', { budgetId });
        categoriesUnsubscribe = getCategoriesListener(budgetId, (updatedCategories) => {
          setCategories(updatedCategories);
          logger.debug('useBudgetData', 'Categories updated via listener', { budgetId, count: updatedCategories.length });
        });

        // Set up transactions listener
        logger.debug('useBudgetData', 'Setting up transactions listener', { budgetId, monthString });
        transactionsUnsubscribe = getTransactionsForMonth(
          budgetId, 
          monthString, 
          (updatedTransactions) => {
            setTransactions(updatedTransactions);
            logger.debug('useBudgetData', 'Transactions updated via listener', { 
              budgetId, 
              monthString, 
              count: updatedTransactions.length 
            });
          },
          (transactionError) => {
            logger.error('useBudgetData', 'Error in transactions listener', {
              error: transactionError.message,
              stack: transactionError.stack,
              budgetId,
              monthString
            });
            // We don't set the global error state here to avoid disrupting the rest of the data
            // Just log the error and let the hook continue with potentially partial data
          }
        );

        // Mark loading as complete once initial setup is done
        // The actual data will continue to flow in via the listeners
        setLoading(false);
      } catch (err) {
        logger.error('useBudgetData', 'Error setting up listeners', {
          error: err.message,
          stack: err.stack,
          budgetId,
          monthString
        });
        setError(err);
        setMonthlyData(null);
        setCategories([]);
        setTransactions([]); // Reset all data on error
        setLoading(false); // Make sure loading state is updated
      }
    };

    // Start setting up listeners
    setupListeners();

    // Cleanup function: Unsubscribe from all listeners when the hook unmounts
    // or when budgetId/monthString changes, triggering the effect again.
    return () => {
      if (monthlyDataUnsubscribe) {
        logger.debug('useBudgetData', 'Unsubscribing from monthly data listener', { budgetId, monthString });
        monthlyDataUnsubscribe();
      }
      if (categoriesUnsubscribe) {
        logger.debug('useBudgetData', 'Unsubscribing from categories listener', { budgetId });
        categoriesUnsubscribe();
      }
      if (transactionsUnsubscribe) {
        logger.debug('useBudgetData', 'Unsubscribing from transactions listener', { budgetId, monthString });
        transactionsUnsubscribe();
      }
    };
  }, [budgetId, monthString]); // Re-run effect if budgetId or monthString changes

  return { 
    monthlyData, 
    categories, 
    transactions, 
    categoryActivityMap, 
    monthlyRevenue, 
    monthlyRecurringSpending, 
    availableFunds, 
    totalAllocated, 
    remainingToAllocate, 
    totalSpent, 
    monthlySavings, 
    rolloverAmount, 
    isUsingServerCalculations, 
    loading, 
    error 
  };
}

export default useBudgetData; 