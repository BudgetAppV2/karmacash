import React, { useState } from 'react';
import { format, parseISO, parse, subMonths, addMonths } from 'date-fns';
import { frCA } from 'date-fns/locale';
// import { useAuth } from '../../contexts/AuthContext'; // Keep if currentUser needed for other things, remove otherwise
import { useBudgets } from '../../contexts/BudgetContext'; // Import useBudgets
import useBudgetData from '../../hooks/useBudgetData';
import { updateAllocation } from '../../services/firebase/budgetService'; // Import the new function
import BudgetHeader from './components/BudgetHeader';
import CategoryRow from './components/CategoryRow';
import styles from './BudgetPage.module.css';

function BudgetPage() {
  // Get selected budget ID and loading state from BudgetContext
  const { selectedBudgetId, isLoadingBudgets, selectedBudget } = useBudgets();
  // const { currentUser, isLoading: authLoading } = useAuth(); // Remove or keep based on need

  // Use the selectedBudgetId from the context
  const budgetId = selectedBudgetId;
  
  // State to manage the currently displayed month (YYYY-MM format)
  const [currentMonthString, setCurrentMonthString] = useState(format(new Date(), 'yyyy-MM'));
  const [updateError, setUpdateError] = useState(null);

  // Pass the correct budgetId and monthString to the hook and get data
  const { 
    monthlyData, 
    categories, 
    categoryActivityMap, 
    availableFunds,
    totalAllocated,
    remainingToAllocate,
    loading: dataLoading, 
    error 
  } = useBudgetData(budgetId, currentMonthString);

  /**
   * Handle allocation change for a category
   * @param {string} categoryId - The ID of the category to update
   * @param {number} newAmount - The new allocation amount
   */
  const handleAllocationChange = async (categoryId, newAmount) => {
    // Clear any previous errors
    setUpdateError(null);
    
    try {
      // Validate inputs
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      
      if (typeof newAmount !== 'number' || isNaN(newAmount) || newAmount < 0) {
        throw new Error('Amount must be a non-negative number');
      }
      
      console.log(`Updating allocation for category ${categoryId} to ${newAmount}`);
      
      // Call the service function to update the allocation in Firestore
      await updateAllocation(budgetId, currentMonthString, categoryId, newAmount);
      
      // No need to update local state as real-time listener will handle the update
      console.log(`Successfully updated allocation for ${categoryId}`);
    } catch (error) {
      console.error('Failed to update allocation:', error);
      setUpdateError(error.message);
      
      // Could show a toast notification here if available in the UI
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
      />

      {updateError && (
        <div className={styles.error}>
          Erreur lors de la mise à jour: {updateError}
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