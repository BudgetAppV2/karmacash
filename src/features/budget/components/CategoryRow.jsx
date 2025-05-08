import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters'; // Adjust path if needed
import styles from './CategoryRow.module.css';

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
  const [inputValue, setInputValue] = useState(allocatedAmount);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  
  // Update local state if allocatedAmount prop changes
  useEffect(() => {
    setInputValue(allocatedAmount);
  }, [allocatedAmount]);

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
      
  // Handler for input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Handler for when input loses focus
  const handleInputBlur = () => {
    setIsEditing(false);
    const newAmount = parseFloat(inputValue);
    
    // Validate input is a non-negative number
    if (!isNaN(newAmount) && newAmount >= 0 && newAmount !== allocatedAmount) {
      // Call parent callback with categoryId and new amount
      onAllocationChange(categoryId, newAmount);
    } else {
      // Revert to original value if invalid
      setInputValue(allocatedAmount);
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