import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from './components/TransactionForm';
import logger from '../../services/logger';

/**
 * AddTransactionPage component for adding new transactions
 * 
 * @returns {JSX.Element} Add transaction page
 */
function AddTransactionPage() {
  const navigate = useNavigate();
  
  /**
   * Handle successful transaction submission
   */
  const handleTransactionSuccess = () => {
    logger.info('AddTransactionPage', 'handleTransactionSuccess', 'Transaction added, redirecting to transactions list');
    navigate('/transactions');
  };
  
  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <h1 style={{ 
        color: '#2F2F2F', 
        marginBottom: '24px', 
        fontSize: '2rem',
        fontWeight: 500,
        textAlign: 'center'
      }}>
        Ajouter une transaction
      </h1>
      
      <TransactionForm onSuccess={handleTransactionSuccess} />
    </div>
  );
}

export default AddTransactionPage;