import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters'; // Adjust path if needed
import styles from './CategoryRow.module.css';
import debounce from 'lodash/debounce'; // Import debounce

/**
 * Displays a single category row in the budget view.
 * Shows category name, allocated amount, activity amount, and available amount.
 *
 * @param {object} props - Component props.
 * @param {string} props.categoryId - The ID of the category.
 * @param {string} props.categoryName - The name of the category.
 * @param {number} props.allocatedAmount - The amount allocated to this category.
 * @param {number} props.activityAmount - The sum of transactions for this category (signed).
 * @param {number} props.availableAmount - The available amount (allocated - activity).
 * @param {function} props.onAllocationChange - Callback when allocation is changed (categoryId, newAmount).
 */
function CategoryRow({ 
  categoryId,
  categoryName,
  allocatedAmount,
  activityAmount,
  availableAmount,
  onAllocationChange
}) {
  // Local state for input value
  const [inputValue, setInputValue] = useState(String(allocatedAmount));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  
  // Update local state if allocatedAmount prop changes
  useEffect(() => {
    // Only update inputValue if not currently editing, to avoid disrupting user input
    if (!isEditing) {
      setInputValue(String(allocatedAmount));
    }
  }, [allocatedAmount, isEditing]);

  // Auto-focus input when isEditing becomes true
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Determine styling classes based on values
  const activityClass = activityAmount < 0 
    ? styles.negative // Negative activity (expense) 
    : activityAmount > 0 
      ? styles.positive // Positive activity (income)
      : ''; // No activity

  const availableClass = availableAmount < 0 
    ? styles.negative // Negative available (overspent)
    : availableAmount > 0 
      ? styles.positive // Positive available (underspent)
      : ''; // Zero available (exactly spent)
      
  // Create a debounced version of the onAllocationChange handler
  const debouncedAllocationChange = useCallback(
    debounce((catId, newAmountStr) => {
      const newAmount = parseFloat(newAmountStr);
      // Validate input is a non-negative number
      if (!isNaN(newAmount) && newAmount >= 0) {
        // Call parent callback with categoryId and new amount
        // Only call if the value has actually changed from the prop
        if (newAmount !== allocatedAmount) {
          onAllocationChange(catId, newAmount);
        }
      } else {
        // If input is invalid after debounce (e.g., user types 'abc'), 
        // revert to the last valid allocatedAmount for display in input,
        // but don't trigger a save. Or, simply don't update.
        // For now, we'll let the input hold the invalid value until blur/enter fixes it.
      }
    }, 750), // 750ms debounce delay
    [allocatedAmount, onAllocationChange] // Dependencies for useCallback
  );
  
  // Handler for input changes
  const handleInputChange = (e) => {
    const currentValue = e.target.value;
    setInputValue(currentValue); // Update input state immediately for responsiveness

    // Call the debounced function to handle saving after user stops typing
    // We pass categoryId and the current input value
    debouncedAllocationChange(categoryId, currentValue);
  };
  
  // Handler for when input loses focus
  const handleInputBlur = () => {
    setIsEditing(false);
    // Ensure any pending debounced calls are flushed if needed, or just perform final validation.
    // lodash debounce typically calls on the trailing edge, so the last call might be pending.
    // For simplicity, we'll perform a direct validation and call here.
    // The debounced call might have already updated, this ensures the final state is committed.
    debouncedAllocationChange.cancel(); // Cancel any pending debounced invocation

    const newAmount = parseFloat(inputValue);
    
    // Validate input is a non-negative number
    if (!isNaN(newAmount) && newAmount >= 0) {
      if (newAmount !== allocatedAmount) {
        onAllocationChange(categoryId, newAmount);
      }
    } else {
      // Revert to original value if invalid
      setInputValue(String(allocatedAmount));
    }
  };
  
  // Handler for Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); // Will trigger onBlur event
    }
  };

  return (
    <div className={styles.rowContainer}>
      <div className={styles.categoryName}>{categoryName || 'Category Name'}</div>
      <div className={`${styles.amountCell} ${styles.allocated}`}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            className={`${styles.allocationInput} ${styles.editModeInput}`}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            step="0.01"
            min="0"
            aria-label="Edit allocation amount"
          />
        ) : (
          <div 
            className={styles.editableAmount}
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            aria-label={`Edit allocation amount: ${formatCurrency(allocatedAmount)}`}
          >
            {formatCurrency(allocatedAmount)}
          </div>
        )}
      </div>
      <div className={`${styles.amountCell} ${styles.activity} ${activityClass}`}>
        {formatCurrency(activityAmount)}
      </div>
      <div className={`${styles.amountCell} ${styles.available} ${availableClass}`}>
        {formatCurrency(availableAmount)}
      </div>
    </div>
  );
}

CategoryRow.propTypes = {
  categoryId: PropTypes.string.isRequired,
  categoryName: PropTypes.string.isRequired,
  allocatedAmount: PropTypes.number.isRequired,
  activityAmount: PropTypes.number.isRequired,
  availableAmount: PropTypes.number.isRequired,
  onAllocationChange: PropTypes.func
};

CategoryRow.defaultProps = {
  allocatedAmount: 0,
  activityAmount: 0,
  availableAmount: 0,
  onAllocationChange: () => {} // No-op function as default
};

export default CategoryRow; 