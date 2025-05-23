import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useBudgets } from '../../contexts/BudgetContext';
import { 
  getRecurringRules, 
  deleteRecurringRule, 
  toggleRecurringRuleActive
} from '../../services/firebase/recurringRules';
import { FREQUENCY_TYPES } from '../../services/firebase/recurringRules';
import { formatDate, formatCurrency } from '../../utils/formatters';
import logger from '../../services/logger';
import './RecurringRulesPage.css';
import RecurringRuleForm from './components/RecurringRuleForm';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { httpsCallable } from 'firebase/functions';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, functions } from '../../services/firebase/firebaseInit';

// Component to display a single recurring rule
const RecurringRuleItem = ({ rule, onEdit, onDelete, onToggleActive }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { currentUser } = useAuth();
  const { selectedBudgetId } = useBudgets();

  // Determine if the rule is active - check both isActive and active fields for compatibility
  const isRuleActive = () => {
    // First check isActive (new field name that matches security rules)
    if (typeof rule.isActive === 'boolean') {
      return rule.isActive;
    }
    // Fallback to active (old field name that might exist in some records)
    if (typeof rule.active === 'boolean') {
      return rule.active;
    }
    // Default to true if neither field exists
    return true;
  };

  // Map frequency types to display text
  const getFrequencyText = (frequency) => {
    const frequencyMap = {
      [FREQUENCY_TYPES.DAILY]: 'Quotidien',
      [FREQUENCY_TYPES.WEEKLY]: 'Hebdomadaire',
      [FREQUENCY_TYPES.BIWEEKLY]: 'Bi-hebdomadaire',
      [FREQUENCY_TYPES.MONTHLY]: 'Mensuel',
      [FREQUENCY_TYPES.QUARTERLY]: 'Trimestriel',
      [FREQUENCY_TYPES.YEARLY]: 'Annuel'
    };
    return frequencyMap[frequency] || frequency;
  };

  const handleDeleteClick = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBudgetId) {
      showError('Aucun budget sélectionné');
      return;
    }

    setIsLoading(true);
    setIsConfirmOpen(false);

    try {
      logger.info('RecurringRuleItem', 'handleConfirmDelete', 'Deleting recurring rule and instances', {
        budgetId: selectedBudgetId,
        ruleId: rule.id
      });

      // Call function to delete future instances
      const manageInstances = httpsCallable(functions, 'manageRecurringInstances');

      // Prepare parameters with emulator workaround
      const params = { 
        ruleId: rule.id,
        budgetId: selectedBudgetId,
        action: 'delete' 
      };

      // Add emulatorUserId in development environments
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        params.emulatorUserId = currentUser.uid;
        logger.debug('RecurringRuleItem', 'handleConfirmDelete', 'Adding emulatorUserId for development', {
          emulatorUserId: currentUser.uid,
          budgetId: selectedBudgetId
        });
      }

      console.log(">>> RECURRING RULE DEBUG: Calling manageRecurringInstances for delete with params:", {
        ...params,
        emulatorUserId: undefined  // Don't log actual emulatorUserId
      });

      await manageInstances(params);

      // If successful, delete the rule document itself
      const ruleRef = doc(db, `budgets/${selectedBudgetId}/recurringRules`, rule.id);
      await deleteDoc(ruleRef);

      // Success feedback
      showSuccess('Règle récurrente et toutes les transactions associées supprimées avec succès');
      
      // Notify parent component
      if (onDelete) {
        onDelete(rule);
      }
    } catch (error) {
      logger.error('RecurringRuleItem', 'handleConfirmDelete', 'Error deleting recurring rule', {
        error: error.message,
        stack: error.stack,
        budgetId: selectedBudgetId,
        ruleId: rule.id
      });
      showError('Échec de la suppression de la règle récurrente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
  };

  return (
    <>
      <div className={`recurring-rule-item ${!isRuleActive() ? 'inactive' : ''}`}>
        <div className="rule-header">
          <h3 className="rule-name">{rule.name}</h3>
          <div className="rule-amount">{formatCurrency(rule.amount)}</div>
        </div>
        
        <div className="rule-details">
          <div className="rule-category">
            <span 
              className="category-dot" 
              style={{ backgroundColor: rule.categoryColor }}
            ></span>
            {rule.categoryName}
          </div>
          <div className="rule-frequency">{getFrequencyText(rule.frequency)}</div>
        </div>
        
        <div className="rule-dates">
          <div className="rule-date">
            <strong>Début:</strong> {formatDate(rule.startDate)}
          </div>
          {rule.endDate && (
            <div className="rule-date">
              <strong>Fin:</strong> {formatDate(rule.endDate)}
            </div>
          )}
        </div>
        
        <div className="rule-actions">
          <button 
            className="rule-action-button rule-edit-button"
            onClick={() => onEdit(rule)}
            title="Modifier"
            disabled={isLoading}
          >
            ✎
          </button>
          <button 
            className={`rule-action-button rule-toggle-button ${isRuleActive() ? 'active' : 'inactive'}`}
            onClick={() => onToggleActive(rule.id, !isRuleActive())}
            title={isRuleActive() ? "Désactiver" : "Activer"}
            disabled={isLoading}
          >
            {isRuleActive() ? "✓" : "○"}
          </button>
          <button 
            className="rule-action-button rule-delete-button"
            onClick={handleDeleteClick}
            title="Supprimer"
            disabled={isLoading}
          >
            {isLoading ? "..." : "×"}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog - Now outside the item container */}
      {isConfirmOpen && (
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Supprimer la règle récurrente"
          message="Êtes-vous sûr de vouloir supprimer cette règle récurrente? Cela supprimera également TOUTES les transactions associées, y compris les transactions passées et futures."
          confirmText="Supprimer"
          cancelText="Annuler"
          isDestructive={true}
          itemId={rule.id}
        />
      )}
    </>
  );
};

