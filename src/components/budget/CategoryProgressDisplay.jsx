import React, { useState, useEffect, useCallback } from 'react';
import styles from './CategoryProgressDisplay.module.css';
import AllocationSlider from './AllocationSlider';

function formatCurrency(amount) {
  return amount?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

// Remove custom areCategoryPropsEqual and revert to default React.memo behavior for now
// const areCategoryPropsEqual = (prevProps, nextProps) => { ... };

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

  const numericCurrentAllocation = parseFloat(currentAllocation);
  const displayAllocated = isNaN(numericCurrentAllocation) ? allocatedAmount : numericCurrentAllocation;

  let progress = 0;
  if (displayAllocated > 0) {
    progress = Math.min((spentAmount / displayAllocated) * 100, 100);
  } else if (spentAmount > 0) { 
    progress = 100;
  }
  
  const remaining = displayAllocated - spentAmount;
  const isTrulyOverspent = (displayAllocated > 0 && spentAmount > displayAllocated) || (displayAllocated === 0 && spentAmount > 0);

  // Create specific handlers using useCallback, bound to categoryId
  const handleLocalNumericInputChange = useCallback((value) => {
    baseOnNumericInputChange(categoryId, value);
  }, [baseOnNumericInputChange, categoryId]);

  const handleLocalSliderChange = useCallback((value) => {
    baseOnSliderChange(categoryId, value);
  }, [baseOnSliderChange, categoryId]);

  const handleLocalAllocationSave = useCallback(() => {
    // baseOnAllocationSave expects categoryId and the *current value string*
    // The current value string for saving should be what's in editingAllocation (which is currentAllocation prop here)
    baseOnAllocationSave(categoryId, currentAllocation);
  }, [baseOnAllocationSave, categoryId, currentAllocation]);

  const handleLocalSliderInteractionStart = useCallback(() => {
    baseOnSliderInteractionStart(categoryId);
  }, [baseOnSliderInteractionStart, categoryId]);

  // baseOnSliderInteractionEnd does not need categoryId from child, so it can be passed directly if preferred,
  // or wrapped if consistency is desired or if it might need categoryId later.
  // For now, passing directly as BudgetPage's handleSliderInteractionEnd doesn't take categoryId.

  const RADIUS = 25;
  const STROKE = 8;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const visualProgressPercent = progress;
  const offset = CIRCUM * (1 - visualProgressPercent / 100);
  const displayPercentText = displayAllocated > 0 || spentAmount > 0 ? `${Math.round(visualProgressPercent)}%` : '--';

  return (
    <section 
      className={styles.container}
      aria-label={`Catégorie ${categoryName}`}
      style={{ '--category-card-accent-color': categoryColor || 'transparent' }}
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
          <form className={styles.allocationForm} onSubmit={e => { e.preventDefault(); handleLocalAllocationSave(); }}>
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
              onInteractionEnd={baseOnSliderInteractionEnd} // Passed directly     
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
                onBlur={() => setIsInputFocused(false)}
              />
              {isInputFocused && maxAllowedValue !== undefined && (
                <span className={styles.maxValueHint}>(Max: {formatCurrency(maxAllowedValue)})</span>
              )}
            </div>
            <button
              className={styles.saveButton}
              type="submit"
              disabled={isSavingAllocation || isInputInvalid} 
              aria-busy={isSavingAllocation}
            >
              {isSavingAllocation ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </form>
        </div>
        <div className={styles.progressIndicatorWrapper}>
          <svg
            className={styles.circularProgress}
            width={60}
            height={60}
            viewBox="0 0 60 60"
            aria-label="Progression du budget"
            role="img"
          >
            <circle
              className={styles.progressTrack}
              cx="30"
              cy="30"
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
            />
            <circle
              className={styles.progressIndicator}
              cx="30"
              cy="30"
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
              stroke={categoryColor || '#cccccc'}
              strokeDasharray={CIRCUM}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.progressPercentText}
            >
              {displayPercentText}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}; 

// Revert to default React.memo without custom comparison for now
export default React.memo(CategoryProgressDisplayComponent); 