import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatRelativeDate } from '../../../utils/formatters';
import { deleteTransaction } from '../../../services/firebase/transactions';
import { getCategory } from '../../../services/firebase/categories';
import { useToast } from '../../../contexts/ToastContext';
import { useBudgets } from '../../../contexts/BudgetContext';
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
  const { selectedBudgetId } = useBudgets();
  const [categoryMap, setCategoryMap] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);
  const [swipedTransactionId, setSwipedTransactionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const touchStartXRef = useRef(0);
  const swipeThreshold = 70; // Pixels needed to trigger the swipe action
  const prefersReducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = () => {
      prefersReducedMotion.current = mediaQuery.matches;
    };
    
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);
  
  // Fetch category details for all transactions
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      // Make sure we have transactions and a selected budget
      if (!transactions.length || !selectedBudgetId) {
        logger.warn('TransactionList', 'fetchCategoryDetails', 'No transactions or missing budgetId', {
          transactionCount: transactions.length,
          selectedBudgetId
        });
        return;
      }
      
      console.log(">>> TRANSACTION LIST DEBUG: Fetching categories for transactions", {
        transactionCount: transactions.length,
        budgetId: selectedBudgetId,
        sampleTransaction: transactions[0]
      });
      
      const uniqueCategoryIds = [...new Set(
        transactions
          .filter(t => t.categoryId)
          .map(t => t.categoryId)
      )];
      
      console.log(">>> TRANSACTION LIST DEBUG: Unique category IDs to fetch:", uniqueCategoryIds);
      
      const categoryDetailsMap = {};
      
      await Promise.all(
        uniqueCategoryIds.map(async (categoryId) => {
          try {
            console.log(">>> TRANSACTION LIST DEBUG: Fetching category details", {
              budgetId: selectedBudgetId,
              categoryId
            });
            
            const category = await getCategory(selectedBudgetId, categoryId);
            
            console.log(">>> TRANSACTION LIST DEBUG: Category fetch result", {
              categoryId,
              category: category ? { 
                id: category.id, 
                name: category.name 
              } : 'not found'
            });
            
            if (category) {
              categoryDetailsMap[categoryId] = {
                name: category.name,
                color: category.color || '#919A7F'
              };
            } else {
              logger.warn('TransactionList', 'fetchCategoryDetails', 'Category not found', {
                budgetId: selectedBudgetId,
                categoryId
              });
              // Set a placeholder for missing categories
              categoryDetailsMap[categoryId] = {
                name: 'Catégorie supprimée',
                color: '#919A7F'
              };
            }
          } catch (error) {
            logger.error('TransactionList', 'fetchCategoryDetails', 'Error fetching category', {
              budgetId: selectedBudgetId,
              categoryId,
              error: error.message
            });
            // Set an error state for this category
            categoryDetailsMap[categoryId] = {
              name: 'Erreur de chargement',
              color: '#919A7F'
            };
          }
        })
      );
      
      console.log(">>> TRANSACTION LIST DEBUG: Final category map:", categoryDetailsMap);
      
      setCategoryMap(categoryDetailsMap);
    };
    
    if (transactions.length > 0 && selectedBudgetId) {
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
  }, [transactions, selectedBudgetId]);
  
  // Group transactions by day
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    // Check if date is a Firestore Timestamp and convert properly
    const jsDate = transaction.date && typeof transaction.date.toDate === 'function' 
      ? transaction.date.toDate() // Convert Firestore Timestamp to JS Date
      : new Date(transaction.date); // Handle regular Date strings/objects
    
    // Manually extract UTC components for reliable date key
    const year = jsDate.getUTCFullYear();
    const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = jsDate.getUTCDate().toString().padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`; // Create yyyy-MM-dd key directly
    
    if (!groups[dateKey]) {
      // Parse the dateKey components for creating a UTC midnight date
      const year = parseInt(dateKey.substring(0, 4), 10);
      const month = parseInt(dateKey.substring(5, 7), 10) - 1; // Back to 0-indexed
      const day = parseInt(dateKey.substring(8, 10), 10);
      
      groups[dateKey] = {
        dateKey: dateKey,
        // Store a JS Date object representing UTC midnight for this day
        date: new Date(Date.UTC(year, month, day)), 
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
  
  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e, dateKey) => {
    // Toggle on Enter or Space key
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Prevent scrolling on space
      toggleDay(dateKey);
    }
  };
  
  // Handle swipe start
  const handleTouchStart = (e, transactionId) => {
    // Close any previously swiped item when starting a new swipe
    if (swipedTransactionId && swipedTransactionId !== transactionId) {
      setSwipedTransactionId(null);
    }
    
    touchStartXRef.current = e.touches[0].clientX;
  };
  
  // Handle swipe move - enhanced for smoother iOS-like feel
  const handleTouchMove = (e, transactionId) => {
    if (swipedTransactionId && swipedTransactionId !== transactionId) {
      return;
    }
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    // Use a higher threshold for more intentional swipes
    if (diff > swipeThreshold) {
      setSwipedTransactionId(transactionId);
      // Add haptic feedback if available (iOS)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10); // Subtle vibration
      }
    } else if (diff < -20) { // Lower threshold to close, for easier reset
      setSwipedTransactionId(null);
    }
  };
  
  // Handle touch end - allows for completing the swipe on release
  const handleTouchEnd = (e, transactionId) => {
    // Implementation intentionally left minimal - the CSS transition handles the animation
  };
  
  // Mouse events for desktop users - enhanced for better experience
  const handleMouseDown = (e, transactionId) => {
    // Close any previously swiped item when starting a new swipe
    if (swipedTransactionId && swipedTransactionId !== transactionId) {
      setSwipedTransactionId(null);
    }
    
    touchStartXRef.current = e.clientX;
    
    const handleMouseMove = (moveEvent) => {
      const mouseMoveX = moveEvent.clientX;
      const diff = touchStartXRef.current - mouseMoveX;
      
      // Use same threshold as touch for consistency
      if (diff > swipeThreshold) {
        setSwipedTransactionId(transactionId);
      } else if (diff < -20) { // Lower threshold to close
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
    
    if (!selectedBudgetId) {
      showError('Aucun budget sélectionné');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Get the transaction for logging purposes
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      console.log(">>> TRANSACTION LIST DEBUG: Attempting to delete transaction:", {
        transactionId,
        budgetId: selectedBudgetId,
        transaction: {
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          categoryId: transaction.categoryId
        }
      });
      
      logger.info('TransactionList', 'handleDeleteTransaction', 'Deleting transaction', {
        budgetId: selectedBudgetId,
        transactionId
      });
      
      await deleteTransaction(selectedBudgetId, transactionId);
      
      logger.info('TransactionList', 'handleDeleteTransaction', 'Transaction deleted successfully');
      
      setSwipedTransactionId(null);
      
      if (onTransactionDeleted) {
        onTransactionDeleted(transactionId);
      }
      
      showSuccess('Transaction supprimée avec succès');
    } catch (error) {
      console.error(">>> TRANSACTION LIST ERROR: Failed to delete transaction:", {
        error: error.message,
        transactionId,
        budgetId: selectedBudgetId
      });
      
      logger.error('TransactionList', 'handleDeleteTransaction', 'Error deleting transaction', {
        transactionId,
        budgetId: selectedBudgetId,
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
    console.log(">>> TRANSACTION LIST DEBUG: Getting category name", {
      transactionId: transaction.id,
      categoryId: transaction.categoryId,
      availableCategories: Object.keys(categoryMap),
      foundCategory: transaction.categoryId ? categoryMap[transaction.categoryId] : undefined
    });
    
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
  
  // Calculate daily income and expense totals
  const calculateDailyTotals = (transactions) => {
    return transactions.reduce((totals, transaction) => {
      if (transaction.amount > 0) {
        totals.income += transaction.amount;
      } else {
        totals.expense += Math.abs(transaction.amount);
      }
      return totals;
    }, { income: 0, expense: 0, net: 0 });
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
  
  // Animation variants for Framer Motion
  const contentVariants = {
    hidden: { 
      height: 0,
      opacity: 0,
      transition: { 
        duration: prefersReducedMotion.current ? 0 : 0.5,
        ease: "easeInOut"
      }
    },
    visible: { 
      height: "auto",
      opacity: 1,
      transition: {
        duration: prefersReducedMotion.current ? 0 : 0.5,
        ease: "easeInOut"
      }
    }
  };
  
  const chevronVariants = {
    collapsed: { 
      rotate: 0,
      transition: { 
        duration: prefersReducedMotion.current ? 0 : 0.5,
        ease: "easeInOut"
      }
    },
    expanded: { 
      rotate: 180,
      transition: { 
        duration: prefersReducedMotion.current ? 0 : 0.5,
        ease: "easeInOut"
      }
    }
  };
  
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
        // Calculate daily totals (income, expense, and net)
        const dailyTotals = calculateDailyTotals(group.transactions);
        dailyTotals.net = dailyTotals.income - dailyTotals.expense;
        
        // Use the dateKey directly from the group object
        const dateKey = group.dateKey;
        const isExpanded = expandedDay === dateKey;
        
        // Manual UTC date formatting using Intl.DateTimeFormat
        const dateToDisplay = group.date;
        let displayString = 'Invalid Date';
        
        if (dateToDisplay instanceof Date && !isNaN(dateToDisplay)) {
          const year = dateToDisplay.getUTCFullYear();
          // Use French locale for month name
          const monthName = new Intl.DateTimeFormat('fr-CA', { month: 'long', timeZone: 'UTC' }).format(dateToDisplay);
          const day = dateToDisplay.getUTCDate();
          displayString = `${day} ${monthName} ${year}`; // e.g., "2 avril 2025"
        }
        
        console.log(`Manual UTC Header Display: Input=${dateToDisplay?.toISOString()}, Output='${displayString}'`);
        
        return (
          <div 
            key={dateKey}
            className="transaction-day-card"
          >
            {/* Day Header */}
            <div 
              className="day-header"
              onClick={() => toggleDay(dateKey)}
              onKeyDown={(e) => handleKeyDown(e, dateKey)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-controls={`day-transactions-${dateKey}`}
            >
              <div className="day-date">
                {/* Manual UTC-based date display */}
                {displayString}
              </div>
              
              <div className="day-header-right">
                {/* Only net total in header (simplified display) */}
                <div className={`day-total ${dailyTotals.net < 0 ? 'negative' : dailyTotals.net > 0 ? 'positive' : 'neutral'}`}>
                  {formatCurrency(dailyTotals.net, currency)}
                </div>
                
                <motion.div
                  animate={isExpanded ? "expanded" : "collapsed"}
                  variants={chevronVariants}
                  className="chevron-icon-container"
                >
                  <ChevronDownIcon
                    className="chevron-icon"
                    width={20}
                    height={20}
                    aria-hidden="true"
                  />
                </motion.div>
              </div>
            </div>
            
            {/* Transactions - Using Framer Motion for animations */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  id={`day-transactions-${dateKey}`}
                  className="day-transactions-wrapper"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                >
                  {/* Income/Expense breakdown - visible only when expanded */}
                  <div className="daily-breakdown">
                    <div className="daily-breakdown-item income">
                      <span>Revenus</span>
                      <ArrowUpIcon width={16} height={16} />
                      <span>{formatCurrency(dailyTotals.income, currency)}</span>
                    </div>
                    <div className="daily-breakdown-item expense">
                      <span>Dépenses</span>
                      <ArrowDownIcon width={16} height={16} />
                      <span>{formatCurrency(dailyTotals.expense, currency)}</span>
                    </div>
                  </div>
                  
                  <div className="day-transactions">
                    {group.transactions.map(transaction => (
                      <div
                        key={transaction.id}
                        className="transaction-item-wrapper"
                        onTouchStart={(e) => handleTouchStart(e, transaction.id)}
                        onTouchMove={(e) => handleTouchMove(e, transaction.id)}
                        onTouchEnd={(e) => handleTouchEnd(e, transaction.id)}
                        onMouseDown={(e) => handleMouseDown(e, transaction.id)}
                      >
                        {/* Delete Button (revealed on swipe) */}
                        <div
                          className={`delete-button ${swipedTransactionId === transaction.id ? 'visible' : 'hidden'}`}
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          role="button"
                          aria-label="Supprimer la transaction"
                        >
                          {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </div>
                        
                        {/* Transaction Item */}
                        <div
                          className={`transaction-item ${swipedTransactionId === transaction.id ? 'swiped' : ''}`}
                          style={{ '--category-color': getCategoryColor(transaction) }}
                        >
                          <div className="content-wrapper">
                            <div className="transaction-details">
                              <div className="transaction-description">
                                {transaction.isRecurringInstance && (
                                  <ArrowPathIcon
                                    className="recurring-icon" 
                                    width={16}
                                    height={16}
                                    aria-hidden="false"
                                    aria-label="Recurring Transaction"
                                    title="Recurring Transaction"
                                  />
                                )}
                                {transaction.description}
                              </div>
                              
                              <div 
                                className="transaction-category"
                                style={{ color: getCategoryColor(transaction) }}
                              >
                                <span 
                                  className="category-dot"
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
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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