function RecurringRulesPage() {
  const { currentUser } = useAuth();
  const { selectedBudgetId } = useBudgets();
  const { showSuccess, showError } = useToast();
  const [recurringRules, setRecurringRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key for forcing refresh
  
  // State for showing the add/edit form
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState(null);

  // Fetch recurring rules
  const fetchRecurringRules = useCallback(async () => {
    if (!currentUser || !selectedBudgetId) {
      setLoading(false);
      setRecurringRules([]);
      if (!selectedBudgetId) {
        setError('Veuillez sélectionner un budget');
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(">>> RECURRING RULES DEBUG: Fetching rules with budgetId:", selectedBudgetId);
      
      logger.info('RecurringRulesPage', 'fetchRecurringRules', 'Fetching recurring rules', {
        budgetId: selectedBudgetId
      });
      
      const rules = await getRecurringRules(selectedBudgetId);
      setRecurringRules(rules);
      
      logger.debug('RecurringRulesPage', 'fetchRecurringRules', 'Rules fetched successfully', {
        count: rules.length,
        budgetId: selectedBudgetId
      });
    } catch (err) {
      console.error(">>> RECURRING RULES ERROR: Failed to fetch rules:", {
        error: err.message,
        budgetId: selectedBudgetId
      });
      
      logger.error('RecurringRulesPage', 'fetchRecurringRules', 'Error fetching recurring rules', {
        error: err.message,
        stack: err.stack,
        budgetId: selectedBudgetId
      });
      setError('Failed to load recurring rules. Please try again later.');
      showError('Échec du chargement des règles récurrentes');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedBudgetId, showError]);

  // Fetch rules when component mounts, user changes, or refreshKey changes
  useEffect(() => {
    fetchRecurringRules();
  }, [fetchRecurringRules, refreshKey]);

  // Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Handle edit rule click
  const handleEditClick = (rule) => {
    setRuleToEdit(rule);
    setEditMode(true);
    setShowForm(true);
  };

  // Handle delete rule 
  const handleDeleteRule = (rule) => {
    // When a rule is deleted in RecurringRuleItem, refresh the list
    forceRefresh();
  };

  // Handle toggle active status
  const handleToggleActive = async (ruleId, active) => {
    if (!selectedBudgetId) {
      showError('Aucun budget sélectionné');
      return;
    }
    
    try {
      logger.info('RecurringRulesPage', 'handleToggleActive', 'Toggling recurring rule active state', {
        budgetId: selectedBudgetId,
        ruleId,
        active
      });
      
      await toggleRecurringRuleActive(selectedBudgetId, ruleId, currentUser.uid, active);
      
      // Update the rule in the state
      setRecurringRules(prevRules => 
        prevRules.map(rule => 
          rule.id === ruleId 
            ? { ...rule, isActive: active, active: active } // Update both fields for UI consistency
            : rule
        )
      );
      
      // Notify user
      showSuccess(`Règle récurrente ${active ? 'activée' : 'désactivée'} avec succès`);
    } catch (err) {
      logger.error('RecurringRulesPage', 'handleToggleActive', 'Error toggling recurring rule active state', {
        error: err.message,
        stack: err.stack,
        budgetId: selectedBudgetId,
        ruleId
      });
      showError(`Échec de la ${active ? 'activation' : 'désactivation'} de la règle récurrente`);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditMode(false);
    setRuleToEdit(null);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditMode(false);
    setRuleToEdit(null);
    forceRefresh();
  };

  // If no budget is selected, show a message
  if (!selectedBudgetId) {
    return (
      <div className="page-container">
        <div className="recurring-page-header">
          <h1>Règles de récurrence</h1>
        </div>
        <div className="empty-state">
          <p>Veuillez sélectionner un budget pour afficher les règles récurrentes.</p>
        </div>
      </div>
    );
  }

  // Render the component
  return (
    <div className="page-container">
      <div className="recurring-page-header">
        <h1>Règles de récurrence</h1>
        {!showForm && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditMode(false);
              setRuleToEdit(null);
              setShowForm(true);
            }}
          >
            Ajouter une règle
          </button>
        )}
      </div>
      
      {showForm ? (
        <RecurringRuleForm
          editMode={editMode}
          initialRule={ruleToEdit}
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <>
          {loading ? (
            <div className="loading-indicator">Chargement des règles récurrentes...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : recurringRules.length === 0 ? (
            <div className="empty-state">
              <p>Aucune règle récurrente pour le moment.</p>
              <p>Cliquez sur "Ajouter une règle" pour commencer.</p>
            </div>
          ) : (
            <div className="recurring-rules-list">
              {recurringRules.map(rule => (
                <RecurringRuleItem
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteRule}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecurringRulesPage; 