import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useBudgets } from '../contexts/BudgetContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseInit';
import { 
  runSeedForUser, 
  seedDefaultCategoriesForBudget, 
  seedSampleTransactionsForBudget 
} from '../services/testData/seedTestData';
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
  const { selectedBudgetId } = useBudgets();
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(30);
  const [showOptions, setShowOptions] = useState(false);
  const [results, setResults] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // Debug logging wrapper
  const debugLog = {
    info: (operation, message, data = {}) => {
      console.log(`[TestDataGenerator:${operation}] ${message}`, data);
      logger.info('TestDataGenerator', operation, message, data);
    },
    error: (operation, message, error) => {
      console.error(`[TestDataGenerator:${operation}] ERROR: ${message}`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      logger.error('TestDataGenerator', operation, message, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  };

  /**
   * Handle generating all test data
   */
  const handleGenerateAll = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des données de test");
      return;
    }

    if (!selectedBudgetId) {
      showError("Vous devez sélectionner un budget pour générer des données de test");
      return;
    }

    setLoading(true);
    try {
      debugLog.info('handleGenerateAll', 'Starting test data generation', { 
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        transactionCount
      });

      // Check if user document exists
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        debugLog.error('handleGenerateAll', 'User document not found', {
          userId: currentUser.uid
        });
        showError("Votre profil utilisateur n'est pas encore prêt. Veuillez patienter quelques instants et réessayer.");
        return;
      }

      // Debug: Log budgetMemberships path before query
      const membershipsPath = `users/${currentUser.uid}/budgetMemberships`;
      debugLog.info('handleGenerateAll', 'Checking budgetMemberships path', { 
        membershipsPath,
        collectionPath: collection(db, membershipsPath).path
      });

      // Check if user has any budget memberships
      const membershipsRef = collection(db, membershipsPath);
      const membershipsSnapshot = await getDocs(membershipsRef);
      
      debugLog.info('handleGenerateAll', 'Current budgetMemberships', {
        count: membershipsSnapshot.size,
        memberships: membershipsSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      });
      
      // Run the seeding process
      const result = await runSeedForUser(currentUser.uid);
      
      debugLog.info('handleGenerateAll', 'Test data generation completed', {
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        result
      });
      
      setResults(result);
      showSuccess(`Données générées : ${result.categoryIds.length} catégories et transactions`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      debugLog.error('handleGenerateAll', 'Test data generation failed', error);
      showError(`Échec de la génération: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generating only categories
   */
  const handleGenerateCategories = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des catégories de test");
      return;
    }

    if (!selectedBudgetId) {
      showError("Vous devez sélectionner un budget pour générer des catégories de test");
      return;
    }

    setLoading(true);
    try {
      debugLog.info('handleGenerateCategories', 'Starting category generation', { 
        userId: currentUser.uid,
        budgetId: selectedBudgetId
      });
      
      const categoryIds = await seedDefaultCategoriesForBudget(selectedBudgetId, currentUser.uid);
      
      debugLog.info('handleGenerateCategories', 'Categories generated successfully', {
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        categoryCount: categoryIds.length
      });
      
      setResults({ categoryIds, transactionIds: [] });
      showSuccess(`${categoryIds.length} catégories générées`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      debugLog.error('handleGenerateCategories', 'Category generation failed', error);
      showError(`Échec de la génération des catégories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle generating only transactions
   */
  const handleGenerateTransactions = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des transactions de test");
      return;
    }

    if (!selectedBudgetId) {
      showError("Vous devez sélectionner un budget pour générer des transactions de test");
      return;
    }

    setLoading(true);
    try {
      debugLog.info('handleGenerateTransactions', 'Getting existing categories', { 
        userId: currentUser.uid,
        budgetId: selectedBudgetId
      });
      
      const userCategories = await getCategories(selectedBudgetId);
      
      if (!userCategories || userCategories.length === 0) {
        const error = new Error('No categories found');
        debugLog.error('handleGenerateTransactions', 'Categories required', error);
        showError("Vous devez d'abord créer des catégories avant de générer des transactions");
        return;
      }
      
      debugLog.info('handleGenerateTransactions', 'Starting transaction generation', { 
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        categoryCount: userCategories.length,
        transactionCount
      });
      
      const categoryIds = userCategories.map(c => c.id);
      const transactionIds = await seedSampleTransactionsForBudget(selectedBudgetId, categoryIds, transactionCount);
      
      debugLog.info('handleGenerateTransactions', 'Transactions generated successfully', {
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        transactionCount: transactionIds.length
      });
      
      setResults({ categoryIds: [], transactionIds });
      showSuccess(`${transactionIds.length} transactions générées`);
      
      // Reload the page after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      debugLog.error('handleGenerateTransactions', 'Transaction generation failed', error);
      showError(`Échec de la génération des transactions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test transaction creation and verification
   */
  const handleVerifyTransaction = async () => {
    if (!currentUser) {
      showError("Vous devez être connecté pour vérifier une transaction");
      return;
    }

    if (!selectedBudgetId) {
      showError("Vous devez sélectionner un budget pour vérifier une transaction");
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    
    try {
      debugLog.info('handleVerifyTransaction', 'Starting transaction verification test', {
        userId: currentUser.uid,
        budgetId: selectedBudgetId
      });
      
      // Get categories
      const userCategories = await getCategories(selectedBudgetId);
      
      if (!userCategories || userCategories.length === 0) {
        const error = new Error('No categories found');
        debugLog.error('handleVerifyTransaction', 'Categories required', error);
        showError("Vous devez d'abord créer des catégories");
        return;
      }
      
      // Pick the first expense category
      const expenseCategory = userCategories.find(c => c.type === 'expense') || userCategories[0];
      
      // Create test transaction
      const transactionData = {
        type: 'expense',
        categoryId: expenseCategory.id,
        amount: -10.99,
        description: `Test transaction ${new Date().toISOString()}`,
        date: new Date(),
        budgetId: selectedBudgetId
      };
      
      debugLog.info('handleVerifyTransaction', 'Creating test transaction', {
        userId: currentUser.uid,
        budgetId: selectedBudgetId,
        category: expenseCategory.name,
        transactionData
      });
      
      // Add transaction
      const transactionId = await addTransaction(selectedBudgetId, transactionData);
      
      // Wait for Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify transaction
      const createdTransaction = await getTransaction(selectedBudgetId, transactionId);
      
      const verificationResultData = {
        time: new Date().toISOString(),
        transactionId,
        exists: !!createdTransaction,
        data: createdTransaction,
        path: `budgets/${selectedBudgetId}/transactions/${transactionId}`
      };
      
      setVerificationResult(verificationResultData);
      
      if (createdTransaction) {
        debugLog.info('handleVerifyTransaction', 'Transaction verified successfully', verificationResultData);
        showSuccess(`Transaction créée et vérifiée: ${transactionId}`);
      } else {
        debugLog.error('handleVerifyTransaction', 'Transaction not found after creation', {
          error: new Error('Transaction verification failed'),
          verificationResultData
        });
        showError(`Transaction créée mais NON TROUVÉE: ${transactionId}`);
      }
      
    } catch (error) {
      debugLog.error('handleVerifyTransaction', 'Transaction verification failed', error);
      
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
          
          {!selectedBudgetId && (
            <p className="test-data-warning">
              ⚠️ Veuillez sélectionner un budget avant de générer des données.
            </p>
          )}
          
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
                disabled={loading || !selectedBudgetId}
              >
                {loading ? 'Génération...' : 'Générer tout'}
              </button>
              
              <div className="test-data-specific-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateCategories}
                  disabled={loading || !selectedBudgetId}
                >
                  Catégories uniquement
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerateTransactions}
                  disabled={loading || !selectedBudgetId}
                >
                  Transactions uniquement
                </button>
              </div>
              
              <button
                className="btn btn-verification"
                onClick={handleVerifyTransaction}
                disabled={loading || !selectedBudgetId}
              >
                Test de transaction
              </button>
            </div>
          </div>
          
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