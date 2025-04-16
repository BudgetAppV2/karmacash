import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTransactionsInRange } from '../../services/firebase/transactions';
import { formatYearMonth, formatDate } from '../../utils/formatters';
import TransactionList from './components/TransactionList';
import TransactionSummary from './components/TransactionSummary';
import logger from '../../services/logger';

/**
 * TransactionsPage component for displaying and managing transactions
 * 
 * @returns {JSX.Element} Transactions page
 */
const TransactionsPage = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  
  // State for transactions and loading
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Period state (week or month)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
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
      // Set to beginning of the month
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      
      // Set to end of the month
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
  
  // Fetch transactions within the date range
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser || !startDate || !endDate) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        logger.info('TransactionsPage', 'fetchTransactions', 'Fetching transactions', {
          userId: currentUser.uid,
          startDate,
          endDate,
          viewMode
        });
        
        const fetchedTransactions = await getTransactionsInRange(
          currentUser.uid, 
          startDate, 
          endDate,
          { orderDirection: 'desc' }
        );
        
        setTransactions(fetchedTransactions);
        
        logger.info('TransactionsPage', 'fetchTransactions', 'Transactions fetched successfully', {
          count: fetchedTransactions.length
        });
      } catch (error) {
        logger.error('TransactionsPage', 'fetchTransactions', 'Error fetching transactions', {
          error
        });
        setError('Erreur lors du chargement des transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [currentUser, startDate, endDate]);
  
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
  
  // Format period label based on view mode
  const formatPeriodLabel = () => {
    if (viewMode === 'week') {
      return `${formatDate(startDate, { year: 'numeric', month: 'short', day: 'numeric' })} - ${formatDate(endDate, { year: 'numeric', month: 'short', day: 'numeric' })}`;
    } else {
      return formatYearMonth(startDate.getFullYear(), startDate.getMonth());
    }
  };
  
  // Handle transaction deletion
  const handleTransactionDeleted = (transactionId) => {
    // Update local state to remove the deleted transaction
    setTransactions(prevTransactions => 
      prevTransactions.filter(t => t.id !== transactionId)
    );
    
    logger.info('TransactionsPage', 'handleTransactionDeleted', 'Transaction removed from list', {
      transactionId
    });
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
          justifyContent: 'space-between',
          alignItems: 'center',
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
            border: '1px solid #e9ecef'
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('week')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'week' ? primaryColor : 'white',
              color: viewMode === 'week' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'month' ? primaryColor : 'white',
              color: viewMode === 'month' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
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
          
          <span 
            className="period-label"
            style={{
              fontWeight: 500,
              minWidth: '180px',
              textAlign: 'center'
            }}
          >
            {formatPeriodLabel()}
          </span>
          
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
        
        {/* Today Button */}
        <button
          type="button"
          onClick={() => setCurrentDate(new Date())}
          style={{
            padding: '8px 16px',
            backgroundColor: backgroundColor,
            color: '#2F2F2F',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Aujourd'hui
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          color: '#b71c1c',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          color: '#88837A'
        }}>
          Chargement...
        </div>
      ) : (
        <>
          {/* Transaction Summary */}
          <TransactionSummary 
            transactions={transactions}
            currency={settings?.currency || 'CAD'}
            period={formatPeriodLabel()}
          />
          
          {/* Transaction List */}
          <TransactionList 
            transactions={transactions}
            onTransactionDeleted={handleTransactionDeleted}
            currency={settings?.currency || 'CAD'}
          />
        </>
      )}
    </div>
  );
};

export default TransactionsPage;