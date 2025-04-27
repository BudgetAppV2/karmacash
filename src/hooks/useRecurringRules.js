import { useState, useEffect } from 'react';
import { useBudgets } from '../contexts/BudgetContext';
import { getRecurringRules } from '../services/firebase/recurringRules';
import logger from '../services/logger';

/**
 * Custom hook to fetch recurring rules for the selected budget
 * 
 * @returns {Object} Object containing recurring rules array, loading state, and error
 */
export const useRecurringRules = () => {
  const [recurringRules, setRecurringRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedBudgetId } = useBudgets();

  useEffect(() => {
    // Return early if no budget is selected
    if (!selectedBudgetId) {
      setRecurringRules([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchRecurringRules = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        logger.debug('useRecurringRules', 'fetchRecurringRules', 'Fetching recurring rules', { 
          budgetId: selectedBudgetId
        });
        
        // Pass the selected budget ID to the service function
        const fetchedRules = await getRecurringRules(selectedBudgetId);
        
        logger.info('useRecurringRules', 'fetchRecurringRules', 'Recurring rules fetched successfully', {
          budgetId: selectedBudgetId,
          count: fetchedRules.length
        });
        
        setRecurringRules(fetchedRules);
      } catch (err) {
        logger.error('useRecurringRules', 'fetchRecurringRules', 'Failed to fetch recurring rules', {
          error: err.message,
          stack: err.stack,
          budgetId: selectedBudgetId
        });
        
        setError(err);
        setRecurringRules([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecurringRules();
  }, [selectedBudgetId]);
  
  return { recurringRules, isLoading, error };
};

export default useRecurringRules; 