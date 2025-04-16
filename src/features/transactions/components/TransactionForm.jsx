import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategories } from '../../../services/firebase/categories';
import { addTransaction } from '../../../services/firebase/transactions';
import logger from '../../../services/logger';

/**
 * TransactionForm component for adding or editing a transaction
 * 
 * @param {Object} props Component props
 * @param {Function} props.onSuccess Callback function called after successful submission
 * @returns {JSX.Element} Transaction form
 */
const TransactionForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Categories and loading state
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        logger.debug('TransactionForm', 'fetchCategories', 'Fetching categories');
        const fetchedCategories = await getCategories(currentUser.uid);
        setCategories(fetchedCategories);
        
        // Set default category if available
        if (fetchedCategories.length > 0) {
          const defaultExpenseCategory = fetchedCategories.find(cat => cat.type === 'expense');
          if (defaultExpenseCategory) {
            setCategoryId(defaultExpenseCategory.id);
          }
        }
      } catch (error) {
        logger.error('TransactionForm', 'fetchCategories', 'Error fetching categories', { error });
        setError('Erreur lors du chargement des catégories');
      }
    };
    
    if (currentUser) {
      fetchCategories();
    }
  }, [currentUser]);
  
  // Filter categories based on selected type
  const filteredCategories = categories.filter(category => category.type === type);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!categoryId || !amount || !description || !date) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      logger.debug('TransactionForm', 'handleSubmit', 'Adding transaction', { 
        type, categoryId, amount, date 
      });
      
      // Format data
      const parsedAmount = parseFloat(amount);
      // For expenses, store as negative number
      const formattedAmount = type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
      const transactionData = {
        type,
        categoryId,
        amount: formattedAmount,
        description,
        date: new Date(date)
      };
      
      // Save transaction
      await addTransaction(currentUser.uid, transactionData);
      
      logger.info('TransactionForm', 'handleSubmit', 'Transaction added successfully');
      
      // Clear form
      setDate(new Date().toISOString().slice(0, 10));
      setType('expense');
      setAmount('');
      setDescription('');
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logger.error('TransactionForm', 'handleSubmit', 'Error adding transaction', { error });
      setError(`Erreur lors de l'ajout de la transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Primary and secondary color following the Zen/Tranquility theme
  const primaryColor = '#919A7F'; // Sage green
  const secondaryColor = '#A58D7F'; // Taupe
  const negativeColor = '#C17C74'; // Soft terra cotta
  const positiveColor = '#568E8D'; // Muted teal
  
  return (
    <div 
      className="transaction-form"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        maxWidth: '600px',
        margin: '0 auto'
      }}
    >
      <h2 style={{ 
        color: '#2F2F2F', 
        marginBottom: '24px', 
        fontSize: '1.5rem',
        fontWeight: 500
      }}>
        Ajouter une transaction
      </h2>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          color: '#b71c1c',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="transaction-date"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#88837A',
              fontSize: '0.9rem'
            }}
          >
            Date
          </label>
          <input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(136, 131, 122, 0.4)',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#88837A',
              fontSize: '0.9rem'
            }}
          >
            Type
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setType('expense')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: type === 'expense' ? negativeColor : 'transparent',
                color: type === 'expense' ? 'white' : '#2F2F2F',
                border: type === 'expense' ? 'none' : '1px solid rgba(136, 131, 122, 0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.3s ease'
              }}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: type === 'income' ? positiveColor : 'transparent',
                color: type === 'income' ? 'white' : '#2F2F2F',
                border: type === 'income' ? 'none' : '1px solid rgba(136, 131, 122, 0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.3s ease'
              }}
            >
              Revenu
            </button>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="transaction-category"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#88837A',
              fontSize: '0.9rem'
            }}
          >
            Catégorie
          </label>
          <select
            id="transaction-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(136, 131, 122, 0.4)',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '1rem'
            }}
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label 
            htmlFor="transaction-amount"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#88837A',
              fontSize: '0.9rem'
            }}
          >
            Montant
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#88837A'
            }}>
              $
            </span>
            <input
              id="transaction-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                paddingLeft: '24px',
                border: '1px solid rgba(136, 131, 122, 0.4)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label 
            htmlFor="transaction-description"
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#88837A',
              fontSize: '0.9rem'
            }}
          >
            Description
          </label>
          <input
            id="transaction-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid rgba(136, 131, 122, 0.4)',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
            placeholder="Description de la transaction"
            required
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: primaryColor,
              border: `1.5px solid ${primaryColor}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              transition: 'all 0.2s ease-out'
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease-out'
            }}
          >
            {isLoading ? 'Chargement...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

TransactionForm.propTypes = {
  onSuccess: PropTypes.func
};

export default TransactionForm; 