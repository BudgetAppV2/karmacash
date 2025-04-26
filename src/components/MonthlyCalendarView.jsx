import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { frCA } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import DayCell from './calendar/DayCell';
import styles from './calendar/MonthlyCalendarView.module.css';

/**
 * MonthlyCalendarView - A calendar component that displays a month view
 * Follows KarmaCash Zen/Tranquility Theme [B3.4]
 * 
 * @param {Object} props Component props
 * @param {Function} props.onDateSelect Optional callback when a date is selected
 * @param {Array} props.transactions Array of transactions to display in the calendar
 * @param {Date} props.currentDate Optional controlled current date (month/year)
 * @param {Function} props.onMonthChange Optional callback when month navigation occurs
 * @returns {JSX.Element} Monthly calendar view component
 */
const MonthlyCalendarView = ({ 
  onDateSelect, 
  transactions = [],
  currentDate: externalCurrentDate,
  onMonthChange
}) => {
  console.log('MonthlyCalendarView rendered'); // Debug render cycles

  // State to manage the currently displayed month/year
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  
  // Use either the controlled prop or internal state
  const currentDate = externalCurrentDate || internalCurrentDate;
  
  // State to track the selected day
  const [selectedDate, setSelectedDate] = useState(null);
  // State to store daily transaction totals
  const [dailyTotals, setDailyTotals] = useState({});
  
  // Get current user from auth context
  const { currentUser } = useAuth();

  // Handler for navigating to the previous month
  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    console.log('Navigating to previous month:', newDate); // Debug navigation
    
    // If controlled via props, call the callback
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      // Otherwise use internal state
      setInternalCurrentDate(newDate);
    }
  };

  // Handler for navigating to the next month
  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    console.log('Navigating to next month:', newDate); // Debug navigation
    
    // If controlled via props, call the callback
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      // Otherwise use internal state
      setInternalCurrentDate(newDate);
    }
  };

  // Handler for day cell clicks
  const handleDayClick = (date) => {
    setSelectedDate(date);
    // Call the onDateSelect callback if provided
    if (onDateSelect && typeof onDateSelect === 'function') {
      onDateSelect(date);
    }
  };

  // Memoize calendar date calculations to prevent recalculation on every render
  // This helps prevent infinite re-renders if these values are used in effect dependencies
  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    // Generate array of all dates to display
    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });

    return {
      monthStart,
      monthEnd,
      calendarStart,
      calendarEnd,
      calendarDays
    };
  }, [currentDate]); // Only recalculate when currentDate changes
  
  // Calculate daily totals when transactions change
  useEffect(() => {
    console.log('Effect: Processing transactions', { count: transactions.length }); // Debug transactions processing
    
    if (!transactions.length) {
      setDailyTotals({});
      return;
    }
    
    // Create a new object to store daily totals
    const totals = {};
    
    // Calculate totals for each day with transactions
    transactions.forEach(transaction => {
      // Convert Firestore Timestamp to Date if needed
      const transactionDate = transaction.date && typeof transaction.date.toDate === 'function' 
        ? transaction.date.toDate() 
        : new Date(transaction.date);
      
      // Extract UTC components for consistent date handling
      const utcYear = transactionDate.getUTCFullYear();
      const utcMonth = transactionDate.getUTCMonth();
      const utcDay = transactionDate.getUTCDate();
      
      // Format date as a string key using UTC components (YYYY-MM-DD)
      const dateKey = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
      
      // Initialize total for this day if it doesn't exist
      if (!totals[dateKey]) {
        totals[dateKey] = 0;
      }
      
      // Add transaction amount to the daily total
      totals[dateKey] += transaction.amount;
    });
    
    console.log('Calculated daily totals:', Object.keys(totals).length, 'days with transactions');
    setDailyTotals(totals);
  }, [transactions]); // Only recalculate when transactions change

  // Week day names in French, starting with Monday
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Destructure calendarDays from memoized value
  const { calendarDays } = calendarDates;

  return (
    <div className={styles.calendarContainer}>
      {/* Calendar Header with month/year display and navigation */}
      <div className={styles.calendarHeader}>
        <button 
          className={styles.navButton}
          onClick={handlePrevMonth}
          aria-label="Mois précédent"
        >
          &lt;
        </button>
        
        <h2 className={styles.monthYearDisplay}>
          {format(currentDate, 'LLLL yyyy', { locale: frCA })}
        </h2>
        
        <button 
          className={styles.navButton}
          onClick={handleNextMonth}
          aria-label="Mois suivant"
        >
          &gt;
        </button>
      </div>

      {/* Week days header */}
      <div className={styles.weekdayHeader}>
        {weekDays.map(day => (
          <div key={day} className={styles.weekdayCell}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.daysGrid}>
        {calendarDays.map(date => {
          // Extract UTC components for consistent date lookup
          const utcYear = date.getUTCFullYear();
          const utcMonth = date.getUTCMonth();
          const utcDay = date.getUTCDate();
          
          // Create a date key for looking up totals using UTC components (YYYY-MM-DD)
          const dateKey = `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDay).padStart(2, '0')}`;
          
          // Get the daily total for this date (or 0 if no transactions)
          const dailyTotal = dailyTotals[dateKey] || 0;
          
          // Check if there are transactions for this day
          const hasTransactions = dateKey in dailyTotals;
          
          // Check if there are income and expense transactions for this day
          const hasIncome = hasTransactions && dailyTotal > 0;
          const hasExpense = hasTransactions && dailyTotal < 0;
          
          return (
            <DayCell
              key={date.toString()}
              date={date}
              isSelected={selectedDate && 
                date.getUTCFullYear() === selectedDate.getUTCFullYear() && 
                date.getUTCMonth() === selectedDate.getUTCMonth() && 
                date.getUTCDate() === selectedDate.getUTCDate()
              }
              isToday={
                date.getUTCFullYear() === new Date().getUTCFullYear() &&
                date.getUTCMonth() === new Date().getUTCMonth() &&
                date.getUTCDate() === new Date().getUTCDate()
              }
              isOutsideMonth={date.getUTCMonth() !== currentDate.getUTCMonth()}
              dailyTotal={hasTransactions ? dailyTotal : null}
              hasIncome={hasIncome}
              hasExpense={hasExpense}
              onClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyCalendarView; 