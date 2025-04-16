import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatRelativeDate } from '../../../utils/formatters';
import { deleteTransaction } from '../../../services/firebase/transactions';
import { getCategory } from '../../../services/firebase/categories';
import logger from '../../../services/logger';

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
  const [categoryMap, setCategoryMap] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);
  const [swipedTransactionId, setSwipedTransactionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartXRef = useRef(0);
  
  // Fetch category details for all transactions
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      const uniqueCategoryIds = [...new Set(
        transactions
          .filter(t => t.categoryId)
          .map(t => t.categoryId)
      )];
      
      const categoryDetailsMap = {};
      
      await Promise.all(
        uniqueCategoryIds.map(async (categoryId) => {
          try {
            const category = await getCategory(categoryId);
            if (category) {
              categoryDetailsMap[categoryId] = {
                name: category.name,
                color: category.color || '#919A7F'
              };
            }
          } catch (error) {
            logger.error('TransactionList', 'fetchCategoryDetails', 'Error fetching category', {
              categoryId,
              error
            });
          }
        })
      );
      
      setCategoryMap(categoryDetailsMap);
    };
    
    if (transactions.length > 0) {
      fetchCategoryDetails();
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
  
  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      logger.info('TransactionList', 'handleDeleteTransaction', 'Deleting transaction', {
        transactionId
      });
      
      await deleteTransaction(transactionId);
      
      logger.info('TransactionList', 'handleDeleteTransaction', 'Transaction deleted successfully');
      
      setSwipedTransactionId(null);
      
      if (onTransactionDeleted) {
        onTransactionDeleted(transactionId);
      }
    } catch (error) {
      logger.error('TransactionList', 'handleDeleteTransaction', 'Error deleting transaction', {
        transactionId,
        error
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
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
  
  // Primary colors from Zen/Tranquility theme
  const primaryColor = '#919A7F'; // Sage green
  const negativeColor = '#C17C74'; // Soft terra cotta for expenses
  const positiveColor = '#568E8D'; // Muted teal for income
  const backgroundColor = '#F3F0E8'; // Soft off-white
  
  // If no transactions, show empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div 
        className="empty-state"
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#88837A',
          marginBottom: '24px'
        }}>
          Aucune transaction à afficher
        </p>
        <Link 
          to="/add" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: primaryColor,
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'all 0.2s ease-out'
          }}
        >
          Ajouter une transaction
        </Link>
      </div>
    );
  }
  
  return (
    <div className="transaction-list">
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
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              marginBottom: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Day Header */}
            <div 
              className="day-header"
              style={{
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: isExpanded ? '1px solid #e9ecef' : 'none',
                cursor: 'pointer'
              }}
              onClick={() => toggleDay(dateKey)}
              role="button"
              tabIndex={0}
            >
              <div className="day-date" style={{ fontWeight: 500 }}>
                {formatRelativeDate(group.date)}
              </div>
              <div 
                className={`day-total ${dailyTotal < 0 ? 'negative' : 'positive'}`}
                style={{
                  color: dailyTotal < 0 ? negativeColor : positiveColor,
                  fontWeight: 600
                }}
              >
                {formatCurrency(dailyTotal, currency)}
              </div>
            </div>
            
            {/* Transactions */}
            {isExpanded && (
              <div 
                className="day-transactions"
                style={{
                  padding: '8px 0'
                }}
              >
                {group.transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="transaction-item-wrapper"
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      touchAction: 'pan-y'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, transaction.id)}
                    onTouchMove={(e) => handleTouchMove(e, transaction.id)}
                  >
                    {/* Delete Button (revealed on swipe) */}
                    <div
                      className="delete-button"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        backgroundColor: negativeColor,
                        color: 'white',
                        fontWeight: 500,
                        transform: swipedTransactionId === transaction.id ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </div>
                    
                    {/* Transaction Item */}
                    <div
                      className="transaction-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        borderBottom: '1px solid #f5f5f5',
                        backgroundColor: 'white',
                        transform: swipedTransactionId === transaction.id ? 'translateX(-80px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <div 
                        className="transaction-details"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div 
                          className="transaction-description"
                          style={{
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {transaction.isRecurringInstance && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#7A8D99', // Information color
                                marginRight: '4px'
                              }}
                              title="Transaction récurrente"
                            />
                          )}
                          {transaction.description}
                        </div>
                        
                        <div 
                          className="transaction-category"
                          style={{
                            fontSize: '0.85rem',
                            color: getCategoryColor(transaction),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getCategoryColor(transaction)
                            }}
                          />
                          {getCategoryName(transaction)}
                        </div>
                      </div>
                      
                      <div 
                        className={`transaction-amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}
                        style={{
                          fontWeight: 600,
                          color: transaction.amount < 0 ? negativeColor : positiveColor
                        }}
                      >
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