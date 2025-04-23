import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatRelativeDate } from '../../../utils/formatters';
import { deleteTransaction } from '../../../services/firebase/transactions';
import { getCategory } from '../../../services/firebase/categories';
import { useToast } from '../../../contexts/ToastContext';
import logger from '../../../services/logger';
import './TransactionList.css';

/**
 * TransactionList component that displays transactions grouped by day
 * 
 * @param {Object} props Component props
 * @param {Array} props.transactions Array of transactions to display
 * @param {Function} props.onTransactionDeleted Callback when a transaction is deleted
 * @param {string} props.currency Currency code for formatting (default: 'CAD')
 * @returns {JSX.Element} Transaction list grouped by day
 */
const TransactionList = ({ transactions, onTransactionDeleted, currency = 'CAD' }) => {
  const { showSuccess, showError } = useToast();
  const [categoryMap, setCategoryMap] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);
  const [swipedTransactionId, setSwipedTransactionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const touchStartXRef = useRef(0);
  
  // Fetch category details for all transactions
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      // Make sure we have transactions and we can get the userId
      if (!transactions.length || !transactions[0].userId) {
        logger.warn('TransactionList', 'fetchCategoryDetails', 'No transactions or missing userId');
        return;
      }
      
      const userId = transactions[0].userId;
      
      const uniqueCategoryIds = [...new Set(
        transactions
          .filter(t => t.categoryId)
          .map(t => t.categoryId)
      )];
      
      const categoryDetailsMap = {};
      
      await Promise.all(
        uniqueCategoryIds.map(async (categoryId) => {
          try {
            const category = await getCategory(userId, categoryId);
            if (category) {
              categoryDetailsMap[categoryId] = {
                name: category.name,
                color: category.color || '#919A7F'
              };
            }
          } catch (error) {
            logger.error('TransactionList', 'fetchCategoryDetails', 'Error fetching category', {
              userId,
              categoryId,
              error: error.message
            });
          }
        })
      );
      
      setCategoryMap(categoryDetailsMap);
    };
    
    if (transactions.length > 0) {
      fetchCategoryDetails();
      
      // Auto-expand the first day if there are transactions
      const firstDate = new Date(transactions[0].date);
      firstDate.setHours(0, 0, 0, 0);
      setExpandedDay(firstDate.toISOString());
      
      // Hide swipe hint after 5 seconds
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [transactions]);
  
  // Group transactions by day
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date,
        transactions: []
      };
    }
    
    groups[dateKey].transactions.push(transaction);
    return groups;
  }, {});
  
  // Sort groups by date (most recent first)
  const sortedGroups = Object.values(groupedTransactions).sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );
  
  // Handle day toggle (expand/collapse)
  const toggleDay = (dateKey) => {
    if (expandedDay === dateKey) {
      setExpandedDay(null);
    } else {
      setExpandedDay(dateKey);
      logger.debug('TransactionList', 'toggleDay', 'Expanded day group', {
        date: dateKey
      });
    }
  };
  
  // Handle swipe start
  const handleTouchStart = (e, transactionId) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  
  // Handle swipe move
  const handleTouchMove = (e, transactionId) => {
    if (swipedTransactionId && swipedTransactionId !== transactionId) {
      return;
    }
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    if (diff > 50) {
      setSwipedTransactionId(transactionId);
    } else if (diff < -50) {
      setSwipedTransactionId(null);
    }
  };
  
  // Mouse events for desktop users
  const handleMouseDown = (e, transactionId) => {
    touchStartXRef.current = e.clientX;
    
    const handleMouseMove = (moveEvent) => {
      if (swipedTransactionId && swipedTransactionId !== transactionId) {
        return;
      }
      
      const mouseMoveX = moveEvent.clientX;
      const diff = touchStartXRef.current - mouseMoveX;
      
      if (diff > 50) {
        setSwipedTransactionId(transactionId);
      } else if (diff < -50) {
        setSwipedTransactionId(null);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Get the transaction to find the userId
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      const userId = transaction.userId;
      
      logger.info('TransactionList', 'handleDeleteTransaction', 'Deleting transaction', {
        userId,
        transactionId
      });
      
      await deleteTransaction(userId, transactionId);
      
      logger.info('TransactionList', 'handleDeleteTransaction', 'Transaction deleted successfully');
      
      setSwipedTransactionId(null);
      
      if (onTransactionDeleted) {
        onTransactionDeleted(transactionId);
      }
      
      showSuccess('Transaction supprimée avec succès');
    } catch (error) {
      logger.error('TransactionList', 'handleDeleteTransaction', 'Error deleting transaction', {
        transactionId,
        error: error.message
      });
      showError('Échec de la suppression de la transaction');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Cancel swipe on click elsewhere
  const handlePageClick = (e) => {
    if (swipedTransactionId && !e.target.closest('.transaction-item-wrapper')) {
      setSwipedTransactionId(null);
    }
  };
  
  useEffect(() => {
    document.addEventListener('click', handlePageClick);
    return () => {
      document.removeEventListener('click', handlePageClick);
    };
  }, [swipedTransactionId]);
  
  // Get category name for a transaction
  const getCategoryName = (transaction) => {
    if (transaction.categoryId && categoryMap[transaction.categoryId]) {
      return categoryMap[transaction.categoryId].name;
    }
    return 'Non catégorisé';
  };
  
  // Get category color for a transaction
  const getCategoryColor = (transaction) => {
    if (transaction.categoryId && categoryMap[transaction.categoryId]) {
      return categoryMap[transaction.categoryId].color;
    }
    return '#919A7F'; // Default sage green
  };
  
  // If no transactions, show empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-message">
          Aucune transaction à afficher
        </p>
        <Link 
          to="/add" 
          className="add-transaction-btn"
        >
          Ajouter une transaction
        </Link>
      </div>
    );
  }
  
  return (
    <div className="transaction-list">
      {/* Swipe Hint - Only shows initially */}
      {showSwipeHint && transactions.length > 0 && (
        <div className="swipe-hint">
          <span className="swipe-hint-icon">←</span>
          Glissez une transaction vers la gauche pour la supprimer
        </div>
      )}
    
      {sortedGroups.map((group) => {
        // Calculate daily total
        const dailyTotal = group.transactions.reduce(
          (total, transaction) => total + transaction.amount, 
          0
        );
        
        // Format date key for comparison
        const dateKey = group.date.toISOString();
        const isExpanded = expandedDay === dateKey;
        
        return (
          <div 
            key={dateKey}
            className="transaction-day-card"
          >
            {/* Day Header */}
            <div 
              className="day-header"
              onClick={() => toggleDay(dateKey)}
              role="button"
              tabIndex={0}
            >
              <div className="day-date">
                {formatRelativeDate(group.date)}
              </div>
              <div className={`day-total ${dailyTotal < 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(dailyTotal, currency)}
              </div>
            </div>
            
            {/* Transactions */}
            {isExpanded && (
              <div className="day-transactions">
                {group.transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="transaction-item-wrapper"
                    onTouchStart={(e) => handleTouchStart(e, transaction.id)}
                    onTouchMove={(e) => handleTouchMove(e, transaction.id)}
                    onMouseDown={(e) => handleMouseDown(e, transaction.id)}
                  >
                    {/* Delete Button (revealed on swipe) */}
                    <div
                      className={`delete-button ${swipedTransactionId === transaction.id ? 'visible' : 'hidden'}`}
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </div>
                    
                    {/* Transaction Item */}
                    <div
                      className={`transaction-item ${swipedTransactionId === transaction.id ? 'swiped' : ''}`}
                    >
                      <div className="transaction-details">
                        <div className="transaction-description">
                          {transaction.isRecurringInstance && (
                            <span
                              className="recurring-indicator"
                              title="Transaction récurrente"
                            />
                          )}
                          {transaction.description}
                        </div>
                        
                        <div 
                          className="transaction-category"
                          style={{ color: getCategoryColor(transaction) }}
                        >
                          <span
                            className="category-indicator"
                            style={{ backgroundColor: getCategoryColor(transaction) }}
                          />
                          {getCategoryName(transaction)}
                        </div>
                      </div>
                      
                      <div className={`transaction-amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}>
                        {formatCurrency(transaction.amount, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

TransactionList.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.oneOfType([
        PropTypes.instanceOf(Date),
        PropTypes.string
      ]).isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      categoryId: PropTypes.string,
      isRecurringInstance: PropTypes.bool
    })
  ).isRequired,
  onTransactionDeleted: PropTypes.func,
  currency: PropTypes.string
};

export default TransactionList; 