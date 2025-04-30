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
      
      console.log(">>> BUDGET CONTEXT DEBUG: Fetching budgets for user:", currentUser.uid);
      
      const budgets = await getUserBudgets(currentUser.uid);
      
      console.log(">>> BUDGET CONTEXT DEBUG: Budget fetch result:", {
        count: budgets?.length || 0,
        budgets: budgets?.map(b => ({ id: b.id, name: b.budgetName })) || []
      });
      
      setUserBudgets(budgets || []);
      
      // Auto-select first budget if available
      if (budgets && budgets.length > 0) {
        // Get the first budget document ID
        const firstBudgetId = budgets[0].id;
        
        // Verify that we're using a proper budget ID (not user ID)
        console.log(">>> BUDGET CONTEXT DEBUG: Auto-selecting budget:", {
          budgetId: firstBudgetId,
          budgetName: budgets[0].budgetName,
          isSameAsUserId: firstBudgetId === currentUser.uid
        });
        
        // WARNING if the budget ID is the same as the user ID
        if (firstBudgetId === currentUser.uid) {
          console.error(">>> BUDGET CONTEXT ERROR: Budget ID should not be the same as user ID. This suggests a data structure issue.");
        }
        
        // TODO: Improve selection logic - perhaps select most recently used 
        // or store the last selected budget in user settings
        logger.info('BudgetContext', 'fetchUserBudgets', 'Auto-selecting first budget', {
          selectedBudgetId: firstBudgetId,
          budgetName: budgets[0].budgetName
        });
        
        setSelectedBudgetId(firstBudgetId);
      } else {
        console.log(">>> BUDGET CONTEXT DEBUG: No budgets available to select");
        logger.info('BudgetContext', 'fetchUserBudgets', 'No budgets available to select');
        setSelectedBudgetId(null);
      }
    } catch (error) {
      console.error(">>> BUDGET CONTEXT ERROR: Failed to fetch user budgets:", error.message);
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
    // Debug logging
    console.log(">>> BUDGET CONTEXT DEBUG: Manually selecting budget:", budgetId);
    
    // Safety check - warn if selectedBudgetId looks like a userId
    if (currentUser && budgetId === currentUser.uid) {
      console.error(">>> BUDGET CONTEXT ERROR: Attempting to select a budget with ID matching current user ID!");
    }
    
    // TODO: Add validation to check if budgetId exists in userBudgets
    logger.info('BudgetContext', 'selectBudget', 'Manually selecting budget', { 
      selectedBudgetId: budgetId 
    });
    
    setSelectedBudgetId(budgetId);
    // TODO: Persist last selected budget ID to user settings
  }, [currentUser]);

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
      console.log(">>> BUDGET CONTEXT DEBUG: Creating new budget:", budgetData.name);
      
      logger.debug('BudgetContext', 'createBudgetAndUpdateContext', 'Creating new budget', {
        budgetName: budgetData.name,
        ownerUserId: ownerUser.uid
      });
      
      // Call the budget service to create the budget
      const newBudgetId = await createBudget(ownerUser, budgetData);
      
      console.log(">>> BUDGET CONTEXT DEBUG: Budget created successfully:", {
        budgetId: newBudgetId,
        budgetName: budgetData.name,
        isSameAsUserId: newBudgetId === currentUser.uid
      });
      
      // Verify we didn't get the userId instead of a proper budgetId
      if (newBudgetId === currentUser.uid) {
        console.error(">>> BUDGET CONTEXT ERROR: New budget ID is the same as user ID! This suggests an error in budget creation.");
      }
      
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
      console.error(">>> BUDGET CONTEXT ERROR: Failed to create budget:", error.message);
      
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
      console.log(">>> BUDGET CONTEXT DEBUG: User logged in, fetching budgets for:", currentUser.uid);
      
      logger.debug('BudgetContext', 'useEffect', 'User logged in, fetching budgets', {
        userId: currentUser.uid
      });
      fetchUserBudgets();
    } else {
      // Clear state on logout
      console.log(">>> BUDGET CONTEXT DEBUG: User logged out, clearing budget state");
      
      logger.debug('BudgetContext', 'useEffect', 'User logged out, clearing budget state');
      setUserBudgets([]);
      setSelectedBudgetId(null);
      setIsLoadingBudgets(false);
    }
  }, [currentUser, fetchUserBudgets]);

  // Debug current state
  useEffect(() => {
    console.log(">>> BUDGET CONTEXT DEBUG: Current context state:", {
      userBudgets: userBudgets.map(b => ({ id: b.id, name: b.budgetName })),
      selectedBudgetId,
      isLoadingBudgets,
      currentUserId: currentUser?.uid,
      isSameAsUserId: selectedBudgetId === currentUser?.uid
    });
  }, [selectedBudgetId, userBudgets, isLoadingBudgets, currentUser]);

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