// src/features/dashboard/components/RecentTransactionsCard.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const RecentTransactionsCard = ({ transactions, currency, loading }) => {
  return (
    <div className="dashboard-card recent-transactions-card">
      <div className="card-header">
        <h3 className="card-title">Transactions récentes</h3>
        <Link to="/transactions" className="card-link">
          Voir tout
        </Link>
      </div>
      
      {loading ? (
        <div className="card-loading-state">Chargement...</div>
      ) : transactions.length > 0 ? (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <span className="transaction-date">
                  {formatDate(transaction.date)}
                </span>
                <span className="transaction-description">
                  {transaction.description}
                </span>
                <span className="transaction-category">
                  {transaction.category}
                </span>
              </div>
              <div className={`transaction-amount ${transaction.amount < 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(transaction.amount, currency)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune transaction récente</p>
          <Link to="/transactions/add" className="btn btn-primary">
            Ajouter une transaction
          </Link>
        </div>
      )}
    </div>
  );
};

RecentTransactionsCard.propTypes = {
  transactions: PropTypes.arrayOf(
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

RecentTransactionsCard.defaultProps = {
  loading: false
};

export default RecentTransactionsCard;