import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getCategories } from '../../../services/firebase/categories';
import { 
  addRecurringRule, 
  updateRecurringRule,
  FREQUENCY_TYPES
} from '../../../services/firebase/recurringRules';
import { format, parseISO, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import logger from '../../../services/logger';
import './RecurringRuleForm.css';

// Define styles to override any problematic global CSS
const formStyles = {
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    maxWidth: '600px',
    margin: '0 auto'
  },
  formGroup: {
    marginBottom: '24px',
    position: 'relative'
  },
  label: {
    display: 'block',
    position: 'static',
    marginBottom: '8px',
    color: '#2F2F2F',
    fontSize: '0.95rem',
    fontWeight: '500',
    transform: 'none',
    pointerEvents: 'auto',
    background: 'none',
    textShadow: 'none'
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(136, 131, 122, 0.3)',
    borderRadius: '6px',
    color: '#2F2F2F',
    fontSize: '1rem'
  },
  select: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(136, 131, 122, 0.3)',
    borderRadius: '6px',
    color: '#2F2F2F',
    fontSize: '1rem'
  },
  prefixWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  prefix: {
    position: 'absolute',
    left: '12px',
    color: '#2F2F2F',
    fontWeight: '500',
    pointerEvents: 'none',
    zIndex: 1
  },
  inputWithPrefix: {
    paddingLeft: '24px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(136, 131, 122, 0.3)',
    borderRadius: '6px',
    color: '#2F2F2F',
    fontSize: '1rem',
    minHeight: '80px',
    resize: 'vertical'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px'
  },
  checkbox: {
    marginRight: '8px',
    width: '16px',
    height: '16px'
  },
  checkboxLabel: {
    cursor: 'pointer',
    color: '#2F2F2F'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginTop: '32px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
  },
  button: {
    minWidth: '120px',
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    color: '#2F2F2F',
    border: '1px solid rgba(136, 131, 122, 0.3)'
  },
  submitButton: {
    backgroundColor: '#919A7F',
    color: 'white'
  },
  requiredMark: {
    color: '#C17C74',
    fontWeight: 'bold',
    marginLeft: '2px'
  },
  errorText: {
    color: '#C17C74',
    fontSize: '0.8rem',
    marginTop: '6px'
  }
};

