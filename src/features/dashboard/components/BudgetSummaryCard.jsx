// src/features/dashboard/components/BudgetSummaryCard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../utils/formatters';

const BudgetSummaryCard = ({ categories, progress, currency, loading }) => {
  // Function to determine progress bar class based on percentage
  const getProgressClass = (spent, allocated) => {
    if (allocated === 0) return 'neutral';
    
    const percentage = (spent / allocated) * 100;
    if (percentage >= 100) return 'over-budget';
    if (percentage >= 80) return 'warning';
    return 'normal';
  };

  return (
    <div className="dashboard-card budget-summary-card">
      <div className="card-header">
        <h3 className="card-title">Budget du mois</h3>
        <Link to="/budget" className="card-link">
          Gérer le budget
        </Link>
      </div>
      
      {loading ? (
        <div className="card-loading-state">Chargement...</div>
      ) : (
        <div className="budget-content">
          <div className="overall-progress">
            <div className="progress-label">
              <span>Budget global</span>
              <span>{progress}% utilisé</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className={`progress-bar ${progress >= 100 ? 'over-budget' : progress >= 80 ? 'warning' : 'normal'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="category-list">
            {categories.map((category) => (
              <div key={category.id} className="budget-category">
                <div className="category-header">
                  <span className="category-name">{category.name}</span>
                  <span className="category-amounts">
                    <span className="amount-spent">{formatCurrency(category.spent, currency)}</span>
                    <span className="amount-separator">/</span>
                    <span className="amount-allocated">{formatCurrency(category.allocated, currency)}</span>
                  </span>
                </div>
                <div className="category-progress-container">
                  <div 
                    className={`category-progress ${getProgressClass(category.spent, category.allocated)}`}
                    style={{ width: `${Math.min((category.spent / category.allocated) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {categories.length === 0 && (
            <div className="empty-state">
              <p>Aucune catégorie budgétaire définie</p>
              <Link to="/budget" className="btn btn-primary">
                Configurer mon budget
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

BudgetSummaryCard.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      allocated: PropTypes.number.isRequired,
      spent: PropTypes.number.isRequired
    })
  ).isRequired,
  progress: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  loading: PropTypes.bool
};

BudgetSummaryCard.defaultProps = {
  loading: false
};

export default BudgetSummaryCard;