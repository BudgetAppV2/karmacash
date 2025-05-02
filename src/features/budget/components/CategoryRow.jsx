import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters'; // Adjust path if needed
import styles from './CategoryRow.module.css';

/**
 * Displays a single category row in the budget view.
 * Shows category name, allocated amount, and placeholders for activity/available.
 *
 * @param {object} props - Component props.
 * @param {string} props.categoryName - The name of the category.
 * @param {number} props.allocatedAmount - The amount allocated to this category.
 * @param {number} [props.activityAmount=0] - The activity amount (placeholder for now).
 * @param {number} [props.availableAmount=0] - The available amount (placeholder for now).
 */
function CategoryRow({ 
  categoryName,
  allocatedAmount,
  activityAmount = 0, // Defaulting to 0 for now
  availableAmount = 0 // Defaulting to 0 for now
}) {
  
  // Use placeholders for activity and available for this task
  const displayActivity = '---'; // Placeholder as per handoff step 5
  const displayAvailable = '---'; // Placeholder as per handoff step 5

  return (
    <div className={styles.rowContainer}>
      <div className={styles.categoryName}>{categoryName || 'Category Name'}</div>
      <div className={`${styles.amountCell} ${styles.allocated}`}>
        {formatCurrency(allocatedAmount)}
      </div>
      <div className={`${styles.amountCell} ${styles.activity}`}>
        {displayActivity} 
        {/* {formatCurrency(activityAmount)} */}
      </div>
      <div className={`${styles.amountCell} ${styles.available}`}>
        {displayAvailable}
        {/* {formatCurrency(availableAmount)} */}
      </div>
    </div>
  );
}

CategoryRow.propTypes = {
  categoryName: PropTypes.string.isRequired,
  allocatedAmount: PropTypes.number,
  activityAmount: PropTypes.number,
  availableAmount: PropTypes.number,
};

CategoryRow.defaultProps = {
  allocatedAmount: 0,
  activityAmount: 0,
  availableAmount: 0,
};

export default CategoryRow; 