function RecurringRuleForm({ 
  editMode = false, 
  initialRule = null, 
  onCancel, 
  onSuccess 
}) {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Form state
  const [ruleName, setRuleName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(FREQUENCY_TYPES.MONTHLY);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Categories for selection
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Get categories for the form
  const fetchCategories = useCallback(async () => {
    if (!currentUser) return;
    
    setCategoriesLoading(true);
    
    try {
      const fetchedCategories = await getCategories(currentUser.uid);
      setCategories(fetchedCategories);
      
      // If we're not in edit mode and there are categories, select the first one
      if (!editMode && fetchedCategories.length > 0 && !categoryId) {
        setCategoryId(fetchedCategories[0].id);
      }
    } catch (err) {
      logger.error('RecurringRuleForm', 'fetchCategories', 'Error fetching categories', {
        error: err.message,
        stack: err.stack
      });
      showError('Échec du chargement des catégories');
    } finally {
      setCategoriesLoading(false);
    }
  }, [currentUser, showError, categoryId, editMode]);
  
  // Initialize form with rule data if in edit mode
  useEffect(() => {
    if (editMode && initialRule) {
      setRuleName(initialRule.name || '');
      setCategoryId(initialRule.categoryId || '');
      setAmount(initialRule.amount?.toString() || '');
      setFrequency(initialRule.frequency || FREQUENCY_TYPES.MONTHLY);
      
      // Format date for input field - handling Firestore Timestamp or Date objects
      if (initialRule.startDate) {
        let date;
        if (initialRule.startDate.toDate) { // It's a Firestore Timestamp
          date = initialRule.startDate.toDate();
        } else if (initialRule.startDate instanceof Date) {
          date = initialRule.startDate;
        } else {
          date = new Date(initialRule.startDate);
        }
        setStartDate(format(date, 'yyyy-MM-dd'));
      }
      
      if (initialRule.endDate) {
        setHasEndDate(true);
        let date;
        if (initialRule.endDate.toDate) { // It's a Firestore Timestamp
          date = initialRule.endDate.toDate();
        } else if (initialRule.endDate instanceof Date) {
          date = initialRule.endDate;
        } else {
          date = new Date(initialRule.endDate);
        }
        setEndDate(format(date, 'yyyy-MM-dd'));
      } else {
        setHasEndDate(false);
        setEndDate('');
      }
      
      setNotes(initialRule.notes || '');
    }
  }, [editMode, initialRule]);
  
  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!ruleName.trim()) {
      errors.name = 'Le nom de la règle est requis';
    }
    
    if (!categoryId) {
      errors.categoryId = 'La catégorie est requise';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.amount = 'Un montant valide est requis';
    }
    
    if (!frequency) {
      errors.frequency = 'La fréquence est requise';
    }
    
    if (!startDate) {
      errors.startDate = 'La date de début est requise';
    }
    
    if (hasEndDate && !endDate) {
      errors.endDate = 'La date de fin est requise si l\'option est sélectionnée';
    }
    
    if (hasEndDate && startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errors.endDate = 'La date de fin doit être postérieure à la date de début';
    }
    
    return errors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show error for the first validation issue
      showError(Object.values(errors)[0]);
      return;
    }
    
    // Clear previous errors
    setFormErrors({});
    setSubmitting(true);
    
    try {
      // Find selected category to get its details
      const selectedCategory = categories.find(cat => cat.id === categoryId);
      const categoryName = selectedCategory?.name || '';
      const categoryColor = selectedCategory?.color || '';
      const categoryType = selectedCategory?.type || 'expense';
      
      // Parse dates following Section 5.4.2 - set to start of day in local timezone
      // Using parseISO to convert the ISO string from the date input to a Date object
      const parsedStartDate = startOfDay(parseISO(startDate));
      
      // Handle end date if set
      let parsedEndDate = null;
      if (hasEndDate && endDate) {
        parsedEndDate = startOfDay(parseISO(endDate));
      }
      
      // Prepare rule data
      const ruleData = {
        name: ruleName.trim(),
        categoryId,
        categoryName,
        categoryColor,
        categoryType,
        amount: parseFloat(amount),
        frequency,
        // Use Date objects for dates - service will convert to Firestore Timestamps
        startDate: parsedStartDate,
        // Set nextDate to be the same as startDate for new rules
        nextDate: parsedStartDate,
        endDate: parsedEndDate,
        notes: notes.trim(),
        active: true, // Default to active
      };
      
      // Log the rule data before sending it to the service for debugging
      logger.debug('RecurringRuleForm', 'handleSubmit', 'Rule data being sent to service', {
        ruleData: JSON.parse(JSON.stringify(ruleData)),
        editMode
      });
      
      if (editMode && initialRule) {
        // Update existing rule
        logger.debug('RecurringRuleForm', 'handleSubmit', 'Updating rule', {
          userId: currentUser.uid,
          ruleId: initialRule.id
        });
        
        await updateRecurringRule(currentUser.uid, initialRule.id, ruleData);
        
        logger.info('RecurringRuleForm', 'handleSubmit', 'Rule updated successfully', {
          userId: currentUser.uid,
          ruleId: initialRule.id
        });
        showSuccess('Règle récurrente mise à jour avec succès');
      } else {
        // Create new rule
        await addRecurringRule(currentUser.uid, ruleData);
        logger.info('RecurringRuleForm', 'handleSubmit', 'Rule created successfully');
        showSuccess('Règle récurrente créée avec succès');
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      logger.error('RecurringRuleForm', 'handleSubmit', 'Error saving recurring rule', {
        error: err.message,
        stack: err.stack
      });
      
      showError(editMode 
        ? 'Échec de la mise à jour de la règle récurrente' 
        : 'Échec de la création de la règle récurrente'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get category display text
  const getCategoryOptionText = (category) => {
    return `${category.name} (${category.type === 'expense' ? 'Dépense' : 'Revenu'})`;
  };

  return (
    <div style={formStyles.form}>
      <h3 style={{ 
        marginTop: 0, 
        marginBottom: '24px', 
        color: '#2F2F2F', 
        fontWeight: 500,
        fontSize: '1.3rem',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        paddingBottom: '16px'
      }}>
        {editMode ? 'Modifier la règle récurrente' : 'Ajouter une règle récurrente'}
      </h3>
      
      <form onSubmit={handleSubmit}>
        {/* Rule Name */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="ruleName"
            style={formStyles.label}
          >
            Nom <span style={formStyles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id="ruleName"
            style={{
              ...formStyles.input,
              ...(formErrors.name ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
            }}
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Ex: Loyer mensuel"
            disabled={submitting}
          />
          {formErrors.name && <div style={formStyles.errorText}>{formErrors.name}</div>}
        </div>
        
        {/* Category Selection */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="categoryId"
            style={formStyles.label}
          >
            Catégorie <span style={formStyles.requiredMark}>*</span>
          </label>
          <select
            id="categoryId"
            style={{
              ...formStyles.select,
              ...(formErrors.categoryId ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
            }}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting || categoriesLoading}
          >
            <option value="" disabled>Sélectionnez une catégorie</option>
            {categories.map(category => (
              <option 
                key={category.id} 
                value={category.id}
              >
                {getCategoryOptionText(category)}
              </option>
            ))}
          </select>
          {formErrors.categoryId && <div style={formStyles.errorText}>{formErrors.categoryId}</div>}
        </div>
        
        {/* Amount */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="amount"
            style={formStyles.label}
          >
            Montant <span style={formStyles.requiredMark}>*</span>
          </label>
          <div style={formStyles.prefixWrapper}>
            <span style={formStyles.prefix}>$</span>
            <input
              type="number"
              id="amount"
              style={{
                ...formStyles.input,
                ...formStyles.inputWithPrefix,
                ...(formErrors.amount ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
              }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              disabled={submitting}
            />
          </div>
          {formErrors.amount && <div style={formStyles.errorText}>{formErrors.amount}</div>}
        </div>
        
        {/* Frequency */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="frequency"
            style={formStyles.label}
          >
            Fréquence <span style={formStyles.requiredMark}>*</span>
          </label>
          <select
            id="frequency"
            style={{
              ...formStyles.select,
              ...(formErrors.frequency ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
            }}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            disabled={submitting}
          >
            <option value={FREQUENCY_TYPES.DAILY}>Quotidien</option>
            <option value={FREQUENCY_TYPES.WEEKLY}>Hebdomadaire</option>
            <option value={FREQUENCY_TYPES.BIWEEKLY}>Bi-hebdomadaire</option>
            <option value={FREQUENCY_TYPES.MONTHLY}>Mensuel</option>
            <option value={FREQUENCY_TYPES.QUARTERLY}>Trimestriel</option>
            <option value={FREQUENCY_TYPES.YEARLY}>Annuel</option>
          </select>
          {formErrors.frequency && <div style={formStyles.errorText}>{formErrors.frequency}</div>}
        </div>
        
        {/* Start Date */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="startDate"
            style={formStyles.label}
          >
            Date de début <span style={formStyles.requiredMark}>*</span>
          </label>
          <input
            type="date"
            id="startDate"
            style={{
              ...formStyles.input,
              ...(formErrors.startDate ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
            }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={submitting}
          />
          {formErrors.startDate && <div style={formStyles.errorText}>{formErrors.startDate}</div>}
        </div>
        
        {/* End Date (Optional) */}
        <div style={formStyles.formGroup}>
          <div style={formStyles.checkboxGroup}>
            <input
              type="checkbox"
              id="hasEndDate"
              style={formStyles.checkbox}
              checked={hasEndDate}
              onChange={(e) => setHasEndDate(e.target.checked)}
              disabled={submitting}
            />
            <label 
              htmlFor="hasEndDate" 
              style={formStyles.checkboxLabel}
            >
              Date de fin (optionnel)
            </label>
          </div>
          
          {hasEndDate && (
            <input
              type="date"
              id="endDate"
              style={{
                ...formStyles.input,
                ...(formErrors.endDate ? { borderColor: '#C17C74', backgroundColor: 'rgba(193, 124, 116, 0.05)' } : {})
              }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={submitting}
            />
          )}
          {formErrors.endDate && <div style={formStyles.errorText}>{formErrors.endDate}</div>}
        </div>
        
        {/* Notes (Optional) */}
        <div style={formStyles.formGroup}>
          <label 
            htmlFor="notes"
            style={formStyles.label}
          >
            Notes (optionnel)
          </label>
          <textarea
            id="notes"
            style={formStyles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Notes ou détails supplémentaires..."
            disabled={submitting}
          ></textarea>
        </div>
        
        {/* Form Actions */}
        <div style={formStyles.formActions}>
          <button 
            type="button" 
            style={{...formStyles.button, ...formStyles.cancelButton}}
            onClick={onCancel}
            disabled={submitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            style={{
              ...formStyles.button, 
              ...formStyles.submitButton,
              ...(submitting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
            }}
            disabled={submitting}
          >
            {submitting 
              ? 'Enregistrement...' 
              : editMode 
                ? 'Mettre à jour' 
                : 'Créer'
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default RecurringRuleForm; 