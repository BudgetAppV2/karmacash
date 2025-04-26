import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { frCA } from 'date-fns/locale';
import styles from './DayCell.module.css';
import { formatCurrency } from '../../utils/formatters';

/**
 * DayCell component - Represents a single day in the MonthlyCalendarView
 * 
 * @param {Object} props Component props
 * @param {Date} props.date The date object for this day cell
 * @param {boolean} props.isSelected Whether this day is currently selected
 * @param {boolean} props.isToday Whether this day is today
 * @param {boolean} props.isOutsideMonth Whether this day is outside the current month
 * @param {number|null} props.dailyTotal The net total of transactions for this day (can be null)
 * @param {boolean} props.hasIncome Whether this day has income
 * @param {boolean} props.hasExpense Whether this day has expense
 * @param {Function} props.onClick Function to call when the day is clicked
 * @returns {JSX.Element} A calendar day cell
 */
const DayCell = ({ 
  date, 
  isSelected, 
  isToday, 
  isOutsideMonth, 
  dailyTotal, 
  hasIncome,
  hasExpense,
  onClick 
}) => {
  // Create classNames based on props
  const cellClasses = useMemo(() => {
    return [
      styles.dayCell,
      isSelected ? styles.selected : '',
      isToday ? styles.today : '',
      isOutsideMonth ? styles.outsideMonth : ''
    ].filter(Boolean).join(' ');
  }, [isSelected, isToday, isOutsideMonth]);

  // Format the date as a number only (1, 2, 3, etc.)
  const dayNumber = format(date, 'd');
  
  // Determine if we need an indicator bar and which type
  const showIndicatorBar = dailyTotal !== undefined && dailyTotal !== null && dailyTotal !== 0;
  const indicatorBarClass = dailyTotal > 0 ? styles.incomeIndicatorBar : styles.expenseIndicatorBar;
  
  // Create an accessible label for the button that includes the date and transaction total
  const accessibleLabel = useMemo(() => {
    const formattedDate = format(date, 'd MMMM yyyy', { locale: frCA });
    if (dailyTotal !== undefined && dailyTotal !== null && dailyTotal !== 0) {
      return `${formattedDate}, solde net: ${formatCurrency(dailyTotal)}`;
    }
    return formattedDate;
  }, [date, dailyTotal]);
  
  // Handle click event
  const handleClick = () => {
    onClick(date);
  };
  
  return (
    <button
      type="button"
      className={cellClasses}
      onClick={handleClick}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
    >
      <span className={styles.dayNumber}>
        {dayNumber}
      </span>
      
      {showIndicatorBar && (
        <div className={styles.indicatorBarContainer}>
          <div className={`${styles.indicatorBar} ${indicatorBarClass}`}>
            {formatCurrency(dailyTotal, undefined, { minimumFractionDigits: 0 })}
          </div>
        </div>
      )}
      
      {/* Optional income/expense micro-indicators */}
      {!showIndicatorBar && (
        <div className={styles.microIndicators}>
          {hasIncome && <span className={styles.incomeIndicator} />}
          {hasExpense && <span className={styles.expenseIndicator} />}
        </div>
      )}
    </button>
  );
};

DayCell.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  isSelected: PropTypes.bool,
  isToday: PropTypes.bool,
  isOutsideMonth: PropTypes.bool,
  dailyTotal: PropTypes.number,
  hasIncome: PropTypes.bool,
  hasExpense: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

DayCell.defaultProps = {
  isSelected: false,
  isToday: false,
  isOutsideMonth: false,
  dailyTotal: null,
  hasIncome: false,
  hasExpense: false
};

export default DayCell; 