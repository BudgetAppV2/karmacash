import { useState, useEffect } from 'react';
import { useBudgets } from '../contexts/BudgetContext';
import { getTransactionsInRange } from '../services/firebase/transactions';
import logger from '../services/logger';

/**
 * Custom hook to fetch transactions for a date range using the selected budget
 * 
 * @param {Date|string} startDate - Start date for the range
 * @param {Date|string} endDate - End date for the range
 * @param {Object} options - Optional parameters for the transaction query
 * @returns {Object} Object containing transactions array, loading state, and error
 */
export const useTransactions = (startDate, endDate, options = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedBudgetId } = useBudgets();

  useEffect(() => {
    // Return early if no budget is selected
    if (!selectedBudgetId) {
      setTransactions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        logger.debug('useTransactions', 'fetchTransactions', 'Fetching transactions for date range', { 
          budgetId: selectedBudgetId,
          startDate,
          endDate,
          options
        });
        
        // Convert string dates to Date objects if needed
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        
        // Adjust end date to include the entire day if it's a Date object
        const adjustedEnd = end instanceof Date ? 
          new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : 
          end;
        
        // Pass the selected budget ID to the service function
        const fetchedTransactions = await getTransactionsInRange(
          selectedBudgetId,
          start,
          adjustedEnd,
          options
        );
        
        logger.info('useTransactions', 'fetchTransactions', 'Transactions fetched successfully', {
          budgetId: selectedBudgetId,
          count: fetchedTransactions.length
        });
        
        setTransactions(fetchedTransactions);
      } catch (err) {
        logger.error('useTransactions', 'fetchTransactions', 'Failed to fetch transactions', {
          error: err.message,
          stack: err.stack,
          budgetId: selectedBudgetId
        });
        
        setError(err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [selectedBudgetId, startDate, endDate, options]);
  
  return { transactions, isLoading, error };
};

export default useTransactions; 