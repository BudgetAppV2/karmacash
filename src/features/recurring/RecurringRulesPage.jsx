import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
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

// Component to display a single recurring rule
const RecurringRuleItem = ({ rule, onEdit, onDelete, onToggleActive }) => {
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

  return (
    <div className={`recurring-rule-item ${!rule.active ? 'inactive' : ''}`}>
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
        >
          ✎
        </button>
        <button 
          className={`rule-action-button rule-toggle-button ${rule.active ? 'active' : 'inactive'}`}
          onClick={() => onToggleActive(rule.id, !rule.active)}
          title={rule.active ? "Désactiver" : "Activer"}
        >
          {rule.active ? "✓" : "○"}
        </button>
        <button 
          className="rule-action-button rule-delete-button"
          onClick={() => onDelete(rule)}
          title="Supprimer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

function RecurringRulesPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [recurringRules, setRecurringRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key for forcing refresh
  
  // State for handling delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  
  // State for showing the add/edit form
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState(null);

  // Fetch recurring rules
  const fetchRecurringRules = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      logger.info('RecurringRulesPage', 'fetchRecurringRules', 'Fetching recurring rules', {
        userId: currentUser.uid
      });
      
      const rules = await getRecurringRules(currentUser.uid);
      setRecurringRules(rules);
      
      logger.debug('RecurringRulesPage', 'fetchRecurringRules', 'Rules fetched successfully', {
        count: rules.length
      });
    } catch (err) {
      logger.error('RecurringRulesPage', 'fetchRecurringRules', 'Error fetching recurring rules', {
        error: err.message,
        stack: err.stack
      });
      setError('Failed to load recurring rules. Please try again later.');
      showError('Échec du chargement des règles récurrentes');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  // Fetch rules when component mounts, user changes, or refreshKey changes
  useEffect(() => {
    if (currentUser) {
      fetchRecurringRules();
    }
  }, [currentUser, fetchRecurringRules, refreshKey]);

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

  // Handle delete rule click
  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!ruleToDelete || !currentUser) return;
    
    try {
      logger.info('RecurringRulesPage', 'handleDeleteConfirm', 'Deleting recurring rule', {
        userId: currentUser.uid,
        ruleId: ruleToDelete.id
      });
      
      await deleteRecurringRule(currentUser.uid, ruleToDelete.id);
      
      // Reset state
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
      
      // Force a refresh of the rules
      forceRefresh();
      
      // Notify user
      showSuccess('Règle récurrente supprimée avec succès');
    } catch (err) {
      logger.error('RecurringRulesPage', 'handleDeleteConfirm', 'Error deleting recurring rule', {
        error: err.message,
        stack: err.stack,
        userId: currentUser?.uid,
        ruleId: ruleToDelete?.id
      });
      showError('Échec de la suppression de la règle récurrente');
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRuleToDelete(null);
  };

  // Handle toggle active status
  const handleToggleActive = async (ruleId, active) => {
    try {
      logger.info('RecurringRulesPage', 'handleToggleActive', 'Toggling recurring rule active state', {
        ruleId,
        active
      });
      
      await toggleRecurringRuleActive(ruleId, active);
      
      // Update the rule in the state
      setRecurringRules(prevRules => 
        prevRules.map(rule => 
          rule.id === ruleId 
            ? { ...rule, active }
            : rule
        )
      );
      
      // Notify user
      showSuccess(`Règle récurrente ${active ? 'activée' : 'désactivée'} avec succès`);
    } catch (err) {
      logger.error('RecurringRulesPage', 'handleToggleActive', 'Error toggling recurring rule active state', {
        error: err.message,
        stack: err.stack,
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
                  onDelete={handleDeleteClick}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {showDeleteConfirm && ruleToDelete && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Supprimer la règle récurrente</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la règle récurrente <strong>{ruleToDelete.name}</strong>?
            </p>
            <p className="warning">
              Cette action est irréversible.
            </p>
            <div className="delete-confirm-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleDeleteCancel}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringRulesPage; 