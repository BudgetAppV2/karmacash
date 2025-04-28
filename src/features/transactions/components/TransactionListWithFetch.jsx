import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBudgets } from '../../../contexts/BudgetContext';
import { getTransactionsInRange } from '../../../services/firebase/transactions';
import { Timestamp } from 'firebase/firestore';
import logger from '../../../services/logger';
import TransactionList from './TransactionList';
import './TransactionList.css';

const TransactionListWithFetch = ({ startDate, endDate, onError }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const { selectedBudgetId } = useBudgets();
  const navigate = useNavigate();
  
  // Fetch transactions when date range changes
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser || !selectedBudgetId) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        logger.debug('Fetching transactions for date range', {
          component: 'TransactionListWithFetch',
          operation: 'fetchTransactions',
          budgetId: selectedBudgetId,
          startDate,
          endDate
        });
        
        // Convert string dates to Date objects if needed
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        
        // Adjust end date to include the entire day
        if (end instanceof Date) {
          end.setHours(23, 59, 59, 999);
        }
        
        const fetchedTransactions = await getTransactionsInRange(
          selectedBudgetId,
          start,
          end
        );
        
        // Log details about fetched transactions for debugging
        logger.debug('Transactions fetched', {
          component: 'TransactionListWithFetch',
          operation: 'fetchTransactions',
          budgetId: selectedBudgetId,
          count: fetchedTransactions.length,
          sampleTransaction: fetchedTransactions.length > 0 
            ? JSON.stringify(fetchedTransactions[0]) 
            : 'No transactions'
        });
        
        setTransactions(fetchedTransactions);
        setError('');
      } catch (err) {
        logger.error('Error fetching transactions', {
          component: 'TransactionListWithFetch',
          operation: 'fetchTransactions',
          budgetId: selectedBudgetId,
          error: err.message
        });
        setError('Erreur lors du chargement des transactions');
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [currentUser, selectedBudgetId, startDate, endDate, onError]);
  
  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Helper to format date
  const formatDate = (date) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    const jsDate = date instanceof Timestamp ? date.toDate() : new Date(date);
    
    return new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(jsDate);
  };
  
  // Calculate financial summary
  const financialSummary = {
    income: transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0),
    expense: transactions.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0),
    balance: transactions.reduce((sum, t) => sum + t.amount, 0)
  };
  
  // Retry loading transactions
  const handleRetry = () => {
    setIsLoading(true);
    setError('');
    // This will trigger the useEffect again
  };
  
  // Handle transaction deletion
  const handleTransactionDeleted = (transactionId) => {
    logger.info('TransactionListWithFetch', 'handleTransactionDeleted', 'Transaction deleted', {
      transactionId
    });
    
    // Update the local state by removing the deleted transaction
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="transaction-list-loading">
        <p>Chargement des transactions...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="transaction-list-error">
        <p>{error}</p>
        <button 
          onClick={handleRetry}
          className="retry-button"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  // Render empty state
  if (transactions.length === 0) {
    return (
      <div className="transaction-list-empty">
        <p>Aucune transaction à afficher</p>
        <button 
          onClick={() => navigate('/add')}
          className="add-transaction-btn"
        >
          Ajouter une transaction
        </button>
      </div>
    );
  }
  
  // Render transaction list
  return (
    <div className="transaction-list-container">
      {/* Financial Summary */}
      <div className="financial-summary">
        <h3>Résumé Financier: {formatDate(new Date(startDate))} - {formatDate(new Date(endDate))}</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div>
            <strong>Revenus</strong>
            <p style={{ color: '#568E8D' }}>{formatCurrency(financialSummary.income)}</p>
          </div>
          
          <div>
            <strong>Dépenses</strong>
            <p style={{ color: '#C17C74' }}>{formatCurrency(financialSummary.expense)}</p>
          </div>
          
          <div>
            <strong>Solde</strong>
            <p style={{ color: financialSummary.balance >= 0 ? '#568E8D' : '#C17C74' }}>
              {formatCurrency(financialSummary.balance)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Transaction List with Swipe-to-Delete */}
      <TransactionList 
        transactions={transactions} 
        onTransactionDeleted={handleTransactionDeleted}
        currency="CAD"
      />
      
      <div className="transaction-count">
        <p>{transactions.length} transactions</p>
      </div>
    </div>
  );
};

export default TransactionListWithFetch; 