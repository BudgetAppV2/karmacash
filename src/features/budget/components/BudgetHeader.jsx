import React from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns'; // Import date-fns format and parseISO
import { frCA } from 'date-fns/locale'; // Import locale
import styles from './BudgetHeader.module.css';
import { formatCurrency } from '../../../utils/formatters'; // Adjust path as needed

/**
 * Displays the budget name and the current month with navigation controls.
 * @param {object} props - Component props.
 * @param {string} props.budgetName - The name of the budget.
 * @param {string} props.currentMonthString - The currently viewed month in "YYYY-MM" format.
 * @param {function} props.onPreviousMonth - Handler function for navigating to the previous month.
 * @param {function} props.onNextMonth - Handler function for navigating to the next month.
 * @param {number} props.availableFunds - The calculated funds available to allocate.
 * @param {number} props.totalAllocated - The calculated total amount allocated.
 * @param {number} props.remainingToAllocate - The calculated remaining amount to allocate.
 * @param {number} [props.totalSpent] - The calculated total amount spent this month.
 * @param {number} [props.monthlySavings] - The calculated total savings for the month.
 * @param {number} [props.rolloverAmount] - The amount rolled over from the previous month.
 * @param {boolean} [props.isUsingServerCalculations] - Flag indicating if server data is used.
 */
function BudgetHeader({ budgetName, currentMonthString, onPreviousMonth, onNextMonth, availableFunds, totalAllocated, remainingToAllocate, totalSpent, monthlySavings, rolloverAmount, isUsingServerCalculations }) {
  // Format the currentMonthString for display
  let displayMonth = 'Mois actuel';
  if (currentMonthString) {
    try {
        // Parse the YYYY-MM string to a Date object (use parseISO for robustness)
        // Then format it for display using the frCA locale
        displayMonth = format(parseISO(currentMonthString + '-01'), 'MMMM yyyy', { locale: frCA });
    } catch (e) {
        console.error("Error formatting month string for display:", e);
        displayMonth = currentMonthString; // Fallback to raw string on error
    }
  }

  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.budgetName}>{budgetName || 'Budget'}</h1>
      <div className={styles.monthNavigation}>
        <button className={styles.navButton} onClick={onPreviousMonth} aria-label="Mois précédent">{'<'}</button>
        <p className={styles.currentMonth}>{displayMonth}</p>
        <button className={styles.navButton} onClick={onNextMonth} aria-label="Mois suivant">{'>'}</button>
      </div>
      {/* ZBB Summary Display */}
      <div className={styles.zbbSummary}>
        <p>Disponible à allouer: {availableFunds !== undefined ? formatCurrency(availableFunds) : '-'}</p>
        {rolloverAmount !== undefined && <p style={{ fontSize: '0.8em', paddingLeft: '15px' }}>(Dont report: {formatCurrency(rolloverAmount)})</p>}
        <p>Total Alloué: {totalAllocated !== undefined ? formatCurrency(totalAllocated) : '-'}</p>
        <p>Total Dépensé: {totalSpent !== undefined ? formatCurrency(totalSpent) : '-'}</p>
        <p>Épargne du Mois: {monthlySavings !== undefined ? formatCurrency(monthlySavings) : '-'}</p>
        <p>
          Reste à Allouer: 
          <span className={
            remainingToAllocate > 0.009 ? styles.remainingPositive :
            remainingToAllocate < -0.009 ? styles.remainingNegative :
            styles.remainingZero
          }>
            {remainingToAllocate !== undefined ? formatCurrency(remainingToAllocate) : '-'}
          </span>
        </p>
        {isUsingServerCalculations !== undefined && (
          <p className={styles.dataSourceIndicator}>
            (Données: {isUsingServerCalculations ? 'Serveur' : 'Client'})
          </p>
        )}
      </div>
    </div>
  );
}

BudgetHeader.propTypes = {
  budgetName: PropTypes.string,
  currentMonthString: PropTypes.string.isRequired,
  onPreviousMonth: PropTypes.func.isRequired,
  onNextMonth: PropTypes.func.isRequired,
  availableFunds: PropTypes.number,
  totalAllocated: PropTypes.number,
  remainingToAllocate: PropTypes.number,
  totalSpent: PropTypes.number,
  monthlySavings: PropTypes.number,
  rolloverAmount: PropTypes.number,
  isUsingServerCalculations: PropTypes.bool,
};

BudgetHeader.defaultProps = {
  budgetName: 'Budget',
  totalSpent: undefined,
  monthlySavings: undefined,
  rolloverAmount: undefined,
  isUsingServerCalculations: undefined,
};

export default BudgetHeader; 