import React from 'react';
import PropTypes from 'prop-types';
import styles from './BudgetHeader.module.css';

/**
 * Displays the budget name and the current month.
 * @param {object} props - Component props.
 * @param {string} props.budgetName - The name of the budget.
 * @param {string} props.currentMonthString - The currently viewed month (e.g., "May 2024").
 */
function BudgetHeader({ budgetName, currentMonthString }) {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.budgetName}>{budgetName || 'Budget'}</h1>
      <p className={styles.currentMonth}>{currentMonthString || 'Current Month'}</p>
    </div>
  );
}

BudgetHeader.propTypes = {
  budgetName: PropTypes.string,
  currentMonthString: PropTypes.string,
};

export default BudgetHeader; 