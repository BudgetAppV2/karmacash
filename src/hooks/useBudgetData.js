import { useState, useEffect, useMemo } from 'react';
import { getMonthlyBudgetData } from '../services/firebase/budgetService'; // Adjust path as needed
import { getCategoriesListener } from '../services/firebase/categories'; // Adjust path as needed
import { getTransactionsForMonth } from '../services/firebase/transactions'; // Import new function
import logger from '../services/logger'; // Assuming logger is available

/**
 * Custom hook to fetch budget data including monthly details, categories, transactions, and category activity.
 * @param {string} budgetId - The ID of the budget to fetch data for.
 * @param {string} monthString - The month string in "YYYY-MM" format.
 * @returns {object} - { monthlyData, categories, transactions, categoryActivityMap, monthlyRevenue, monthlyRecurringSpending, availableFunds, totalAllocated, remainingToAllocate, loading, error }
 */
function useBudgetData(budgetId, monthString) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); // New state for transactions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Calculate ZBB figures based on B6.1
  // A. Calculate monthlyRevenue (B6.1 - 3.1)
  const monthlyRevenue = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return 0;
    }
    const incomeTransactions = transactions.filter(tx => tx.type === 'income');
    const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    logger.debug('useBudgetData', 'Monthly Revenue calculated', { totalIncome });
    return totalIncome;
  }, [transactions]);

  // B. Calculate monthlyRecurringExpenses_absolute_sum (B6.1 - 3.2)
  // Assuming isRecurringInstance flag is present on transactions as per M3.
  const monthlyRecurringSpending = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return 0;
    }
    const recurringExpenseTransactions = transactions.filter(
      tx => tx.type === 'expense' && tx.isRecurringInstance === true
    );
    // Sum the absolute values as per B6.1 formula interpretation
    const totalRecurringExpense = recurringExpenseTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );
    logger.debug('useBudgetData', 'Monthly Recurring Spending calculated (absolute sum)', { totalRecurringExpense });
    return totalRecurringExpense;
  }, [transactions]);

  // C. Define rolloverAmount_placeholder (B6.1 - 3.3 simplified)
  const rolloverAmount_placeholder = 0; // Full rollover logic deferred

  // D. Calculate availableFunds (B6.1 - 3.4)
  // Formula: MonthlyRevenue - MonthlyRecurringExpenses + RolloverAmount
  const availableFunds = useMemo(() => {
    const funds = monthlyRevenue - monthlyRecurringSpending + rolloverAmount_placeholder;
     logger.debug('useBudgetData', 'Available Funds calculated', { funds, monthlyRevenue, monthlyRecurringSpending, rolloverAmount_placeholder });
    return funds;
  }, [monthlyRevenue, monthlyRecurringSpending, rolloverAmount_placeholder]);

  // E. Calculate totalAllocated (B6.1 - 3.5)
  const totalAllocated = useMemo(() => {
    if (!monthlyData || !monthlyData.allocations) {
      return 0;
    }
    const allocations = monthlyData.allocations;
    const total = Object.values(allocations).reduce((sum, allocation) => sum + allocation, 0);
    logger.debug('useBudgetData', 'Total Allocated calculated', { total });
    return total;
  }, [monthlyData]); // Dependency on monthlyData to react to allocation changes

  // F. Calculate remainingToAllocate (B6.1 - 3.6)
  const remainingToAllocate = useMemo(() => {
    const remaining = availableFunds - totalAllocated;
    logger.debug('useBudgetData', 'Remaining to Allocate calculated', { remaining, availableFunds, totalAllocated });
    return remaining;
  }, [availableFunds, totalAllocated]);

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
    loading, 
    error 
  };
}

export default useBudgetData; 