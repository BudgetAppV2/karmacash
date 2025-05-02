import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { frCA } from 'date-fns/locale';
// import { useAuth } from '../../contexts/AuthContext'; // Keep if currentUser needed for other things, remove otherwise
import { useBudgets } from '../../contexts/BudgetContext'; // Import useBudgets
import useBudgetData from '../../hooks/useBudgetData';
import BudgetHeader from './components/BudgetHeader';
import CategoryRow from './components/CategoryRow';
import styles from './BudgetPage.module.css';

function BudgetPage() {
  // Get selected budget ID and loading state from BudgetContext
  const { selectedBudgetId, isLoadingBudgets, selectedBudget } = useBudgets();
  // const { currentUser, isLoading: authLoading } = useAuth(); // Remove or keep based on need

  // Use the selectedBudgetId from the context
  const budgetId = selectedBudgetId;
  
  // TODO: Add UI controls to change the month
  const [monthString, setMonthString] = useState(format(new Date(), 'yyyy-MM'));

  // Pass the correct budgetId to the hook
  const { monthlyData, categories, loading: dataLoading, error } = useBudgetData(budgetId, monthString);

  // Format month string for display
  let displayMonth = 'Mois actuel';
  if (monthString) {
    try {
        displayMonth = format(parseISO(monthString + '-01'), 'MMMM yyyy', { locale: frCA });
    } catch (e) {
        console.error("Error formatting month string:", e); 
    }
  }
  
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
          <BudgetHeader 
            budgetName={budgetName} // Display name even while loading details
            currentMonthString={displayMonth}
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
            currentMonthString={displayMonth}
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
        currentMonthString={displayMonth}
      />

      <div className={styles.categoryListContainer}>
        {/* TODO: Add headers for category columns */} 
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <CategoryRow 
              key={category.id}
              categoryName={category.name}
              allocatedAmount={monthlyData?.allocations?.[category.id] ?? 0}
            />
          ))
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