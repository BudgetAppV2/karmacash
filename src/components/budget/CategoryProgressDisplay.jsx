import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './CategoryProgressDisplay.module.css';
import AllocationSlider from './AllocationSlider';
import debounce from 'lodash/debounce'; // Import debounce

function formatCurrency(amount) {
  return amount?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

// Custom comparison function for React.memo
const areCategoryPropsEqual = (prevProps, nextProps) => {
  // Check primary data values that would cause visual changes
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.allocatedAmount === nextProps.allocatedAmount &&
    prevProps.spentAmount === nextProps.spentAmount &&
    prevProps.currentAllocation === nextProps.currentAllocation &&
    prevProps.isSavingAllocation === nextProps.isSavingAllocation &&
    prevProps.isInputInvalid === nextProps.isInputInvalid &&
    prevProps.maxAllowedValue === nextProps.maxAllowedValue
  );
};

const CategoryProgressDisplayComponent = function CategoryProgressDisplay({
  category, // Expecting the whole category object { id, name, type, color }
  allocatedAmount = 0, 
  spentAmount = 0,
  // categoryType, // Now from category.type
  // categoryColor, // Now from category.color
  currentAllocation, 
  // Base handlers passed from BudgetPage
  baseOnNumericInputChange, 
  baseOnSliderChange,       
  baseOnAllocationSave,   
  baseOnSliderInteractionStart,
  baseOnSliderInteractionEnd,

  isSavingAllocation = false,
  isInputInvalid = false,
  maxAllowedValue,
  // onSliderInteractionStart, // These are now base props
  // onSliderInteractionEnd,   
}) {
  const categoryId = category.id;
  const categoryName = category.name;
  const categoryColor = category.color;
  // const categoryType = category.type; // If needed

  // console.log(`CPD Rendering: ${categoryName}`, { currentAllocation, spentAmount, allocatedAmount, maxAllowedValue });

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isApproachingMax, setIsApproachingMax] = useState(false);

  // Debounced save function
  const debouncedSaveAllocation = useCallback(
    debounce((catId, valueToSave) => {
      // This function will be called after the debounce period
      // It calls the baseOnAllocationSave passed from BudgetPage
      baseOnAllocationSave(catId, valueToSave);
    }, 750), // 750ms delay
    [baseOnAllocationSave] // Dependency: the save function from props
  );

  useEffect(() => {
    if (maxAllowedValue !== undefined && currentAllocation !== undefined) {
      const numericCurrentAllocation = parseFloat(currentAllocation);
      if (!isNaN(numericCurrentAllocation) && numericCurrentAllocation > 0) {
        const eightyFivePercentOfMax = maxAllowedValue * 0.85;
        setIsApproachingMax(numericCurrentAllocation >= eightyFivePercentOfMax && numericCurrentAllocation < maxAllowedValue);
      } else {
        setIsApproachingMax(false);
      }
    } else {
      setIsApproachingMax(false);
    }
  }, [currentAllocation, maxAllowedValue]);

  // Use useMemo for expensive calculations
  const numericCurrentAllocation = useMemo(() => {
    return parseFloat(currentAllocation);
  }, [currentAllocation]);
  
  const displayAllocated = isNaN(numericCurrentAllocation) ? allocatedAmount : numericCurrentAllocation;

  // Memoize calculated values to prevent recalculations
  const { progress, remaining, isTrulyOverspent } = useMemo(() => {
    let calculatedProgress = 0;
    if (displayAllocated > 0) {
      calculatedProgress = Math.min((spentAmount / displayAllocated) * 100, 100);
    } else if (spentAmount > 0) { 
      calculatedProgress = 100;
    }
    
    const calculatedRemaining = displayAllocated - spentAmount;
    const calculatedIsOverspent = (displayAllocated > 0 && spentAmount > displayAllocated) || 
                                 (displayAllocated === 0 && spentAmount > 0);
                                 
    return {
      progress: calculatedProgress,
      remaining: calculatedRemaining,
      isTrulyOverspent: calculatedIsOverspent
    };
  }, [displayAllocated, spentAmount]);

  // Create specific handlers using useCallback, bound to categoryId
  const handleLocalNumericInputChange = useCallback((value) => {
    // Call for immediate validation and state update in BudgetPage
    baseOnNumericInputChange(categoryId, value);
    // Trigger the debounced save
    debouncedSaveAllocation(categoryId, value);
  }, [baseOnNumericInputChange, categoryId, debouncedSaveAllocation]);

  const handleLocalSliderChange = useCallback((value) => {
    baseOnSliderChange(categoryId, value);
  }, [baseOnSliderChange, categoryId]);

  const handleLocalAllocationSave = useCallback(() => {
    // baseOnAllocationSave expects categoryId and the *current value string*
    // The current value string for saving should be what's in editingAllocation (which is currentAllocation prop here)
    debouncedSaveAllocation.cancel(); // Cancel any pending debounced save
    baseOnAllocationSave(categoryId, currentAllocation);
  }, [baseOnAllocationSave, categoryId, currentAllocation, debouncedSaveAllocation]);

  const handleLocalSliderInteractionStart = useCallback(() => {
    baseOnSliderInteractionStart(categoryId);
  }, [baseOnSliderInteractionStart, categoryId]);

  // Modified to trigger debounced save on slider interaction end
  const handleLocalSliderInteractionEnd = useCallback(() => {
    // Call the original baseOnSliderInteractionEnd from BudgetPage (if it does anything beyond RAA update)
    if (typeof baseOnSliderInteractionEnd === 'function') {
      baseOnSliderInteractionEnd(); // It's expected this primarily handles RAA state in BudgetPage
    }
    // Now, trigger the debounced save for the current slider value
    // currentAllocation prop should reflect the latest slider value via editingAllocation in BudgetPage
    debouncedSaveAllocation(categoryId, currentAllocation);
  }, [baseOnSliderInteractionEnd, categoryId, currentAllocation, debouncedSaveAllocation]);

  // Visual setup for progress circle - memoize these calculations
  const circleProps = useMemo(() => {
    const RADIUS = 36; // Increased radius for larger circle
    const STROKE = 8;
    const CIRCUM = 2 * Math.PI * RADIUS;
    const offset = CIRCUM * (1 - progress / 100);
    const displayPercentText = displayAllocated > 0 || spentAmount > 0 ? `${Math.round(progress)}%` : '--';
    
    return {
      RADIUS,
      STROKE,
      CIRCUM,
      offset,
      displayPercentText
    };
  }, [progress, displayAllocated, spentAmount]);
  
  // Use memoized callbacks and values to minimize rerenders and improve touch response
  return (
    <section 
      className={styles.container}
      aria-label={`Catégorie ${categoryName}`}
      style={{ '--category-card-accent-color': categoryColor || 'transparent' }}
      data-scroll-container="true"
    >
      {isTrulyOverspent && <div className={styles.overspendingDot}></div>}
      <div className={styles.topContent}>
        <h3 className={styles.categoryName}>{categoryName}</h3>
        <div className={styles.budgetDetailsRow}>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Alloué</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={styles.budgetDetailValue}>{formatCurrency(displayAllocated)}</span>
            </div>
          </div>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Dépensé</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={styles.budgetDetailValue}>{formatCurrency(spentAmount)}</span>
            </div>
          </div>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Reste</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={`${styles.budgetDetailValue} ${remaining < 0 ? styles.negativeValue : ''}`}>{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.bottomControlsRow}>
        <div className={styles.allocationControls}>
          <form className={styles.allocationForm} onSubmit={e => { e.preventDefault(); /* No action as button is removed */ }}>
            <label htmlFor={`allocation-input-${categoryName}`} className={styles.inputLabel}>
              Modifier l'allocation
            </label>
            <AllocationSlider
              min={0}
              max={maxAllowedValue !== undefined ? maxAllowedValue : 0} 
              value={isNaN(numericCurrentAllocation) ? 0 : numericCurrentAllocation} 
              onChange={handleLocalSliderChange} 
              step={1} 
              ariaLabel={`Modifier l'allocation pour ${categoryName}`}
              disabled={isSavingAllocation} 
              onInteractionStart={handleLocalSliderInteractionStart} 
              onInteractionEnd={handleLocalSliderInteractionEnd} // Changed to use the new local handler
              categoryColor={categoryColor} // Pass the category color to the slider     
            />
            <div className={styles.inputRow}>
              <input
                id={`allocation-input-${categoryName}`}
                className={`${styles.allocationInput} ${isInputInvalid ? styles.inputInvalid : ''} ${isApproachingMax ? styles.inputApproachingMax : ''}`}
                type="number"
                min="0"
                step={0.01} 
                value={currentAllocation} 
                onChange={e => handleLocalNumericInputChange(e.target.value)} 
                aria-label={`Montant alloué pour ${categoryName}`}
                disabled={isSavingAllocation}
                max={maxAllowedValue !== undefined ? maxAllowedValue.toFixed(2) : undefined}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setIsInputFocused(false);
                  // On blur, cancel pending debounce and trigger save immediately
                  // This ensures the very last input is saved if user clicks away quickly
                  debouncedSaveAllocation.cancel();
                  baseOnAllocationSave(categoryId, currentAllocation); // currentAllocation should reflect the latest input via BudgetPage's editingAllocation state
                }}
              />
              {isInputFocused && maxAllowedValue !== undefined && (
                <span className={styles.maxValueHint}>(Max: {formatCurrency(maxAllowedValue)})</span>
              )}
            </div>
          </form>
        </div>
        <div className={styles.progressIndicatorWrapper}>
          <svg
            className={styles.circularProgress}
            width={100}
            height={100}
            viewBox="0 0 100 100"
            aria-label="Progression du budget"
            role="img"
          >
            <circle
              className={styles.progressTrack}
              cx="50"
              cy="50"
              r={circleProps.RADIUS}
              strokeWidth={circleProps.STROKE}
              fill="none"
            />
            <circle
              className={styles.progressIndicator}
              cx="50"
              cy="50"
              r={circleProps.RADIUS}
              strokeWidth={circleProps.STROKE}
              fill="none"
              stroke={categoryColor || '#cccccc'}
              strokeDasharray={circleProps.CIRCUM}
              strokeDashoffset={circleProps.offset}
              strokeLinecap="round"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.progressPercentText}
            >
              {circleProps.displayPercentText}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}; 

// Use React.memo with custom comparison function to prevent unnecessary rerenders
export default React.memo(CategoryProgressDisplayComponent, areCategoryPropsEqual); 