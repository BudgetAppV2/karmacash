import { useState, useEffect } from 'react';
import { getMonthlyBudgetData } from '../services/firebase/budgetService'; // Adjust path as needed
import { getCategoriesListener } from '../services/firebase/categories'; // Adjust path as needed
import logger from '../services/logger'; // Assuming logger is available

/**
 * Custom hook to fetch budget data including monthly details and categories.
 * @param {string} budgetId - The ID of the budget to fetch data for.
 * @param {string} monthString - The month string in "YYYY-MM" format.
 * @returns {object} - { monthlyData, categories, loading, error }
 */
function useBudgetData(budgetId, monthString) {
  const [monthlyData, setMonthlyData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure budgetId and monthString are provided before fetching
    if (!budgetId || !monthString) {
      setLoading(false);
      setError(new Error("Budget ID and Month String are required."));
      setMonthlyData(null);
      setCategories([]);
      logger.warn('useBudgetData', 'Hook called without budgetId or monthString', { budgetId, monthString });
      return;
    }

    setLoading(true);
    setError(null);
    let categoriesUnsubscribe = null; // To store the listener unsubscribe function

    const fetchData = async () => {
      try {
        // Fetch monthly data once
        logger.debug('useBudgetData', 'Fetching monthly data', { budgetId, monthString });
        const fetchedMonthlyData = await getMonthlyBudgetData(budgetId, monthString);
        setMonthlyData(fetchedMonthlyData); // Can be null if not found
        logger.debug('useBudgetData', 'Monthly data fetched', { budgetId, monthString, dataExists: !!fetchedMonthlyData });

        // Set up categories listener
        logger.debug('useBudgetData', 'Setting up categories listener', { budgetId });
        categoriesUnsubscribe = getCategoriesListener(budgetId, (updatedCategories) => {
          setCategories(updatedCategories);
          logger.debug('useBudgetData', 'Categories updated via listener', { budgetId, count: updatedCategories.length });
          // setLoading(false); // Consider setting loading false only after initial listener call?
                                // Or after both initial fetch and first listener callback?
                                // For simplicity, setting it after both are initiated.
        });

      } catch (err) {
        logger.error('useBudgetData', 'Error fetching data or setting up listener', {
          error: err.message,
          stack: err.stack,
          budgetId,
          monthString
        });
        setError(err);
        setMonthlyData(null);
        setCategories([]);
      } finally {
        // Set loading to false after initial data fetch attempt and listener setup
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function: Unsubscribe from the categories listener when the hook unmounts
    // or when budgetId/monthString changes, triggering the effect again.
    return () => {
      if (categoriesUnsubscribe) {
        logger.debug('useBudgetData', 'Unsubscribing from categories listener', { budgetId });
        categoriesUnsubscribe();
      }
    };
  }, [budgetId, monthString]); // Re-run effect if budgetId or monthString changes

  return { monthlyData, categories, loading, error };
}

export default useBudgetData; 