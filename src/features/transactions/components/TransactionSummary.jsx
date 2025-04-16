import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters';
import logger from '../../../services/logger';

/**
 * TransactionSummary component for displaying financial summary with basic charts
 * 
 * @param {Object} props Component props
 * @param {Array} props.transactions Array of transactions to summarize
 * @param {string} props.currency Currency code for formatting (default: 'CAD')
 * @param {string} props.period Period description (e.g., "This Week", "April 2025")
 * @returns {JSX.Element} Financial summary with charts
 */
const TransactionSummary = ({ transactions, currency = 'CAD', period = 'This Period' }) => {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // Calculate summary statistics
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setIncome(0);
      setExpenses(0);
      setBalance(0);
      return;
    }
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
      if (transaction.amount > 0) {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += Math.abs(transaction.amount);
      }
    });
    
    const netBalance = totalIncome - totalExpenses;
    
    setIncome(totalIncome);
    setExpenses(totalExpenses);
    setBalance(netBalance);
    
    logger.debug('TransactionSummary', 'calculateSummary', 'Financial summary calculated', {
      income: totalIncome,
      expenses: totalExpenses,
      balance: netBalance,
      transactionCount: transactions.length
    });
  }, [transactions]);
  
  // Max value for the chart (for scaling)
  const maxValue = Math.max(income, expenses, Math.abs(balance));
  
  // Calculate bar heights (percentage of max)
  const incomeHeight = maxValue > 0 ? (income / maxValue) * 100 : 0;
  const expensesHeight = maxValue > 0 ? (expenses / maxValue) * 100 : 0;
  const balanceHeight = maxValue > 0 ? (Math.abs(balance) / maxValue) * 100 : 0;
  
  // Primary colors from Zen/Tranquility theme
  const primaryColor = '#919A7F'; // Sage green
  const negativeColor = '#C17C74'; // Soft terra cotta for negative amounts
  const positiveColor = '#568E8D'; // Muted teal for positive amounts
  const backgroundColor = '#F3F0E8'; // Soft off-white
  
  return (
    <div 
      className="transaction-summary"
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}
    >
      <h3 style={{ 
        color: '#2F2F2F', 
        marginTop: 0,
        marginBottom: '24px',
        fontSize: '1.25rem',
        fontWeight: 500
      }}>
        Résumé Financier: {period}
      </h3>
      
      {/* Summary Data */}
      <div 
        className="summary-data"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '32px'
        }}
      >
        <div className="summary-item">
          <div 
            className="summary-label"
            style={{
              fontSize: '0.9rem',
              color: '#88837A',
              marginBottom: '8px'
            }}
          >
            Revenus
          </div>
          <div 
            className="summary-value income"
            style={{
              color: positiveColor,
              fontWeight: 600,
              fontSize: '1.2rem'
            }}
          >
            {formatCurrency(income, currency)}
          </div>
        </div>
        
        <div className="summary-item">
          <div 
            className="summary-label"
            style={{
              fontSize: '0.9rem',
              color: '#88837A',
              marginBottom: '8px'
            }}
          >
            Dépenses
          </div>
          <div 
            className="summary-value expenses"
            style={{
              color: negativeColor,
              fontWeight: 600,
              fontSize: '1.2rem'
            }}
          >
            {formatCurrency(expenses, currency)}
          </div>
        </div>
        
        <div className="summary-item">
          <div 
            className="summary-label"
            style={{
              fontSize: '0.9rem',
              color: '#88837A',
              marginBottom: '8px'
            }}
          >
            Solde
          </div>
          <div 
            className="summary-value balance"
            style={{
              color: balance >= 0 ? positiveColor : negativeColor,
              fontWeight: 600,
              fontSize: '1.2rem'
            }}
          >
            {formatCurrency(balance, currency)}
          </div>
        </div>
      </div>
      
      {/* Simple Bar Chart */}
      <div 
        className="summary-chart"
        style={{
          height: '150px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '0 16px',
          backgroundColor: backgroundColor,
          borderRadius: '8px'
        }}
      >
        {/* Income Bar */}
        <div className="chart-column" style={{ textAlign: 'center', width: '60px' }}>
          <div 
            className="chart-bar income"
            style={{
              height: `${incomeHeight}%`,
              backgroundColor: positiveColor,
              borderRadius: '4px 4px 0 0',
              width: '100%',
              transition: 'height 0.5s ease-out',
              minHeight: income > 0 ? '4px' : '0'
            }}
          />
          <div 
            className="chart-label"
            style={{
              fontSize: '0.8rem',
              color: '#88837A',
              marginTop: '8px'
            }}
          >
            Revenus
          </div>
        </div>
        
        {/* Expenses Bar */}
        <div className="chart-column" style={{ textAlign: 'center', width: '60px' }}>
          <div 
            className="chart-bar expenses"
            style={{
              height: `${expensesHeight}%`,
              backgroundColor: negativeColor,
              borderRadius: '4px 4px 0 0',
              width: '100%',
              transition: 'height 0.5s ease-out',
              minHeight: expenses > 0 ? '4px' : '0'
            }}
          />
          <div 
            className="chart-label"
            style={{
              fontSize: '0.8rem',
              color: '#88837A',
              marginTop: '8px'
            }}
          >
            Dépenses
          </div>
        </div>
        
        {/* Balance Bar */}
        <div className="chart-column" style={{ textAlign: 'center', width: '60px' }}>
          <div 
            className="chart-bar balance"
            style={{
              height: `${balanceHeight}%`,
              backgroundColor: balance >= 0 ? positiveColor : negativeColor,
              borderRadius: '4px 4px 0 0',
              width: '100%',
              transition: 'height 0.5s ease-out',
              minHeight: balance !== 0 ? '4px' : '0'
            }}
          />
          <div 
            className="chart-label"
            style={{
              fontSize: '0.8rem',
              color: '#88837A',
              marginTop: '8px'
            }}
          >
            Solde
          </div>
        </div>
      </div>
      
      {/* Transaction Count */}
      <div 
        className="transaction-count"
        style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '0.9rem',
          color: '#88837A'
        }}
      >
        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

TransactionSummary.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired
    })
  ).isRequired,
  currency: PropTypes.string,
  period: PropTypes.string
};

export default TransactionSummary; 