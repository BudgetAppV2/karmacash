// src/components/layout/Header.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const Header = ({ currentBalance, currency }) => {
  const location = useLocation();
  
  // Determine if we're on the profile page
  const isProfilePage = location.pathname === '/profile';
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/dashboard" className="logo-link">
            <svg className="enso-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#919A7F" strokeWidth="3" strokeDasharray="0 12" />
              <path
                d="M 85 50 A 35 35 0 1 1 50 15"
                fill="none"
                stroke="#919A7F"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <h1>KarmaCash</h1>
          </Link>
        </div>
        
        {!isProfilePage && (
          <div className="balance-display">
            <span className="balance-label">Solde actuel</span>
            <span className={`balance-amount ${currentBalance < 0 ? 'negative' : 'positive'}`}>
              {formatCurrency(currentBalance, currency)}
            </span>
          </div>
        )}
        
        <div className="header-actions">
          <Link to="/profile" className="profile-link">
            <svg className="profile-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                fill="currentColor"
              />
            </svg>
          </Link>
        </div>
      </div>
      
      <nav className="main-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <Link 
              to="/dashboard" 
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Tableau de bord
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/transactions" 
              className={`nav-link ${location.pathname.includes('/transactions') ? 'active' : ''}`}
            >
              Transactions
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/budget" 
              className={`nav-link ${location.pathname.includes('/budget') ? 'active' : ''}`}
            >
              Budget
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/stats" 
              className={`nav-link ${location.pathname.includes('/stats') ? 'active' : ''}`}
            >
              Statistiques
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

Header.propTypes = {
  currentBalance: PropTypes.number,
  currency: PropTypes.string
};

Header.defaultProps = {
  currentBalance: 0,
  currency: 'CAD'
};

export default Header;