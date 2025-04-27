import { useState, useEffect } from 'react';
import { useBudgets } from '../contexts/BudgetContext';
import { getCategories } from '../services/firebase/categories';
import logger from '../services/logger';

/**
 * Custom hook to fetch categories for the selected budget
 * 
 * @returns {Object} Object containing categories array, loading state, and error
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedBudgetId } = useBudgets();

  useEffect(() => {
    // Return early if no budget is selected
    if (!selectedBudgetId) {
      setCategories([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        logger.debug('useCategories', 'fetchCategories', 'Fetching categories', { 
          budgetId: selectedBudgetId
        });
        
        // Pass the selected budget ID to the service function
        const fetchedCategories = await getCategories(selectedBudgetId);
        
        logger.info('useCategories', 'fetchCategories', 'Categories fetched successfully', {
          budgetId: selectedBudgetId,
          count: fetchedCategories.length
        });
        
        setCategories(fetchedCategories);
      } catch (err) {
        logger.error('useCategories', 'fetchCategories', 'Failed to fetch categories', {
          error: err.message,
          stack: err.stack,
          budgetId: selectedBudgetId
        });
        
        setError(err);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [selectedBudgetId]);
  
  return { categories, isLoading, error };
};

export default useCategories; 