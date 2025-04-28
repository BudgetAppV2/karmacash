import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatYearMonth, formatDate } from '../../utils/formatters';
import TransactionListWithFetch from './components/TransactionListWithFetch';
import TransactionList from './components/TransactionList';
import MonthlyCalendarView from '../../components/MonthlyCalendarView';
import { isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { getTransactionsInRange } from '../../services/firebase/transactions';
import logger from '../../services/logger';

/**
 * TransactionsPage component for displaying and managing transactions
 * 
 * @returns {JSX.Element} Transactions page
 */
const TransactionsPage = () => {
  const { currentUser } = useAuth();
  const { selectedBudgetId } = useBudgets();
  const { settings } = useSettings();
  
  // State for error handling
  const [error, setError] = useState('');
  
  // Period state (week or month)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // State for calendar selected date and monthly transactions
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  
  // Colors from Zen/Tranquility theme
  const primaryColor = '#919A7F'; // Sage green
  const secondaryColor = '#A58D7F'; // Taupe
  const backgroundColor = '#F3F0E8'; // Soft off-white
  
  // Calculate start and end dates based on current date and view mode
  useEffect(() => {
    const date = new Date(currentDate);
    let start, end;
    
    if (viewMode === 'week') {
      // Set to beginning of the week (Sunday)
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      start = new Date(date);
      start.setDate(date.getDate() - day); // Go back to Sunday
      start.setHours(0, 0, 0, 0);
      
      // Set to end of the week (Saturday)
      end = new Date(start);
      end.setDate(start.getDate() + 6); // Go forward to Saturday
      end.setHours(23, 59, 59, 999);
    } else {
      // For month view, include all days shown in the calendar grid (including adjacent months)
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      // Use weekStartsOn: 1 to match the calendar's Monday start
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    
    setStartDate(start);
    setEndDate(end);
    
    logger.debug('TransactionsPage', 'calculateDateRange', 'Date range calculated', {
      viewMode,
      start,
      end
    });
  }, [currentDate, viewMode]);
  
  // Fetch monthly transactions data when in month view
  useEffect(() => {
    if (viewMode !== 'month' || !currentUser || !selectedBudgetId) return;
    
    const fetchMonthlyTransactions = async () => {
      setIsMonthlyLoading(true);
      setError('');
      
      try {
        logger.debug('TransactionsPage', 'fetchMonthlyTransactions', 'Fetching transactions for full calendar view', {
          budgetId: selectedBudgetId,
          start: startDate,
          end: endDate
        });
        
        const fetchedTransactions = await getTransactionsInRange(
          selectedBudgetId,
          startDate,
          endDate
        );
        
        logger.debug('TransactionsPage', 'fetchMonthlyTransactions', `Fetched ${fetchedTransactions.length} transactions for the calendar view`, {
          budgetId: selectedBudgetId
        });
        setMonthlyTransactions(fetchedTransactions);
      } catch (err) {
        logger.error('TransactionsPage', 'fetchMonthlyTransactions', 'Error fetching transactions', {
          error: err.message,
          budgetId: selectedBudgetId
        });
        setError(`Erreur: ${err.message}`);
      } finally {
        setIsMonthlyLoading(false);
      }
    };
    
    fetchMonthlyTransactions();
  }, [currentUser, selectedBudgetId, startDate, endDate, viewMode]);

  // Filter transactions for the selected calendar day
  const filteredTransactionsForDay = useMemo(() => {
    console.log('[Filter] Calculating for selectedDate:', calendarSelectedDate);
    if (!calendarSelectedDate || !monthlyTransactions.length) {
      console.log('[Filter] No selected date or transactions, returning empty array.');
      return [];
    }
    
    // Extract UTC components from the selected date for reliable comparison
    const selectedYear = calendarSelectedDate.getUTCFullYear();
    const selectedMonth = calendarSelectedDate.getUTCMonth();
    const selectedDay = calendarSelectedDate.getUTCDate();
    
    return monthlyTransactions.filter(transaction => {
      // Convert transaction date to JS Date if it's a Firestore Timestamp
      const transactionDate = transaction.date && typeof transaction.date.toDate === 'function'
        ? transaction.date.toDate()
        : new Date(transaction.date);
      
      // Compare UTC date components instead of using isSameDay
      const txYear = transactionDate.getUTCFullYear();
      const txMonth = transactionDate.getUTCMonth();
      const txDay = transactionDate.getUTCDate();
      
      // Match exact UTC year, month, and day values
      return txYear === selectedYear && txMonth === selectedMonth && txDay === selectedDay;
    });
  }, [calendarSelectedDate, monthlyTransactions]);
  
  // Handler for calendar day selection
  const handleCalendarDateSelect = (date) => {
    console.log('[State] Setting calendarSelectedDate to:', date); // Log date being set
    setCalendarSelectedDate(date);
    logger.debug('TransactionsPage', 'handleCalendarDateSelect', 'Calendar date selected', {
      date
    });
  };
  
  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    
    setCurrentDate(newDate);
    
    logger.debug('TransactionsPage', 'handlePrevious', 'Navigated to previous period', {
      viewMode,
      newDate
    });
  };
  
  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
    
    logger.debug('TransactionsPage', 'handleNext', 'Navigated to next period', {
      viewMode,
      newDate
    });
  };
  
  // Handle calendar month change
  const handleCalendarMonthChange = (newDate) => {
    setCurrentDate(newDate);
    logger.debug('TransactionsPage', 'handleCalendarMonthChange', 'Calendar month changed', {
      newDate
    });
  };
  
  // Format period label based on view mode
  const formatPeriodLabel = () => {
    if (viewMode === 'week') {
      return `${formatDate(startDate, 'd MMM yyyy')} - ${formatDate(endDate, 'd MMM yyyy')}`;
    } else {
      return formatYearMonth(startDate.getFullYear(), startDate.getMonth());
    }
  };
  
  // Handle transaction loading error
  const handleTransactionError = (error) => {
    setError(`Erreur: ${error.message}`);
    logger.error('TransactionsPage', 'handleTransactionError', 'Error from transaction list', {
      error: error.message
    });
  };
  
  // Handle transaction deletion
  const handleTransactionDeleted = (transactionId) => {
    setMonthlyTransactions(prev => prev.filter(t => t.id !== transactionId));
  };
  
  return (
    <div 
      className="transactions-page"
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <h1 style={{ 
          color: '#2F2F2F', 
          margin: 0,
          fontSize: '2rem',
          fontWeight: 500
        }}>
          Transactions
        </h1>
        
        <Link 
          to="/add" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: primaryColor,
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'all 0.2s ease-out'
          }}
        >
          <span>+</span> Ajouter
        </Link>
      </div>
      
      {/* Period Selection and Navigation */}
      <div 
        className="period-navigation"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {/* View Mode Toggle */}
        <div 
          className="view-mode-toggle"
          style={{
            display: 'flex',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #e9ecef',
            width: '100%',
            maxWidth: '250px'
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('week')}
            style={{
              padding: '8px 12px',
              flex: '1 1 50%',
              backgroundColor: viewMode === 'week' ? primaryColor : 'white',
              color: viewMode === 'week' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            style={{
              padding: '8px 12px',
              flex: '1 1 50%',
              backgroundColor: viewMode === 'month' ? primaryColor : 'white',
              color: viewMode === 'month' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Mois
          </button>
        </div>
        
        {/* Period Navigation */}
        <div
          className="period-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '16px'
          }}
        >
          <button
            type="button"
            onClick={handlePrevious}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid #e9ecef',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#88837A'
            }}
          >
            ←
          </button>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#717171'
            }}
          >
            {formatPeriodLabel()}
          </div>
          <button
            type="button"
            onClick={handleNext}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: '1px solid #e9ecef',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#88837A'
            }}
          >
            →
          </button>
        </div>
      </div>
      
      {/* Display error if there is one */}
      {error && (
        <div 
          style={{
            backgroundColor: '#FBE8E4',
            border: '1px solid #F4CFCA',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#B3261E',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      )}
      
      {/* Conditional rendering based on viewMode */}
      {viewMode === 'week' && (
        <TransactionListWithFetch 
          startDate={startDate} 
          endDate={endDate}
          onError={handleTransactionError}
        />
      )}
      
      {viewMode === 'month' && (
        <>
          <MonthlyCalendarView 
            onDateSelect={handleCalendarDateSelect} 
            onMonthChange={handleCalendarMonthChange}
            currentDate={currentDate}
            transactions={monthlyTransactions}
          />
          
          {/* Selected day transactions section */}
          <div 
            style={{ 
              marginTop: '24px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <h3 
              style={{ 
                fontSize: '1.1rem', 
                margin: '0 0 16px 0',
                color: '#2F2F2F',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Transactions du {formatDate(calendarSelectedDate, 'd MMMM yyyy')}
            </h3>
            
            {isMonthlyLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#717171' }}>
                Chargement des transactions...
              </div>
            ) : (
              <>
                {filteredTransactionsForDay.length > 0 ? (
                  <TransactionList 
                    transactions={filteredTransactionsForDay}
                    onTransactionDeleted={handleTransactionDeleted}
                  />
                ) : (
                  <div style={{ 
                    padding: '20px 0', 
                    textAlign: 'center', 
                    color: '#717171',
                    fontStyle: 'italic'
                  }}>
                    Aucune transaction pour cette journée
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionsPage;