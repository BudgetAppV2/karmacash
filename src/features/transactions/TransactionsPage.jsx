import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBudgets } from '../../contexts/BudgetContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useDateRange } from '../../contexts/DateContext';
import { formatDate } from '../../utils/formatters';
import TransactionListWithFetch from './components/TransactionListWithFetch';
import TransactionList from './components/TransactionList';
import MonthlyCalendarView from '../../components/MonthlyCalendarView';
import UniversalDatePicker from '../../components/ui/UniversalDatePicker';
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
  const { 
    viewMode, 
    currentDate, 
    startDate, 
    endDate, 
    setCurrentDate 
  } = useDateRange();
  
  // State for error handling
  const [error, setError] = useState('');
  
  // State for calendar selected date and monthly transactions
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  
  // Colors from Zen/Tranquility theme  
  const primaryColor = '#919A7F'; // Sage green
  
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
  
  // Handle calendar month change
  const handleCalendarMonthChange = (newDate) => {
    setCurrentDate(newDate);
    logger.debug('TransactionsPage', 'handleCalendarMonthChange', 'Calendar month changed', {
      newDate
    });
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
      
      {/* Universal Date Picker */}
      <UniversalDatePicker 
        showViewModeToggle={true}
        style={{ marginBottom: '24px' }}
      />
      
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