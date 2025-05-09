import { useState, useEffect, useMemo } from 'react';
import { getMonthlyBudgetData } from '../services/firebase/budgetService'; // Adjust path as needed
import { getCategoriesListener } from '../services/firebase/categories'; // Adjust path as needed
import { getTransactionsForMonth } from '../services/firebase/transactions'; // Import new function
import logger from '../services/logger'; // Assuming logger is available

/**
 * Custom hook to fetch budget data including monthly details, categories, transactions, and category activity.
 * @param {string} budgetId - The ID of the budget to fetch data for.
 * @param {string} monthString - The month string in "YYYY-MM" format.
 * @returns {object} - { monthlyData, categories, transactions, categoryActivityMap, monthlyRevenue, monthlyRecurringSpending, availableFunds, totalAllocated, remainingToAllocate, totalSpent, monthlySavings, rolloverAmount, isUsingServerCalculations, loading, error }
 */
function useBudgetData(budgetId, monthString) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); // New state for transactions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Client-side calculation logic (to be used as fallback) ---
  const clientCalculatedMonthlyRevenue = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const clientCalculatedMonthlyRecurringSpending = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'expense' && tx.isRecurringInstance === true).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  // Note: Full rollover logic (B6.1 - 3.3) is complex and server-side is preferred.
  // Client-side placeholder for rollover will be 0 if server data not present.
  const clientCalculatedRolloverAmount = 0; 

  const clientCalculatedAvailableFunds = useMemo(() => {
    return clientCalculatedMonthlyRevenue - clientCalculatedMonthlyRecurringSpending + clientCalculatedRolloverAmount;
  }, [clientCalculatedMonthlyRevenue, clientCalculatedMonthlyRecurringSpending, clientCalculatedRolloverAmount]);

  const clientCalculatedTotalAllocated = useMemo(() => {
    if (!monthlyData || !monthlyData.allocations) return 0;
    return Object.values(monthlyData.allocations).reduce((sum, allocation) => sum + (allocation || 0), 0);
  }, [monthlyData]);

  const clientCalculatedRemainingToAllocate = useMemo(() => {
    return clientCalculatedAvailableFunds - clientCalculatedTotalAllocated;
  }, [clientCalculatedAvailableFunds, clientCalculatedTotalAllocated]);
  
  // Client-side totalSpent (B6.1 - 3.8)
  const clientCalculatedTotalSpent = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  }, [transactions]);

  // Client-side monthlySavings (B6.1 - 3.9)
  const clientCalculatedMonthlySavings = useMemo(() => {
    return clientCalculatedMonthlyRevenue - clientCalculatedTotalSpent;
  }, [clientCalculatedMonthlyRevenue, clientCalculatedTotalSpent]);

  // --- End of client-side calculation logic ---

  // Calculate category activity map using transactions
  // This is the sum of all transaction amounts (which are already signed) for each category
  const categoryActivityMap = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {};
    }

    logger.debug('useBudgetData', 'Calculating category activity map', { 
      transactionCount: transactions.length 
    });
    
    const activityMap = {};
    
    transactions.forEach(transaction => {
      // Skip transactions without a valid categoryId or amount
      if (!transaction.categoryId || typeof transaction.amount !== 'number') {
        logger.warn('useBudgetData', 'Invalid transaction data for activity calculation', {
          transactionId: transaction.id,
          categoryId: transaction.categoryId,
          amount: transaction.amount
        });
        return; // Skip this transaction
      }
      
      // Initialize category in the map if it doesn't exist yet
      if (!activityMap[transaction.categoryId]) {
        activityMap[transaction.categoryId] = 0;
      }
      
      // Sum the transaction amount (already properly signed as per B5.2)
      activityMap[transaction.categoryId] += transaction.amount;
    });
    
    logger.debug('useBudgetData', 'Category activity map calculated', { 
      categoryCount: Object.keys(activityMap).length 
    });
    
    return activityMap;
  }, [transactions]);

  // --- Determine final values, preferring server-calculated data --- 
  const serverCalculated = monthlyData?.calculated;
  const isUsingServerCalculations = !!serverCalculated;

  const monthlyRevenue = isUsingServerCalculations ? (serverCalculated.revenue ?? clientCalculatedMonthlyRevenue) : clientCalculatedMonthlyRevenue;
  const monthlyRecurringSpending = isUsingServerCalculations ? (serverCalculated.recurringExpenses ?? clientCalculatedMonthlyRecurringSpending) : clientCalculatedMonthlyRecurringSpending;
  // Rollover primarily comes from server; client fallback is 0 as defined above.
  const rolloverAmount = isUsingServerCalculations ? (serverCalculated.rolloverFromPrevious ?? clientCalculatedRolloverAmount) : clientCalculatedRolloverAmount;
  const availableFunds = isUsingServerCalculations ? (serverCalculated.availableToAllocate ?? clientCalculatedAvailableFunds) : clientCalculatedAvailableFunds;
  const totalAllocated = isUsingServerCalculations ? (serverCalculated.totalAllocated ?? clientCalculatedTotalAllocated) : clientCalculatedTotalAllocated;
  const remainingToAllocate = isUsingServerCalculations ? (serverCalculated.remainingToAllocate ?? clientCalculatedRemainingToAllocate) : clientCalculatedRemainingToAllocate;
  const totalSpent = isUsingServerCalculations ? (serverCalculated.totalSpent ?? clientCalculatedTotalSpent) : clientCalculatedTotalSpent;
  const monthlySavings = isUsingServerCalculations ? (serverCalculated.monthlySavings ?? clientCalculatedMonthlySavings) : clientCalculatedMonthlySavings;

  // Logging the source of calculations
  useEffect(() => {
    if (budgetId && monthString) {
      if (isUsingServerCalculations) {
        logger.debug('useBudgetData', 'Using SERVER-calculated budget figures', { budgetId, monthString, serverCalculated });
      } else if (monthlyData) { // monthlyData exists but monthlyData.calculated doesn't
        logger.debug('useBudgetData', 'Using CLIENT-calculated budget figures (server data not available or incomplete)', { budgetId, monthString });
      }
      // If monthlyData is null, initial loading or error state handled by `loading` and `error` flags.
    }
  }, [monthlyData, isUsingServerCalculations, budgetId, monthString]); // Add relevant dependencies

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