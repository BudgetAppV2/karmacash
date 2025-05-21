import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
// Import the new BudgetPageHeader component
import BudgetPageHeader from './components/BudgetPageHeader';

// Icons (assuming you have an icon library or SVGs)
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// Define threshold as a constant
const RAA_APPROACHING_ZERO_THRESHOLD = 20;

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
  const [invalidInputCategoryId, setInvalidInputCategoryId] = useState(null); // New state for validation
  const [allocationAdjustmentInfo, setAllocationAdjustmentInfo] = useState(null); // New state for capping info

  const [activeFeedback, setActiveFeedback] = useState({ text: null, type: null, categoryName: null });
  const feedbackTimeoutRef = useRef(null);

  const debouncedTriggerRecalculationRef = useRef(null);

  const { 
    monthlyData, 
    categories, 
    categoryActivityMap, 
    availableFunds,
    totalAllocated,
    remainingToAllocate: instantRemainingToAllocate,
    totalSpent,
    monthlySavings,
    rolloverAmount,
    isUsingServerCalculations,
    loading: dataLoading, 
    error: dataError,
    monthlyRevenue,
    monthlyRecurringSpending
  } = useBudgetData(budgetId, currentMonthString, editingAllocation);

  // New state for deferred update logic
  const [activeSliderCategoryId, setActiveSliderCategoryId] = useState(null);
  const [debouncedRemainingToAllocateForInactive, setDebouncedRemainingToAllocateForInactive] = useState(null);

  // Effect for Capping Message
  useEffect(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    if (allocationAdjustmentInfo && allocationAdjustmentInfo.categoryId) {
      const categoryName = categories.find(c => c.id === allocationAdjustmentInfo.categoryId)?.name || 'cette catégorie';
      const messageText = `Le montant pour ${categoryName} a été ajusté à ${formatCurrency(allocationAdjustmentInfo.cappedAmount)} pour respecter les fonds disponibles.`;
      setActiveFeedback({ text: messageText, type: 'info', categoryName });

      feedbackTimeoutRef.current = setTimeout(() => {
        setActiveFeedback({ text: null, type: null, categoryName: null });
      }, 5000);
    }
     // Cleanup function
     return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [allocationAdjustmentInfo, categories]);

  // Effect for Error Message
  useEffect(() => {
    // Clear previous error-type feedback if conditions are no longer met
    if (!updateError && !invalidInputCategoryId && activeFeedback.type === 'error') {
      setActiveFeedback({ text: null, type: null, categoryName: null });
    }

    if (updateError) {
      let messageText = updateError; // Use the raw error first
      let errorCategoryName = null;

      if (invalidInputCategoryId) {
        errorCategoryName = categories.find(c => c.id === invalidInputCategoryId)?.name || 'une catégorie';
        // More specific message if invalidInputCategoryId is present
        messageText = `Ce changement dépasserait votre 'Reste à Allouer'. Veuillez ajuster le montant pour ${errorCategoryName} ou d'autres catégories.`;
      }
      setActiveFeedback({ text: messageText, type: 'error', categoryName: errorCategoryName });
    } else if (invalidInputCategoryId && !updateError) { // Case where only invalidInputCategoryId is set
      const errorCategoryName = categories.find(c => c.id === invalidInputCategoryId)?.name || 'une catégorie';
      const messageText = `Veuillez ajuster le montant pour ${errorCategoryName} pour ne pas dépasser le 'Reste à Allouer'.`;
      setActiveFeedback({ text: messageText, type: 'error', categoryName: errorCategoryName });
    }
    
    // Do not auto-clear error messages with a timeout here. They persist until the error condition is resolved.
  }, [updateError, invalidInputCategoryId, categories, activeFeedback.type]);

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

  // Debounce update for inactive categories' RAA
  const scheduleDebouncedRaaUpdate = useMemo(() => 
    debounce((newRaa) => {
      setDebouncedRemainingToAllocateForInactive(newRaa);
    }, 400), // 400ms delay, adjust as needed
  []);

  useEffect(() => {
    // When instantRemainingToAllocate changes (due to slider/input), schedule its update for inactive cards
    if (instantRemainingToAllocate !== null && instantRemainingToAllocate !== undefined) {
      scheduleDebouncedRaaUpdate(instantRemainingToAllocate);
    }
    return () => {
      scheduleDebouncedRaaUpdate.cancel();
    };
  }, [instantRemainingToAllocate, scheduleDebouncedRaaUpdate]);

  // Initialize debouncedRemainingToAllocateForInactive with the first valid instantRemainingToAllocate
  useEffect(() => {
    if (debouncedRemainingToAllocateForInactive === null && instantRemainingToAllocate !== null && instantRemainingToAllocate !== undefined) {
      setDebouncedRemainingToAllocateForInactive(instantRemainingToAllocate);
    }
  }, [instantRemainingToAllocate, debouncedRemainingToAllocateForInactive]);

  // Ensure all these handlers are stable with useCallback
  const processSliderAllocationChange = useCallback((categoryId, valueAsString) => {
    const savedAllocForThisCategory = monthlyData?.allocations?.[categoryId] ?? 0;
    const proposedNumericValue = parseFloat(valueAsString);

    if (isNaN(proposedNumericValue) || proposedNumericValue < 0) {
      setInvalidInputCategoryId(categoryId); 
      return;
    }

    // Corrected Validation:
    // instantRemainingToAllocate is RAA_after_proposedNumericValue_is_factored_out
    const initialRaaAvailableToThisCategory = instantRemainingToAllocate + (proposedNumericValue - savedAllocForThisCategory);
    const trueCapForThisCategory = Math.max(0, savedAllocForThisCategory + initialRaaAvailableToThisCategory);

    if (proposedNumericValue > trueCapForThisCategory + 0.001) {
      setInvalidInputCategoryId(categoryId);
    } else {
      setInvalidInputCategoryId(null); 
    }
  }, [monthlyData, instantRemainingToAllocate, categories]);

  const debouncedProcessSliderAllocation = useMemo(
    () => debounce(processSliderAllocationChange, 250), 
    [processSliderAllocationChange]
  );

  const handleSliderChangeImmediate = useCallback((categoryId, numericValueFromSlider) => {
    const valueAsString = numericValueFromSlider.toString();
    setEditingAllocation(prev => ({ ...prev, [categoryId]: valueAsString }));

    // RESTORED: Call the debounced version
    debouncedProcessSliderAllocation(categoryId, valueAsString);
    // processSliderAllocationChange(categoryId, valueAsString); // This was the temporary direct call

  }, [debouncedProcessSliderAllocation]); // Dependency is now the debounced function

  const handleNumericInputChange = useCallback((categoryId, value) => {
    const stringValue = typeof value === 'number' ? value.toString() : (value || '');
    setEditingAllocation(prev => ({ ...prev, [categoryId]: stringValue }));

    if (stringValue === '' || (stringValue.endsWith('.') && !isNaN(parseFloat(stringValue.slice(0,-1))))) {
      setInvalidInputCategoryId(null); // Clear if it was previously invalid due to this field
      return;
    }
    
    const savedAllocForThisCategory = monthlyData?.allocations?.[categoryId] ?? 0;
    const proposedNumericValue = parseFloat(stringValue);

    if (isNaN(proposedNumericValue) || proposedNumericValue < 0) {
      setInvalidInputCategoryId(categoryId); 
      return;
    }

    // Corrected Validation:
    // instantRemainingToAllocate is RAA_after_proposedNumericValue_is_factored_out
    const initialRaaAvailableToThisCategory = instantRemainingToAllocate + (proposedNumericValue - savedAllocForThisCategory);
    const trueCapForThisCategory = Math.max(0, savedAllocForThisCategory + initialRaaAvailableToThisCategory);

    if (proposedNumericValue > trueCapForThisCategory + 0.001) {
      setInvalidInputCategoryId(categoryId);
    } else {
      setInvalidInputCategoryId(null);
    }
  }, [monthlyData, instantRemainingToAllocate, categories]); // Added categories to dependencies

  const handleAllocationChange = useCallback(async (categoryId, newAmountStr) => {
    setActiveFeedback(prev => (prev.type === 'error' || prev.type === 'info') ? { text: null, type: null, categoryName: null } : prev);
    setUpdateError(null); 
    setAllocationAdjustmentInfo(null); 
    
    let newAmountNum = parseFloat(newAmountStr);

    if (isNaN(newAmountNum) || newAmountNum < 0) {
      setUpdateError('Montant invalide.'); 
      setInvalidInputCategoryId(categoryId); 
      // Do not change editingAllocation here, let the invalid state show on current input
      return;
    }

    const savedAllocForThisCategory = monthlyData?.allocations?.[categoryId] ?? 0;
    
    // Calculate the correct maximum this category can be allocated
    // This logic mirrors the fixed maxPotentialAllocationForCategory in the render loop
    const rtaFromHookForCap = instantRemainingToAllocate; // RAA_after_newAmountNum_is_factored_out
    
    // Initial RAA available for this category = rtaFromHookForCap + (newAmountNum - savedAllocForThisCategory)
    const initialRaaAvailableToThisCategory = rtaFromHookForCap + (newAmountNum - savedAllocForThisCategory);
    const trueCapForThisCategory = Math.max(0, savedAllocForThisCategory + initialRaaAvailableToThisCategory);

    let cappedInfoForState = null;

    if (newAmountNum > trueCapForThisCategory + 0.001) {
      cappedInfoForState = { 
        categoryId, 
        categoryName: categories.find(c => c.id === categoryId)?.name || 'cette catégorie', 
        cappedAmount: trueCapForThisCategory, 
        originalInput: newAmountStr 
      };
      newAmountNum = trueCapForThisCategory;
      // Update UI to show the capped value immediately
      setEditingAllocation(prev => ({ ...prev, [categoryId]: newAmountNum.toFixed(2) }));
    }
    
    setInvalidInputCategoryId(null); // If we reach here, input is valid or has been capped to be valid.
    
    if (cappedInfoForState) {
        setAllocationAdjustmentInfo(cappedInfoForState);
    }

    try { 
      await updateAllocation(budgetId, currentMonthString, categoryId, newAmountNum); 
      
      // After successful save, clear the editing state for this category
      // so the input reflects the source of truth (monthlyData.allocations)
      setEditingAllocation(prev => {
        const newState = {...prev};
        delete newState[categoryId]; 
        return newState;
      });

      if (debouncedTriggerRecalculationRef.current) {
        debouncedTriggerRecalculationRef.current();
      }
    } catch (e) { 
      setUpdateError(e.message); 
      // If save fails, editingAllocation still holds the value that failed.
      // User can see it and retry or change it.
    }
  // Deps: Add `categories` because it's used in find.
}, [monthlyData, categories, instantRemainingToAllocate, budgetId, currentMonthString, debouncedTriggerRecalculationRef, setActiveFeedback, setUpdateError, setAllocationAdjustmentInfo, setEditingAllocation, setInvalidInputCategoryId]);

  const handleSliderInteractionStart = useCallback((categoryId) => {
    setActiveSliderCategoryId(categoryId);
  }, [setActiveSliderCategoryId]); // Added setActiveSliderCategoryId to deps

  const handleSliderInteractionEnd = useCallback(() => {
    setActiveSliderCategoryId(null);
    scheduleDebouncedRaaUpdate.cancel();
    setDebouncedRemainingToAllocateForInactive(instantRemainingToAllocate);
  }, [instantRemainingToAllocate, scheduleDebouncedRaaUpdate, setActiveSliderCategoryId, setDebouncedRemainingToAllocateForInactive]); // Added deps

  // Determine status for main "Reste à Allouer" display
  let remainingStatusStyle = styles.raaNeutral;
  if (instantRemainingToAllocate < -0.009) remainingStatusStyle = styles.raaNegative;
  else if (instantRemainingToAllocate > 0.009 && instantRemainingToAllocate <= RAA_APPROACHING_ZERO_THRESHOLD) remainingStatusStyle = styles.raaApproachingZero;
  else if (instantRemainingToAllocate > RAA_APPROACHING_ZERO_THRESHOLD) remainingStatusStyle = styles.raaPositive;

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
  
  return (
    <div className={styles.budgetPage}>
      {/* Replace the old header and summaryMetrics with the new BudgetPageHeader */}
      <BudgetPageHeader 
        userName="Judith"
        budgetName={budgetName}
        currentMonthString={displayMonth}
        onPreviousMonth={() => navigateMonth('prev')}
        onNextMonth={() => navigateMonth('next')}
        solde={monthlyRevenue - totalSpent} // Approximate calculation for overall balance
        revenuTotal={monthlyRevenue}
        totalDepensesFixes={monthlyRecurringSpending}
        disponibleAAllouer={availableFunds}
        totalAlloue={totalAllocated}
        resteAAllouer={instantRemainingToAllocate}
        totalDepense={totalSpent}
        epargneDuMois={monthlySavings}
        resteAAllouerStatusStyle={remainingStatusStyle}
        rolloverAmount={rolloverAmount}
      />
      
      {(isRecalculating || calculationStatus === 'pending') && (
        <div className={styles.recalculatingIndicator} role="status" aria-live="polite">Recalcul en cours...</div>
      )}
      {calculationStatus === 'complete' && (
        <div className={styles.recalculatingIndicatorComplete} role="status" aria-live="polite">Budget recalculé!</div>
      )}
      {activeFeedback.text && (
        <div 
          className={`${styles.feedbackContainer} ${styles[activeFeedback.type === 'info' ? 'feedbackInfo' : 'feedbackError']}`}
          role={activeFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <InfoIcon /> {/* Consider making icon conditional or type-specific */}
          <span>{activeFeedback.text}</span>
        </div>
      )}
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
              const currentInputValue = editingAllocation[category.id] !== undefined 
                                        ? editingAllocation[category.id] 
                                        : allocatedAmount.toString();
              
              const isCurrentCategoryActive = category.id === activeSliderCategoryId;
              const rtaForThisCategoryMaxCalc = (activeSliderCategoryId === null || isCurrentCategoryActive) 
                                           ? instantRemainingToAllocate 
                                           : (debouncedRemainingToAllocateForInactive ?? instantRemainingToAllocate);
              
              const positiveRtaForMax = rtaForThisCategoryMaxCalc > 0 ? rtaForThisCategoryMaxCalc : 0;

              // Logic for maxPotentialAllocationForCategory
              const savedAlloc = allocatedAmount; // allocatedAmount is already the saved allocation
              const currentEditingValStr = editingAllocation[category.id]; // Current string from input/slider
              let numericCurrentInputValue = parseFloat(currentEditingValStr);

              // Fallback logic for numericCurrentInputValue - updated to be more explicit as per user request
              if (currentEditingValStr === undefined || currentEditingValStr.trim() === "" || isNaN(numericCurrentInputValue)) {
                  numericCurrentInputValue = savedAlloc;
              }

              // rtaFromHook is the RAA from useBudgetData, processed to be non-negative.
              // This value already reflects (numericCurrentInputValue - savedAlloc) having been "subtracted" from the initial RAA.
              const rtaFromHook = positiveRtaForMax; 

              // THE ACTUAL CALCULATION - Corrected to use numericCurrentInputValue
              const maxPotentialAllocationForCategory = Math.max(0, numericCurrentInputValue + rtaFromHook);

              // Debugging logs (confirming they use the variables from the calculation above)
              // console.log(`[BudgetPage] Category: ${category.name}`);

              const onSaveHandler = () => handleAllocationChange(category.id, editingAllocation[category.id] ?? allocatedAmount.toString());
              
              // REINSTATE CORRECTED LOGIC for spentForCategory:
              const netActivityForCategory = categoryActivityMap?.[category.id] ?? 0;
              const spentForCategory = Math.max(0, -netActivityForCategory); 

              const isSavingAllocation = false; 
              const isInputCurrentlyInvalid = invalidInputCategoryId === category.id;

              return (
                <div key={category.id} className={styles.categoryCard}>
                  <CategoryProgressDisplay
                    category={category} 
                    allocatedAmount={allocatedAmount} 
                    spentAmount={spentForCategory} // Use corrected positive value
                    categoryType={category.type} 
                    categoryColor={category.color}
                    currentAllocation={currentInputValue} 
                    maxAllowedValue={maxPotentialAllocationForCategory} 
                    baseOnNumericInputChange={handleNumericInputChange}
                    baseOnSliderChange={handleSliderChangeImmediate}
                    baseOnAllocationSave={handleAllocationChange} 
                    baseOnSliderInteractionStart={handleSliderInteractionStart}
                    baseOnSliderInteractionEnd={handleSliderInteractionEnd} 
                    isSavingAllocation={isSavingAllocation}
                    isInputInvalid={isInputCurrentlyInvalid}
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