// src/features/dashboard/components/UpcomingExpensesCard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const UpcomingExpensesCard = ({ expenses, currency, loading }) => {
  return (
    <div className="dashboard-card upcoming-expenses-card">
      <h3 className="card-title">Dépenses à venir</h3>
      
      {loading ? (
        <div className="card-loading-state">Chargement...</div>
      ) : expenses.length > 0 ? (
        <div className="upcoming-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="upcoming-item">
              <div className="expense-date">{formatDate(expense.date)}</div>
              <div className="expense-info">
                <div className="expense-description">{expense.description}</div>
                <div className="expense-category">{expense.category}</div>
              </div>
              <div className="expense-amount">
                {formatCurrency(expense.amount, currency)}
              </div>
            </div>
          ))}
          
          <div className="upcoming-total">
            <span className="total-label">Total à venir</span>
            <span className="total-amount">
              {formatCurrency(
                expenses.reduce((sum, expense) => sum + expense.amount, 0),
                currency
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune dépense à venir</p>
        </div>
      )}
    </div>
  );
};

UpcomingExpensesCard.propTypes = {
  expenses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.instanceOf(Date).isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      category: PropTypes.string
    })
  ).isRequired,
  currency: PropTypes.string.isRequired,
  loading: PropTypes.bool
};

UpcomingExpensesCard.defaultProps = {
  loading: false
};

export default UpcomingExpensesCard;