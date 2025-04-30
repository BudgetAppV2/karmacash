import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useBudgets } from '../../../contexts/BudgetContext';
import { getCategories, initializeDefaultCategories } from '../../../services/firebase/categories';
import { addTransaction } from '../../../services/firebase/transactions';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import logger from '../../../services/logger';
import BottomSheet from '../../../components/ui/BottomSheet';

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
  const { selectedBudgetId } = useBudgets();
  const { showSuccess, showError } = useToast();
  
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
  const [showInitializeButton, setShowInitializeButton] = useState(false);
  
  // Bottom sheet state
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUser || !selectedBudgetId) {
        setCategories([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      setShowInitializeButton(false);
      
      try {
        logger.debug('Fetching categories', { 
          component: 'TransactionForm', 
          operation: 'fetchCategories',
          budgetId: selectedBudgetId 
        });
        
        console.log(">>> CLIENT DEBUG: Attempting getCategories with selectedBudgetId:", selectedBudgetId);
        const fetchedCategories = await getCategories(selectedBudgetId);
        
        // Check if categories exist
        if (!fetchedCategories || fetchedCategories.length === 0) {
          logger.warn('No categories found for budget', { 
            component: 'TransactionForm', 
            operation: 'fetchCategories',
            budgetId: selectedBudgetId 
          });
          
          setError('Erreur lors du chargement des catégories');
          setShowInitializeButton(true);
          setCategories([]);
          showError('Aucune catégorie disponible');
        } else {
          logger.info('Categories loaded successfully', {
            component: 'TransactionForm',
            operation: 'fetchCategories',
            count: fetchedCategories.length
          });
          
          setCategories(fetchedCategories);
          setShowInitializeButton(false);
          setError('');
          
          // Set default category if available
          if (fetchedCategories.length > 0) {
            const defaultExpenseCategory = fetchedCategories.find(cat => cat.type === 'expense');
            if (defaultExpenseCategory) {
              setCategoryId(defaultExpenseCategory.id);
            }
          }
        }
      } catch (error) {
        logger.error('Error fetching categories', { 
          component: 'TransactionForm', 
          operation: 'fetchCategories',
          budgetId: selectedBudgetId,
          error: error.message
        });
        setError('Erreur lors du chargement des catégories');
        setShowInitializeButton(true);
        setCategories([]);
        showError('Échec du chargement des catégories');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [currentUser, selectedBudgetId, showError]);
  
  // Handle initialization of default categories
  const handleInitializeCategories = async () => {
    if (!selectedBudgetId) {
      showError('Aucun budget sélectionné');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      logger.info('TransactionForm', 'handleInitializeCategories', 'Initializing default categories', {
        budgetId: selectedBudgetId
      });
      
      await initializeDefaultCategories(selectedBudgetId);
      
      // After initialization, fetch categories again
      console.log(">>> CLIENT DEBUG: Attempting getCategories after initialization with selectedBudgetId:", selectedBudgetId);
      const fetchedCategories = await getCategories(selectedBudgetId);
      setCategories(fetchedCategories);
      
      // Set default category if available
      if (fetchedCategories.length > 0) {
        const defaultExpenseCategory = fetchedCategories.find(cat => cat.type === 'expense');
        if (defaultExpenseCategory) {
          setCategoryId(defaultExpenseCategory.id);
        }
      }
      
      setShowInitializeButton(false);
      showSuccess('Catégories initialisées avec succès');
      
      logger.info('TransactionForm', 'handleInitializeCategories', 'Categories initialized successfully');
    } catch (error) {
      logger.error('TransactionForm', 'handleInitializeCategories', 'Error initializing categories', { error });
      setError('Erreur lors de l\'initialisation des catégories. Veuillez réessayer plus tard.');
      showError('Échec de l\'initialisation des catégories');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter categories based on selected type and sort alphabetically
  const filteredCategories = categories
    .filter(category => category.type === type)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  
  // Get selected category text
  const getSelectedCategoryText = () => {
    const selectedCategory = filteredCategories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      return selectedCategory.name;
    }
    return 'Sélectionner une catégorie';
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!categoryId || !amount || !description || !date) {
      setError('Veuillez remplir tous les champs');
      showError('Veuillez remplir tous les champs');
      return;
    }
    
    // Check if user is authenticated and budget is selected
    if (!currentUser || !selectedBudgetId) {
      setError('Vous devez être connecté et avoir un budget sélectionné pour ajouter une transaction');
      showError('Veuillez vous connecter à nouveau ou sélectionner un budget');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      logger.debug('TransactionForm', 'handleSubmit', 'Adding transaction', { 
        type, categoryId, amount, date, budgetId: selectedBudgetId, userId: currentUser.uid 
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
      
      // Save transaction - Note the correct parameter order: budgetId, userId, transactionData
      await addTransaction(selectedBudgetId, currentUser.uid, transactionData);
      
      logger.info('TransactionForm', 'handleSubmit', 'Transaction added successfully');
      showSuccess('Transaction ajoutée avec succès');
      
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
      logger.error('TransactionForm', 'handleSubmit', 'Error adding transaction', { 
        error: error.message,
        code: error.code,
        userId: currentUser?.uid,
        budgetId: selectedBudgetId
      });
      
      // Handle specific error cases
      if (error.code === 'permission-denied') {
        setError('Erreur d\'autorisation. Veuillez vous reconnecter et réessayer.');
      } else if (error.code === 'validation-error-category') {
        // Handle category type mismatch errors with user-friendly messages
        setError(`Erreur de validation: ${error.message}`);
        // If there was a category type mismatch, help the user by switching to the correct type
        if (error.message.includes('Incompatibilité de type')) {
          // Reset the category selection
          setCategoryId('');
        }
      } else if (error.code === 'validation-error') {
        // Handle amount validation errors with user-friendly messages
        if (error.message.includes('Expense transactions') || error.message.includes('Income transactions')) {
          setError(`Erreur de validation: ${error.message}`);
        } else {
          setError(`Erreur de validation: ${error.message}`);
        }
      } else {
        setError(`Erreur lors de l'ajout de la transaction: ${error.message}`);
      }
      
      showError('Échec de l\'ajout de la transaction');
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
          
          {showInitializeButton && (
            <button
              type="button"
              onClick={handleInitializeCategories}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : 'Initialiser les catégories par défaut'}
            </button>
          )}
        </div>
      )}
      
      {/* Render form only if there are categories or show just the initialization UI */}
      {(categories.length > 0 || !showInitializeButton) ? (
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
            <div
              id="transaction-category"
              role="button"
              tabIndex={0}
              aria-haspopup="listbox"
              aria-expanded={isCategorySheetOpen}
              aria-label="Sélectionner une catégorie"
              onClick={() => !isLoading && setIsCategorySheetOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  !isLoading && setIsCategorySheetOpen(true);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(136, 131, 122, 0.4)',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <div style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {isLoading ? 'Chargement des catégories...' : getSelectedCategoryText()}
              </div>
              <ChevronDownIcon width={20} height={20} style={{ color: '#88837A' }} />
            </div>
            
            <BottomSheet
              isOpen={isCategorySheetOpen}
              onClose={() => setIsCategorySheetOpen(false)}
              title="Choisir une catégorie"
              options={filteredCategories}
              selectedValue={categoryId}
              onSelect={(id) => setCategoryId(id)}
              getOptionLabel={(category) => category.name}
              getOptionValue={(category) => category.id}
              getOptionColor={(category) => category.color}
            />
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
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#88837A'
        }}>
          Veuillez initialiser les catégories pour pouvoir ajouter des transactions.
        </div>
      )}
    </div>
  );
};

TransactionForm.propTypes = {
  onSuccess: PropTypes.func
};

export default TransactionForm; 