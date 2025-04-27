import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getUserBudgets } from '../services/firebase/userService';
import { createBudget } from '../services/firebase/budgetService';
import { useAuth } from './AuthContext';
import logger from '../services/logger';

// Create the context
const BudgetContext = createContext();

// Custom hook to use the budget context
export const useBudgets = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
  // State management
  const [userBudgets, setUserBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  
  // Get the current user from AuthContext
  const { currentUser } = useAuth();

  // Function to fetch user's budgets
  const fetchUserBudgets = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingBudgets(false);
      return;
    }
    
    setIsLoadingBudgets(true);
    
    try {
      logger.debug('BudgetContext', 'fetchUserBudgets', 'Fetching budgets for user', { 
        userId: currentUser.uid 
      });
      
      const budgets = await getUserBudgets(currentUser.uid);
      setUserBudgets(budgets || []);
      
      // Auto-select first budget if available
      if (budgets && budgets.length > 0) {
        // TODO: Improve selection logic - perhaps select most recently used 
        // or store the last selected budget in user settings
        logger.info('BudgetContext', 'fetchUserBudgets', 'Auto-selecting first budget', {
          selectedBudgetId: budgets[0].id,
          budgetName: budgets[0].budgetName
        });
        setSelectedBudgetId(budgets[0].id);
      } else {
        logger.info('BudgetContext', 'fetchUserBudgets', 'No budgets available to select');
        setSelectedBudgetId(null);
      }
    } catch (error) {
      logger.error('BudgetContext', 'fetchUserBudgets', 'Error fetching user budgets', {
        error: error.message,
        stack: error.stack,
        userId: currentUser?.uid
      });
      setUserBudgets([]);
      setSelectedBudgetId(null);
      // TODO: Add user-facing error handling (e.g., toast)
    } finally {
      setIsLoadingBudgets(false);
    }
  }, [currentUser]);

  // Function to manually select a budget
  const selectBudget = useCallback((budgetId) => {
    // TODO: Add validation to check if budgetId exists in userBudgets
    logger.info('BudgetContext', 'selectBudget', 'Manually selecting budget', { 
      selectedBudgetId: budgetId 
    });
    
    setSelectedBudgetId(budgetId);
    // TODO: Persist last selected budget ID to user settings
  }, []);

  // Function to create a new budget and update the context
  const createBudgetAndUpdateContext = useCallback(async (budgetData) => {
    if (!currentUser) {
      logger.error('BudgetContext', 'createBudgetAndUpdateContext', 'User not authenticated');
      throw new Error("User not authenticated");
    }
    
    // Prepare owner user details from currentUser
    const ownerUser = { 
      uid: currentUser.uid, 
      displayName: currentUser.displayName || '', 
      email: currentUser.email || ''
    };
    
    try {
      logger.debug('BudgetContext', 'createBudgetAndUpdateContext', 'Creating new budget', {
        budgetName: budgetData.name,
        ownerUserId: ownerUser.uid
      });
      
      // Call the budget service to create the budget
      const newBudgetId = await createBudget(ownerUser, budgetData);
      
      logger.info('BudgetContext', 'createBudgetAndUpdateContext', 'Budget created successfully', {
        budgetId: newBudgetId,
        budgetName: budgetData.name
      });
      
      // Re-fetch the user's budgets to include the new one
      await fetchUserBudgets();
      
      // Automatically select the newly created budget
      selectBudget(newBudgetId);
      
      return newBudgetId;
    } catch (error) {
      logger.error('BudgetContext', 'createBudgetAndUpdateContext', 'Failed to create budget', {
        error: error.message,
        stack: error.stack,
        budgetName: budgetData.name
      });
      
      // TODO: Add user-facing error handling
      throw error; // Re-throw for form handling
    }
  }, [currentUser, fetchUserBudgets, selectBudget]);

  // Fetch budgets when the user logs in
  useEffect(() => {
    if (currentUser) {
      logger.debug('BudgetContext', 'useEffect', 'User logged in, fetching budgets', {
        userId: currentUser.uid
      });
      fetchUserBudgets();
    } else {
      // Clear state on logout
      logger.debug('BudgetContext', 'useEffect', 'User logged out, clearing budget state');
      setUserBudgets([]);
      setSelectedBudgetId(null);
      setIsLoadingBudgets(false);
    }
  }, [currentUser, fetchUserBudgets]);

  const contextValue = {
    // State
    userBudgets,
    selectedBudgetId,
    isLoadingBudgets,
    
    // Selected budget data (convenience accessor)
    selectedBudget: selectedBudgetId 
      ? userBudgets.find(budget => budget.id === selectedBudgetId) 
      : null,
    
    // Functions
    fetchUserBudgets,
    selectBudget,
    createBudgetAndUpdateContext,
    
    // Helper computed properties
    hasBudgets: userBudgets.length > 0
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
};

export default BudgetProvider; 