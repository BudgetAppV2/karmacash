// src/features/dashboard/components/FinancialSummaryCard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../../utils/formatters';

const FinancialSummaryCard = ({ 
  currentBalance, 
  monthlyIncome, 
  monthlyExpenses, 
  currency, 
  loading 
}) => {
  // Calculate net monthly balance
  const netMonthly = monthlyIncome - monthlyExpenses;
  
  // Determine CSS class based on value
  const getValueClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  return (
    <div className="dashboard-card financial-summary-card">
      <h3 className="card-title">Résumé financier</h3>
      
      {loading ? (
        <div className="card-loading-state">Chargement...</div>
      ) : (
        <div className="financial-summary-content">
          <div className="summary-item main-balance">
            <div className="item-label">Solde actuel</div>
            <div className={`item-value ${getValueClass(currentBalance)}`}>
              {formatCurrency(currentBalance, currency)}
            </div>
          </div>
          
          <div className="summary-data">
            <div className="summary-item">
              <div className="item-label">Revenus du mois</div>
              <div className="item-value positive">
                {formatCurrency(monthlyIncome, currency)}
              </div>
            </div>
            
            <div className="summary-item">
              <div className="item-label">Dépenses du mois</div>
              <div className="item-value negative">
                {formatCurrency(monthlyExpenses, currency)}
              </div>
            </div>
            
            <div className="summary-item net-balance">
              <div className="item-label">Solde net du mois</div>
              <div className={`item-value ${getValueClass(netMonthly)}`}>
                {formatCurrency(netMonthly, currency)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

FinancialSummaryCard.propTypes = {
  currentBalance: PropTypes.number.isRequired,
  monthlyIncome: PropTypes.number.isRequired,
  monthlyExpenses: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  loading: PropTypes.bool
};

FinancialSummaryCard.defaultProps = {
  loading: false
};

export default FinancialSummaryCard;