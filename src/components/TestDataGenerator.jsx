import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import seedTestData, { seedTestCategories, seedTestTransactions } from '../utils/seedTestData';
import { getCategories } from '../services/firebase/categories';
import { addTransaction, getTransaction } from '../services/firebase/transactions';
import logger from '../services/logger';
import './TestDataGenerator.css';

/**
 * TestDataGenerator component for quickly generating test data
 * @returns {JSX.Element} Test data generator UI
 */
const TestDataGenerator = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(30);
  const [showOptions, setShowOptions] = useState(false);
  const [results, setResults] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  /**
   * Handle generating all test data
   */
  const handleGenerateAll = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des données de test");
      return;
    }

    setLoading(true);
    try {
      logger.info('TestDataGenerator', 'handleGenerateAll', 'Generating all test data', { 
        userId: currentUser.uid,
        transactionCount
      });
      
      const result = await seedTestData(currentUser.uid, transactionCount);
      
      setResults(result);
      showSuccess(`Données générées : ${result.categoryIds.length} catégories et ${result.transactionIds.length} transactions`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      logger.error('TestDataGenerator', 'handleGenerateAll', 'Error generating test data', {
        error: error.message,
        stack: error.stack
      });
      showError("Échec de la génération des données de test");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generating only categories
   */
  const handleGenerateCategories = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des données de test");
      return;
    }

    setLoading(true);
    try {
      logger.info('TestDataGenerator', 'handleGenerateCategories', 'Generating test categories', { 
        userId: currentUser.uid 
      });
      
      const categoryIds = await seedTestCategories(currentUser.uid);
      
      setResults({ categoryIds, transactionIds: [] });
      showSuccess(`${categoryIds.length} catégories générées`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      logger.error('TestDataGenerator', 'handleGenerateCategories', 'Error generating test categories', {
        error: error.message,
        stack: error.stack
      });
      showError("Échec de la génération des catégories de test");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generating only transactions
   */
  const handleGenerateTransactions = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des données de test");
      return;
    }

    setLoading(true);
    try {
      // First get existing categories
      logger.info('TestDataGenerator', 'handleGenerateTransactions', 'Getting existing categories', { 
        userId: currentUser.uid 
      });
      
      const userCategories = await getCategories(currentUser.uid);
      
      if (!userCategories || userCategories.length === 0) {
        showError("Vous devez d'abord créer des catégories avant de générer des transactions");
        setLoading(false);
        return;
      }
      
      logger.info('TestDataGenerator', 'handleGenerateTransactions', 'Generating test transactions', { 
        userId: currentUser.uid,
        categoryCount: userCategories.length,
        transactionCount
      });
      
      const categoryIds = userCategories.map(c => c.id);
      const transactionIds = await seedTestTransactions(currentUser.uid, categoryIds, transactionCount);
      
      setResults({ categoryIds: [], transactionIds });
      showSuccess(`${transactionIds.length} transactions générées`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      logger.error('TestDataGenerator', 'handleGenerateTransactions', 'Error generating test transactions', {
        error: error.message,
        stack: error.stack
      });
      showError("Échec de la génération des transactions de test");
    } finally {
      setLoading(false);
    }
  };

  /**
   * New function to test transaction creation and verification
   * This creates a single transaction and immediately verifies if it exists
   */
  const handleVerifyTransaction = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour effectuer ce test");
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    
    try {
      // First get a category to use
      const userCategories = await getCategories(currentUser.uid);
      
      if (!userCategories || userCategories.length === 0) {
        showError("Vous devez d'abord créer des catégories");
        setLoading(false);
        return;
      }
      
      // Pick the first expense category
      const expenseCategory = userCategories.find(c => c.type === 'expense') || userCategories[0];
      
      // Create a test transaction
      const transactionData = {
        type: 'expense',
        categoryId: expenseCategory.id,
        amount: -10.99,
        description: `Test transaction ${new Date().toISOString()}`,
        date: new Date()
      };
      
      logger.info('TestDataGenerator', 'handleVerifyTransaction', 'Creating test transaction', {
        userId: currentUser.uid,
        category: expenseCategory.name,
        transactionData: JSON.stringify(transactionData)
      });
      
      // Add the transaction
      const transactionId = await addTransaction(currentUser.uid, transactionData);
      
      // Wait a moment for Firestore to sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to get the transaction to verify it exists
      const createdTransaction = await getTransaction(currentUser.uid, transactionId);
      
      // Prepare verification result
      const verificationResultData = {
        time: new Date().toISOString(),
        transactionId,
        exists: !!createdTransaction,
        data: createdTransaction,
        path: `users/${currentUser.uid}/transactions/${transactionId}`
      };
      
      setVerificationResult(verificationResultData);
      
      if (createdTransaction) {
        showSuccess(`Transaction créée et vérifiée: ${transactionId}`);
        logger.info('TestDataGenerator', 'handleVerifyTransaction', 'Transaction verified successfully', verificationResultData);
      } else {
        showError(`Transaction créée mais NON TROUVÉE: ${transactionId}`);
        logger.error('TestDataGenerator', 'handleVerifyTransaction', 'Transaction created but not found', verificationResultData);
      }
      
    } catch (error) {
      logger.error('TestDataGenerator', 'handleVerifyTransaction', 'Error in transaction verification test', {
        error: error.message,
        stack: error.stack
      });
      
      setVerificationResult({
        error: error.message,
        stack: error.stack
      });
      
      showError(`Erreur lors du test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="test-data-generator">
      <button
        className="test-data-toggle"
        onClick={() => setShowOptions(!showOptions)}
        title="Générateur de données de test"
      >
        🧪
      </button>
      
      {showOptions && (
        <div className="test-data-options">
          <h3>Générateur de données de test</h3>
          <p className="test-data-warning">
            ⚠️ Ces options sont destinées aux tests uniquement. Les données générées remplaceront les données existantes.
          </p>
          
          <div className="test-data-form">
            <div className="test-data-form-group">
              <label htmlFor="transactionCount">Nombre de transactions</label>
              <input
                id="transactionCount"
                type="number"
                min="1"
                max="100"
                value={transactionCount}
                onChange={(e) => setTransactionCount(parseInt(e.target.value, 10))}
                disabled={loading}
              />
            </div>
            
            <div className="test-data-actions">
              <button
                className="btn btn-primary"
                onClick={handleGenerateAll}
                disabled={loading}
              >
                {loading ? 'Génération...' : 'Générer tout'}
              </button>
              
              <div className="test-data-specific-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateCategories}
                  disabled={loading}
                >
                  Catégories uniquement
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateTransactions}
                  disabled={loading}
                >
                  Transactions uniquement
                </button>
              </div>
              
              {/* New verification button */}
              <button
                className="btn btn-verification"
                onClick={handleVerifyTransaction}
                disabled={loading}
              >
                Test de transaction
              </button>
            </div>
          </div>
          
          {/* Display verification results */}
          {verificationResult && (
            <div className="test-data-verification">
              <h4>Résultat du test de transaction:</h4>
              <div className="verification-result">
                <p>
                  <strong>ID:</strong> {verificationResult.transactionId}<br />
                  <strong>Existe:</strong> {verificationResult.exists ? 'Oui ✅' : 'Non ❌'}<br />
                  <strong>Chemin:</strong> {verificationResult.path}
                </p>
                {verificationResult.error && (
                  <p className="verification-error">
                    <strong>Erreur:</strong> {verificationResult.error}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {results && (
            <div className="test-data-results">
              <p>
                Génération terminée :
                {results.categoryIds.length > 0 && (
                  <span> {results.categoryIds.length} catégories</span>
                )}
                {results.transactionIds.length > 0 && (
                  <span> {results.transactionIds.length} transactions</span>
                )}
              </p>
              <p className="test-data-refresh">
                Rechargement de la page en cours...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestDataGenerator; 