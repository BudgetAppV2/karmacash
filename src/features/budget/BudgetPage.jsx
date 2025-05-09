import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, parse, subMonths, addMonths } from 'date-fns';
import { frCA } from 'date-fns/locale';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { useBudgets } from '../../contexts/BudgetContext'; // Import useBudgets
import useBudgetData from '../../hooks/useBudgetData';
import { updateAllocation, callRecalculateBudget } from '../../services/firebase/budgetService'; // Import the new function
import BudgetHeader from './components/BudgetHeader';
import CategoryRow from './components/CategoryRow';
import styles from './BudgetPage.module.css';
import { debounce } from 'lodash'; // Or implement your own debounce function

function BudgetPage() {
  // Add this near the top of the component, outside other hooks
  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuth();
      if (auth.currentUser) {
        try {
          console.log("DIRECT TEST - User found, attempting to get token...");
          const token = await auth.currentUser.getIdToken(true); // Force refresh
          console.log("DIRECT TEST - Successfully got token:", token.substring(0, 20) + "...");
        } catch (error) {
          console.error("DIRECT TEST - Failed to get token:", error);
        }
      } else {
        console.log("DIRECT TEST - No current user in auth on mount");
      }
    };
    
    // Wait a moment for auth state to potentially settle after initial load
    const timer = setTimeout(checkAuth, 1000);
    return () => clearTimeout(timer); // Cleanup timer
  }, []); // Empty dependency array ensures it runs once on mount

  // Get selected budget ID and loading state from BudgetContext
  const { selectedBudgetId, isLoadingBudgets, selectedBudget } = useBudgets();
  const { currentUser, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading state

  // Use the selectedBudgetId from the context
  const budgetId = selectedBudgetId;
  
  // State to manage the currently displayed month (YYYY-MM format)
  const [currentMonthString, setCurrentMonthString] = useState(format(new Date(), 'yyyy-MM'));
  const [updateError, setUpdateError] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationError, setRecalculationError] = useState(null);
  const [calculationStatus, setCalculationStatus] = useState(null); // New state for visual feedback

  // Use a ref to store the debounced function to access its .cancel() method
  const debouncedTriggerRecalculationRef = useRef(null);

  // Pass the correct budgetId and monthString to the hook and get data
  const { 
    monthlyData, 
    categories, 
    categoryActivityMap, 
    availableFunds,
    totalAllocated,
    remainingToAllocate,
    totalSpent,
    monthlySavings,
    rolloverAmount,
    isUsingServerCalculations,
    loading: dataLoading, 
    error 
  } = useBudgetData(budgetId, currentMonthString);

  const triggerRecalculation = useCallback(async () => {
    console.log("Starting recalculation process...");
    if (isAuthLoading) {
      console.log("Auth is still loading, not triggering recalculation");
      return;
    }
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    console.log("Context currentUser:", currentUser ? currentUser.uid : "null");
    console.log("Firebase auth.currentUser:", firebaseUser ? firebaseUser.uid : "null");
    if (!firebaseUser) {
      console.log("No authenticated Firebase user found, not triggering recalculation");
      return;
    }
    if (!selectedBudgetId || !currentMonthString) {
      console.log("Skipping recalculation: Missing budgetId or monthString.");
      return; 
    }
    
    try {
      console.log("Getting ID token for user:", firebaseUser.uid);
      setIsRecalculating(true);
      setRecalculationError(null);
      
      const token = await firebaseUser.getIdToken(true);
      console.log("Obtained token of length:", token.length);
      console.log("Token preview for recalculation call:", `${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
      
      console.log("Calling recalculateBudget with token");
      const result = await callRecalculateBudget(selectedBudgetId, currentMonthString);
      console.log("Recalculation result:", result);
      setCalculationStatus('complete'); // Set to complete on success
      
    } catch (error) {
      console.error("Recalculation error:", error);
      setRecalculationError(error.message || "An error occurred during recalculation");
      setCalculationStatus('error'); // Set to error on failure
    } finally {
      setIsRecalculating(false);
      // Reset status after a short delay if it was complete or error
      setTimeout(() => {
        if (calculationStatus === 'complete' || calculationStatus === 'error') {
          setCalculationStatus(null);
        }
      }, 3000); // Reset after 3 seconds
    }
  }, [isAuthLoading, currentUser, selectedBudgetId, currentMonthString, callRecalculateBudget]);

  useEffect(() => {
    if (!isAuthLoading && currentUser && selectedBudgetId && currentMonthString) {
      console.log("Initial trigger conditions met, calling direct recalculation.")
      triggerRecalculation(); 
    } else {
      console.log("Conditions not met for triggering initial recalculation (isAuthLoading: " + isAuthLoading + ", currentUser: " + !!currentUser + ", budgetId: " + selectedBudgetId + ", month: " + currentMonthString + ")."); 
    }
  }, [isAuthLoading, currentUser, selectedBudgetId, currentMonthString, triggerRecalculation]);

  useEffect(() => {
    debouncedTriggerRecalculationRef.current = debounce(() => {
      if (typeof triggerRecalculation === 'function') {
        console.log("Calling debounced triggerRecalculation");
        triggerRecalculation();
      }
    }, 500); // Changed from 2000ms to 500ms

    return () => {
      if (debouncedTriggerRecalculationRef.current && 
          typeof debouncedTriggerRecalculationRef.current.cancel === 'function') {
        console.log("Cancelling pending debounced recalculation on cleanup.");
        debouncedTriggerRecalculationRef.current.cancel();
      }
    };
  }, [triggerRecalculation]);

  /**
   * Handle allocation change for a category
   * @param {string} categoryId - The ID of the category to update
   * @param {number} newAmount - The new allocation amount
   */
  const handleAllocationChange = async (categoryId, newAmount) => {
    setUpdateError(null);
    
    try {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      
      if (typeof newAmount !== 'number' || isNaN(newAmount) || newAmount < 0) {
        throw new Error('Amount must be a non-negative number');
      }
      
      console.log(`Updating allocation for category ${categoryId} to ${newAmount}`);
      
      await updateAllocation(budgetId, currentMonthString, categoryId, newAmount);
      
      console.log(`Successfully updated allocation for ${categoryId}`);
      
      setCalculationStatus('pending'); // Show a "Recalculating..." indicator

      if (debouncedTriggerRecalculationRef.current && 
          typeof debouncedTriggerRecalculationRef.current === 'function') {
        debouncedTriggerRecalculationRef.current();
      } else {
        console.warn("debouncedTriggerRecalculationRef.current is not a function.");
      }
      
    } catch (error) {
      console.error('Failed to update allocation:', error);
      setUpdateError(error.message);
    }
  };

  /**
   * Handles navigating to the previous month.
   */
  const handlePreviousMonth = () => {
    try {
      // Parse the current month string into a Date object
      const currentDateObj = parse(currentMonthString, 'yyyy-MM', new Date());
      // Calculate the previous month
      const previousMonthDate = subMonths(currentDateObj, 1);
      // Format the new date back to YYYY-MM string
      const previousMonthString = format(previousMonthDate, 'yyyy-MM');
      
      console.log('Navigating to previous month:', previousMonthString);
      setCurrentMonthString(previousMonthString);
    } catch (e) {
      console.error('Error navigating to previous month:', e);
      // Handle error (e.g., show a message)
    }
  };

  /**
   * Handles navigating to the next month.
   */
  const handleNextMonth = () => {
    try {
      // Parse the current month string into a Date object
      const currentDateObj = parse(currentMonthString, 'yyyy-MM', new Date());
      // Calculate the next month
      const nextMonthDate = addMonths(currentDateObj, 1);
      // Format the new date back to YYYY-MM string
      const nextMonthString = format(nextMonthDate, 'yyyy-MM');
      
      console.log('Navigating to next month:', nextMonthString);
      setCurrentMonthString(nextMonthString);
    } catch (e) {
      console.error('Error navigating to next month:', e);
      // Handle error (e.g., show a message)
    }
  };

  // Format month string for display (This is now done in BudgetHeader)
  // let displayMonth = 'Mois actuel';
  // if (monthString) {
  //   try {
  //       displayMonth = format(parseISO(monthString + '-01'), 'MMMM yyyy', { locale: frCA });
  //   } catch (e) {
  //       console.error("Error formatting month string:", e); 
  //   }
  // }
  
  // Get budget name from the selectedBudget object provided by BudgetContext
  const budgetName = selectedBudget?.budgetName || "Mon Budget"; // Use selectedBudget from context

  // Handle loading state from BudgetContext (and potentially AuthContext if still needed)
  if (isLoadingBudgets) { // Primarily check if budgets are loading/selecting
    return <div className={styles.pageContainer}>Chargement des budgets...</div>;
  }

  // Handle case where no budget is selected
  if (!budgetId) {
    // Provide a more informative message if there are budgets but none selected vs no budgets at all
    // (Requires access to userBudgets from useBudgets, not shown here for brevity)
    return <div className={styles.pageContainer}>Sélectionnez ou créez un budget pour commencer.</div>;
  }

  // Handle loading state for the specific budget's data (categories, monthlyData)
  if (dataLoading) {
    return (
        <div className={styles.pageContainer}>
          {/* Display header even while loading details for context */}
          <BudgetHeader 
            budgetName={budgetName} 
            currentMonthString={currentMonthString} // Pass month string to header
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            availableFunds={availableFunds}
            totalAllocated={totalAllocated}
            remainingToAllocate={remainingToAllocate}
            totalSpent={totalSpent}
            monthlySavings={monthlySavings}
            rolloverAmount={rolloverAmount}
            isUsingServerCalculations={isUsingServerCalculations}
          />
          <p>Chargement des données du budget...</p>
        </div>
      );
  }

  // Handle error state from data fetching hook
  if (error) {
    return (
        <div className={styles.pageContainer}>
          <BudgetHeader 
            budgetName={budgetName} 
            currentMonthString={currentMonthString} // Pass month string to header
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            availableFunds={availableFunds}
            totalAllocated={totalAllocated}
            remainingToAllocate={remainingToAllocate}
            totalSpent={totalSpent}
            monthlySavings={monthlySavings}
            rolloverAmount={rolloverAmount}
            isUsingServerCalculations={isUsingServerCalculations}
          />
         <div className={styles.error}>Erreur lors du chargement des données: {error.message}</div>
        </div>
      );
  }

  // Main content rendering
  return (
    <div className={styles.pageContainer}>
      <BudgetHeader 
        budgetName={budgetName} 
        currentMonthString={currentMonthString} // Pass the current month string
        onPreviousMonth={handlePreviousMonth} // Pass the handler
        onNextMonth={handleNextMonth} // Pass the handler
        availableFunds={availableFunds}
        totalAllocated={totalAllocated}
        remainingToAllocate={remainingToAllocate}
        totalSpent={totalSpent}
        monthlySavings={monthlySavings}
        rolloverAmount={rolloverAmount}
        isUsingServerCalculations={isUsingServerCalculations}
        isRecalculating={isRecalculating} // Pass loading state
      />

      {/* Visual feedback for calculation status */}
      {calculationStatus === 'pending' && (
        <div className={styles.recalculatingIndicatorContainer}>
          <small className={styles.recalculatingIndicator}>Recalcul en cours...</small>
        </div>
      )}

      {updateError && (
        <div className={styles.error}>
          Erreur lors de la mise à jour: {updateError}
        </div>
      )}
      {recalculationError && (
        <div className={`${styles.error} ${styles.recalcError}`}> {/* Optional: different styling */}
          Erreur de recalcul: {recalculationError}
        </div>
      )}

      <div className={styles.categoryListContainer}>
        {/* Column Headers - Could be extracted to a component */}
        <div className={styles.categoryHeaderRow}>
          <div className={styles.categoryName}>Catégorie</div>
          <div className={styles.amountCell}>Alloué</div>
          <div className={styles.amountCell}>Activité</div>
          <div className={styles.amountCell}>Disponible</div>
        </div>

        {categories && categories.length > 0 ? (
          categories.map((category) => {
            // Get the allocated amount for this category (default to 0 if not found)
            const allocatedAmount = monthlyData?.allocations?.[category.id] ?? 0;
            
            // Get the activity amount from categoryActivityMap (default to 0 if no transactions)
            const activityAmount = categoryActivityMap?.[category.id] ?? 0;
            
            // Calculate available amount (allocated + activity)
            // Since activity is already signed (negative for expenses, positive for income),
            // adding it to the allocated amount correctly reduces the available amount for expenses
            // and increases it for income categories that receive money
            const availableAmount = allocatedAmount + activityAmount;
            
            return (
              <CategoryRow 
                key={category.id}
                categoryId={category.id} // Pass categoryId as prop
                categoryName={category.name}
                allocatedAmount={allocatedAmount}
                activityAmount={activityAmount}
                availableAmount={availableAmount}
                onAllocationChange={handleAllocationChange} // Pass the handler function
              />
            );
          })
        ) : (
          monthlyData ? 
          <p>Aucune allocation définie pour ce mois. Commencez à budgéter !</p> : 
          <p>Aucune catégorie trouvée pour ce budget ou données mensuelles non disponibles.</p>
        )}
      </div>
    </div>
  );
}

export default BudgetPage;