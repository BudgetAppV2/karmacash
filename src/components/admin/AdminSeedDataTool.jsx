import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { triggerAdminSeedService } from '../../services/firebase/adminService';
import { useToast } from '../../contexts/ToastContext';
import styles from './AdminSeedDataTool.module.css';

/**
 * AdminSeedDataTool component for triggering test data generation
 * This component is only available in development mode
 * @returns {JSX.Element|null} - The component or null in production
 */
const AdminSeedDataTool = () => {
  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(false);

  // Form state
  const [formState, setFormState] = useState({
    targetMonth: new Date().toISOString().substring(0, 7), // Current month in YYYY-MM format
    recurringInstancesPct: 30,
    seedDemoUser: false,
    skipCategories: false,
    skipTransactions: false,
    skipRules: false,
    skipAllocations: false,
    budgetId: '' // New field for existing budget ID
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      showError("Vous devez être connecté pour générer des données de test");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Convert string to number for recurringInstancesPct
      const params = {
        ...formState,
        recurringInstancesPct: parseInt(formState.recurringInstancesPct, 10),
        // Only include budgetId if it's not empty
        budgetId: formState.budgetId.trim() || null
      };
      
      showInfo("Génération des données de test en cours...");
      const response = await triggerAdminSeedService(params);
      
      setResult(response);
      showSuccess("Données de test générées avec succès");
    } catch (err) {
      console.error("Error triggering admin seed:", err);
      setError(err);
      showError(`Erreur: ${err.message || "Une erreur est survenue"}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle UI visibility
  const toggleUI = () => setShowUI(prev => !prev);

  return (
    <div className={styles.container}>
      <button 
        onClick={toggleUI} 
        className={styles.toggleButton}
        aria-expanded={showUI}
      >
        {showUI ? "Cacher" : "Afficher"} Outil de Génération (Dev)
      </button>
      
      {showUI && (
        <>
          <div className={styles.header}>
            <h2 className={styles.title}>Outil de Génération de Données (Dev)</h2>
            <p className={styles.description}>
              Cet outil permet de générer des données de test pour le développement.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="budgetId" className={styles.label}>
                ID de Budget Existant (Optionnel)
              </label>
              <input
                type="text"
                id="budgetId"
                name="budgetId"
                value={formState.budgetId}
                onChange={handleInputChange}
                className={styles.input}
                disabled={loading}
                placeholder="Laissez vide pour créer un nouveau budget"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="targetMonth" className={styles.label}>
                Mois cible (YYYY-MM)
              </label>
              <input
                type="month"
                id="targetMonth"
                name="targetMonth"
                value={formState.targetMonth}
                onChange={handleInputChange}
                className={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="recurringInstancesPct" className={styles.label}>
                % d'instances récurrentes ({formState.recurringInstancesPct}%)
              </label>
              <input
                type="range"
                id="recurringInstancesPct"
                name="recurringInstancesPct"
                value={formState.recurringInstancesPct}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="5"
                className={styles.slider}
                disabled={loading}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="seedDemoUser"
                  name="seedDemoUser"
                  checked={formState.seedDemoUser}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <label htmlFor="seedDemoUser" className={styles.checkboxLabel}>
                  Générer pour utilisateur démo
                </label>
              </div>
              
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="skipCategories"
                  name="skipCategories"
                  checked={formState.skipCategories}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <label htmlFor="skipCategories" className={styles.checkboxLabel}>
                  Ignorer catégories
                </label>
              </div>

              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="skipTransactions"
                  name="skipTransactions"
                  checked={formState.skipTransactions}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <label htmlFor="skipTransactions" className={styles.checkboxLabel}>
                  Ignorer transactions
                </label>
              </div>

              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="skipRules"
                  name="skipRules"
                  checked={formState.skipRules}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <label htmlFor="skipRules" className={styles.checkboxLabel}>
                  Ignorer règles récurrentes
                </label>
              </div>

              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id="skipAllocations"
                  name="skipAllocations"
                  checked={formState.skipAllocations}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                  disabled={loading}
                />
                <label htmlFor="skipAllocations" className={styles.checkboxLabel}>
                  Ignorer allocations mensuelles
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <div className={styles.loadingIndicator}>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </div>
              ) : "Générer Données"}
            </button>
          </form>

          {result && (
            <div className={styles.resultContainer}>
              <h3 className={styles.resultTitle}>Résultat</h3>
              <div className={styles.resultCard}>
                <div className={styles.statusBadge}>Succès</div>
                <div className={styles.resultDetails}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Budget ID:</span>
                    <span className={styles.resultValue}>{result.details.budgetId}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Utilisateur:</span>
                    <span className={styles.resultValue}>{result.details.userId}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Mois:</span>
                    <span className={styles.resultValue}>{result.details.targetMonth}</span>
                  </div>
                  <div className={styles.resultStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{result.details.categoryCount}</span>
                      <span className={styles.statLabel}>Catégories</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{result.details.transactionCount}</span>
                      <span className={styles.statLabel}>Transactions</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{result.details.ruleCount}</span>
                      <span className={styles.statLabel}>Règles</span>
                    </div>
                  </div>
                </div>
                <details className={styles.rawResults}>
                  <summary>Données complètes</summary>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <h3 className={styles.errorTitle}>Erreur</h3>
              <div className={styles.errorCard}>
                <div className={styles.errorBadge}>Erreur</div>
                <div className={styles.errorMessage}>{error.message}</div>
                <details className={styles.rawError}>
                  <summary>Détails techniques</summary>
                  <pre>{JSON.stringify({
                    message: error.message,
                    code: error.code,
                    details: error.details
                  }, null, 2)}</pre>
                </details>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSeedDataTool; 