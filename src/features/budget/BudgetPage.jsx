import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parse, parseISO, subMonths, addMonths } from 'date-fns';
import { frCA } from 'date-fns/locale';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useBudgets } from '../../contexts/BudgetContext';
import useBudgetData from '../../hooks/useBudgetData';
import { updateAllocation, callRecalculateBudget } from '../../services/firebase/budgetService';
import { debounce } from 'lodash';
import styles from './BudgetPage.module.css'; // Styles will be completely revamped
import { formatCurrency } from '../../utils/formatters'; 
import CategoryProgressDisplay from '../../components/budget/CategoryProgressDisplay';

// Icons (assuming you have an icon library or SVGs)
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


function BudgetPage() {
  const { selectedBudgetId, isLoadingBudgets, selectedBudget } = useBudgets();
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const budgetId = selectedBudgetId;
  
  const [currentMonthString, setCurrentMonthString] = useState(format(new Date(), 'yyyy-MM'));
  const [updateError, setUpdateError] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationError, setRecalculationError] = useState(null);
  const [calculationStatus, setCalculationStatus] = useState(null); // 'pending', 'complete', 'error'
  const [editingAllocation, setEditingAllocation] = useState({}); // { categoryId: newAmountStr }

  const debouncedTriggerRecalculationRef = useRef(null);

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
    error: dataError // Renamed to avoid conflict with updateError/recalculationError
  } = useBudgetData(budgetId, currentMonthString);

  const triggerRecalculation = useCallback(async () => {
    if (isAuthLoading || !currentUser || !selectedBudgetId || !currentMonthString) {
      console.log("Skipping recalculation: Auth/User/Budget/Month not ready.");
      return; 
    }
    
    setIsRecalculating(true);
    setRecalculationError(null);
    setCalculationStatus('pending');
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      await callRecalculateBudget(selectedBudgetId, currentMonthString); // Token is now handled by the service call via Functions context
      setCalculationStatus('complete');
    } catch (error) {
      console.error("Recalculation error:", error);
      setRecalculationError(error.message || "An error occurred during recalculation");
      setCalculationStatus('error');
    } finally {
      setIsRecalculating(false);
      setTimeout(() => {
        if (calculationStatus === 'complete' || calculationStatus === 'error') {
          setCalculationStatus(null);
        }
      }, 3000);
    }
  }, [isAuthLoading, currentUser, selectedBudgetId, currentMonthString, calculationStatus]); // Added calculationStatus to deps

  useEffect(() => {
    if (!isAuthLoading && currentUser && selectedBudgetId && currentMonthString) {
      triggerRecalculation(); 
    }
  }, [isAuthLoading, currentUser, selectedBudgetId, currentMonthString]); // Removed triggerRecalculation from here to avoid loop on its own change

   useEffect(() => {
    debouncedTriggerRecalculationRef.current = debounce(() => {
      if (typeof triggerRecalculation === 'function') {
        triggerRecalculation();
      }
    }, 1000); // Debounce time for recalculation after allocation change

    return () => {
      if (debouncedTriggerRecalculationRef.current && 
          typeof debouncedTriggerRecalculationRef.current.cancel === 'function') {
        debouncedTriggerRecalculationRef.current.cancel();
      }
    };
  }, [triggerRecalculation]);


  const handleAllocationChange = async (categoryId, newAmountStr) => {
    const newAmount = parseFloat(newAmountStr);
    if (!categoryId || typeof newAmount !== 'number' || isNaN(newAmount) || newAmount < 0) {
      setUpdateError('Montant invalide.');
      setEditingAllocation(prev => ({...prev, [categoryId]: newAmountStr})); // keep invalid input for correction
      return;
    }
    setUpdateError(null);
    setEditingAllocation(prev => ({...prev, [categoryId]: undefined })); // Clear editing state for this category

    try {
      await updateAllocation(budgetId, currentMonthString, categoryId, newAmount);
      if (debouncedTriggerRecalculationRef.current) {
        debouncedTriggerRecalculationRef.current();
      }
    } catch (error) {
      console.error('Failed to update allocation:', error);
      setUpdateError(error.message);
    }
  };
  
  const handleAllocationInputChange = (categoryId, value) => {
    setEditingAllocation(prev => ({...prev, [categoryId]: value}));
  };

  const navigateMonth = (direction) => {
    try {
      const currentDateObj = parse(currentMonthString, 'yyyy-MM', new Date());
      const newDate = direction === 'prev' ? subMonths(currentDateObj, 1) : addMonths(currentDateObj, 1);
      setCurrentMonthString(format(newDate, 'yyyy-MM'));
    } catch (e) {
      console.error('Error navigating month:', e);
    }
  };

  const budgetName = selectedBudget?.budgetName || "Mon Budget";
  let displayMonth = currentMonthString;
  try {
    displayMonth = format(parse(currentMonthString, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: frCA });
  } catch (e) { console.error("Error formatting month string:", e); }


  if (isLoadingBudgets) {
    return <div className={styles.loadingContainer} role="status" aria-live="polite">Chargement des budgets...</div>;
  }
  if (!budgetId) {
    return (
      <div className={`${styles.emptyState} ${styles.budgetPage}`}>
        <InfoIcon />
        <h2 className={styles.emptyStateTitle}>Aucun Budget Sélectionné</h2>
        <p className={styles.emptyStateText}>Veuillez sélectionner un budget ou en créer un nouveau pour commencer.</p>
        {/* Add a button to navigate to budget creation/selection if applicable */}
      </div>
    );
  }
  if (dataLoading && !monthlyData) { // Show loading only if no data is yet available
    return <div className={styles.loadingContainer} role="status" aria-live="polite">Chargement des données du budget pour {displayMonth}...</div>;
  }
  if (dataError) {
    return (
      <div className={`${styles.errorDisplay} ${styles.budgetPage}`} role="alert">
        <h3>Erreur de Chargement des Données</h3>
        <p>{dataError.message}</p>
        <p>Essayez de rafraîchir ou de sélectionner un autre mois.</p>
      </div>
    );
  }
  
  // Determine status for "Remaining to Allocate"
  let remainingStatusStyle = styles.remainingZero;
  if (remainingToAllocate > 0.009) remainingStatusStyle = styles.remainingPositive;
  else if (remainingToAllocate < -0.009) remainingStatusStyle = styles.remainingNegative;

  return (
    <div className={styles.budgetPage}>
      <header className={styles.header}>
        <h1 className={styles.budgetName}>{budgetName}</h1>
        <div className={styles.monthNavigation}>
          <button onClick={() => navigateMonth('prev')} className={styles.navButton} aria-label="Mois précédent">
            <ChevronLeftIcon />
          </button>
          <span className={styles.currentMonthDisplay} aria-live="polite" aria-atomic="true">{displayMonth}</span>
          <button onClick={() => navigateMonth('next')} className={styles.navButton} aria-label="Mois suivant">
            <ChevronRightIcon />
          </button>
        </div>
      </header>

      <section className={styles.summaryMetrics} aria-label="Résumé du budget">
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Disponible à Allouer</span>
          <span className={styles.statValue}>{formatCurrency(availableFunds)}</span>
          {rolloverAmount !== undefined && rolloverAmount !== 0 && (
            <span className={styles.statSubValue}>(Dont report: {formatCurrency(rolloverAmount)})</span>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Alloué</span>
          <span className={styles.statValue}>{formatCurrency(totalAllocated)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Reste à Allouer</span>
          <span className={`${styles.statValue} ${remainingStatusStyle}`}>{formatCurrency(remainingToAllocate)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Dépensé</span>
          <span className={styles.statValue}>{formatCurrency(totalSpent)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Épargne du Mois</span>
          <span className={styles.statValue}>{formatCurrency(monthlySavings)}</span>
        </div>
      </section>
      
      {(isRecalculating || calculationStatus === 'pending') && (
        <div className={styles.recalculatingIndicator} role="status" aria-live="polite">Recalcul en cours...</div>
      )}
      {calculationStatus === 'complete' && (
        <div className={styles.recalculatingIndicatorComplete} role="status" aria-live="polite">Budget recalculé!</div>
      )}
      {updateError && <div className={styles.errorDisplay} role="alert">Erreur de mise à jour: {updateError}</div>}
      {recalculationError && <div className={styles.errorDisplay} role="alert">Erreur de recalcul: {recalculationError}</div>}
       {isUsingServerCalculations !== undefined && (
          <p className={styles.dataSourceIndicator}>
            (Données: {isUsingServerCalculations ? 'Serveur' : 'Client'})
          </p>
        )}


      <section className={styles.categorySection} aria-labelledby="category-section-title">
        <h2 id="category-section-title" className={styles.sectionTitle}>Catégories</h2>
        {categories && categories.length > 0 ? (
          <div className={styles.categoryCardList}>
            {categories.map((category) => {
              const allocatedAmount = monthlyData?.allocations?.[category.id] ?? 0;
              const activityAmount = categoryActivityMap?.[category.id] ?? 0; // Already signed
              const availableInCategory = allocatedAmount + activityAmount; // Correct calculation
              
              // For progress bar: if allocated is 0, progress is 0 unless activity is positive (income to category)
              // Progress shows "spent" part of allocation. Expenses are negative activity.
              const spentAmount = activityAmount < 0 ? Math.abs(activityAmount) : 0;
              let progressPercent = 0;
              if (allocatedAmount > 0) {
                progressPercent = Math.min((spentAmount / allocatedAmount) * 100, 100);
              } else if (spentAmount > 0) { // Spent without allocation
                progressPercent = 100; // Show as fully "overspent" bar
              }

              // Input handling
              const currentInputValue = editingAllocation[category.id] !== undefined 
                                        ? editingAllocation[category.id] 
                                        : allocatedAmount.toString();

              // If you have a per-category saving state, use it; otherwise, default to false
              const isSavingAllocation = false; // Replace with actual state if available

              return (
                <div key={category.id} className={styles.categoryCard}>
                  <CategoryProgressDisplay
                    categoryName={category.name}
                    allocatedAmount={allocatedAmount}
                    spentAmount={spentAmount}
                    categoryType={category.type}
                    currentAllocation={currentInputValue}
                    onAllocationChange={(value) => handleAllocationInputChange(category.id, value)}
                    onAllocationSave={() => handleAllocationChange(category.id, editingAllocation[category.id] ?? allocatedAmount.toString())}
                    isSavingAllocation={isSavingAllocation}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <PlusCircleIcon />
            <h3 className={styles.emptyStateTitle}>Aucune Catégorie</h3>
            <p className={styles.emptyStateText}>
              {monthlyData ? "Aucune catégorie définie pour ce budget." : "Commencez par ajouter des catégories à votre budget."}
            </p>
            {/* You might want a button here to add categories if applicable */}
            {/* <button className={styles.emptyStateButton}>Ajouter une Catégorie</button> */}
          </div>
        )}
      </section>
    </div>
  );
}

export default BudgetPage;