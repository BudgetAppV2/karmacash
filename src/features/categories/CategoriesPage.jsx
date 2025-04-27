import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CategoriesPage.css';
import CategoryForm from './CategoryForm';
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from '../../contexts/ToastContext';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/firebase/categories';
import { formatCurrency } from '../../utils/formatters';
import Loader from '../../components/ui/Loader';
import StatusMessage from '../../components/ui/StatusMessage';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import logger from '../../services/logger';

function CategoriesPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key for forcing refresh
  
  // Sorting state
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [categoryColor, setCategoryColor] = useState('');
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  
  // Deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Form validation
  const [formErrors, setFormErrors] = useState({});

  // Finalized Palette v5
  const paletteV5 = [
    '#7FB069', '#4A7856', '#99D4C8', '#B8B07F', '#709AC7',
    '#3A5A78', '#ADD8E6', '#7EB5D6', '#4FB0A5', '#337B77',
    '#85D4CF', '#C8AD9B', '#E0B470', '#9A705A', '#F4A97F',
    '#EEDC82', '#CC807A', '#E8B4BC', '#A5584E', '#A08CBF'
  ];

  // Default color for new categories
  const defaultNewCategoryColor = paletteV5[11]; // Neutral Tan/Beige

  // Use useCallback to memoize the fetchCategories function
  const fetchCategories = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      logger.info('CategoriesPage', 'fetchCategories', 'Fetching categories', {
        userId: currentUser.uid,
        timestamp: new Date().toISOString() // Add timestamp for debugging
      });
      
      const result = await getCategories(currentUser.uid);
      
      // Check if the result is an error object (returned by handleMissingIndex)
      if (result && result.error === true) {
        logger.error('CategoriesPage', 'fetchCategories', 'Error from categories service', { 
          message: result.message 
        });
        setError(result.message || 'Failed to load categories. Please try again later.');
        showError('Échec du chargement des catégories');
        setCategories([]);
        return;
      }
      
      // Process normal array result
      logger.debug('CategoriesPage', 'fetchCategories', 'Categories fetched:', {
        count: result.length,
        categories: JSON.stringify(result.map(c => ({ id: c.id, name: c.name, type: c.type })))
      });
      
      // Sort categories by order if available
      const sortedCategories = [...result].sort((a, b) => {
        if (a.order && b.order) return a.order - b.order;
        return 0;
      });
      
      setCategories(sortedCategories);
    } catch (err) {
      logger.error('CategoriesPage', 'fetchCategories', 'Error fetching categories', { 
        error: err.message,
        stack: err.stack
      });
      setError('Failed to load categories. Please try again later.');
      showError('Échec du chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  // Refresh categories when component mounts, currentUser changes, or refreshKey changes
  useEffect(() => {
    if (currentUser) {
      fetchCategories();
    }
  }, [currentUser, fetchCategories, refreshKey]);

  // Fix any potential text visibility issues
  useEffect(() => {
    // Helper function to update CSS variables
    const updateCSSVariables = () => {
      document.documentElement.style.setProperty('--form-text-color', '#2F2F2F');
      document.documentElement.style.setProperty('--form-background', '#FFFFFF');
    };
    
    // Apply CSS variables when component mounts
    updateCSSVariables();
    
    return () => {
      // Clean up when component unmounts
      document.documentElement.style.removeProperty('--form-text-color');
      document.documentElement.style.removeProperty('--form-background');
    };
  }, []);

  // Fix for input field focus issue
  useEffect(() => {
    if (showForm) {
      // Short timeout to ensure the DOM has updated
      const timer = setTimeout(() => {
        const nameInput = document.getElementById('categoryName');
        if (nameInput) {
          // Force the input to have correct styling
          nameInput.style.color = '#2F2F2F';
          nameInput.style.backgroundColor = '#FFFFFF';
          nameInput.focus();
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [showForm]);

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('expense');
    setCategoryColor('');
    setShowForm(false);
    setEditMode(false);
    setCategoryToEdit(null);
    setFormErrors({});
  };

  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Validate form data with duplicate name check
  const validateCategoryForm = (data) => {
    const errors = {};
    
    // Name validation
    if (!data.name || data.name.trim() === '') {
      errors.name = 'Le nom de la catégorie est requis';
    } else if (data.name.length > 30) {
      errors.name = 'Le nom ne peut pas dépasser 30 caractères';
    } else {
      // Check for duplicate names - skip if in edit mode and name didn't change
      const isDuplicate = categories.some(cat => 
        cat.name.toLowerCase() === data.name.toLowerCase() && 
        (!editMode || (editMode && categoryToEdit?.id !== cat.id))
      );
      
      if (isDuplicate) {
        errors.name = 'Une catégorie avec ce nom existe déjà';
      }
    }
    
    // Type validation
    if (!data.type) {
      errors.type = 'Le type de catégorie est requis';
    }
    
    return errors;
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor || defaultNewCategoryColor,
    };
    
    // Validate form
    const errors = validateCategoryForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show error for the first validation issue
      showError(Object.values(errors)[0]);
      return;
    }
    
    try {
      logger.info('CategoriesPage', 'handleAddCategory', 'Creating new category', {
        name: formData.name,
        type: formData.type
      });
      
      const categoryData = {
        ...formData,
        // Adding an order field to ensure it appears in ordered queries
        order: Date.now() // Use timestamp as a simple ordering mechanism
      };
      
      const newCategory = await createCategory(currentUser.uid, categoryData);
      
      logger.info('CategoriesPage', 'handleAddCategory', 'Category created successfully', {
        categoryId: newCategory.id
      });
      
      // Reset form
      resetForm();
      
      // Notify user
      showSuccess('Catégorie créée avec succès');
      
      // Forcibly update state with the new category added
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      
      // Force a refresh as a backup
      setTimeout(() => {
        forceRefresh();
      }, 500);
      
    } catch (err) {
      logger.error('CategoriesPage', 'handleAddCategory', 'Error creating category', { 
        error: err.message,
        stack: err.stack
      });
      showError('Échec de la création de la catégorie');
    }
  };

  const handleEditClick = (category) => {
    setCategoryToEdit(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setCategoryColor(category.color || defaultNewCategoryColor);
    setEditMode(true);
    setShowForm(true);
    setFormErrors({});
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryToEdit) return;
    
    // Get form data
    const formData = {
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor || defaultNewCategoryColor,
    };
    
    // Validate form
    const errors = validateCategoryForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show error for the first validation issue
      showError(Object.values(errors)[0]);
      return;
    }
    
    try {
      logger.info('CategoriesPage', 'handleUpdateCategory', 'Updating category', {
        categoryId: categoryToEdit.id,
        name: formData.name,
        type: formData.type
      });
      
      // Retain the existing order if present
      const categoryData = {
        ...formData,
        order: categoryToEdit.order || Date.now()
      };
      
      await updateCategory(categoryToEdit.id, categoryData);
      
      logger.info('CategoriesPage', 'handleUpdateCategory', 'Category updated successfully', {
        categoryId: categoryToEdit.id
      });
      
      // Reset form
      resetForm();
      
      // Notify user
      showSuccess('Catégorie mise à jour avec succès');
      
      // Update state
      const updatedCategories = categories.map(cat => 
        cat.id === categoryToEdit.id 
          ? { ...cat, ...categoryData, updatedAt: new Date() } 
          : cat
      );
      setCategories(updatedCategories);
      
      // Force a refresh as a backup
      setTimeout(() => {
        forceRefresh();
      }, 500);
      
    } catch (err) {
      logger.error('CategoriesPage', 'handleUpdateCategory', 'Error updating category', { 
        error: err.message,
        stack: err.stack,
        categoryId: categoryToEdit?.id
      });
      showError('Échec de la mise à jour de la catégorie');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      logger.info('CategoriesPage', 'handleDeleteConfirm', 'Deleting category', {
        categoryId: categoryToDelete.id,
        name: categoryToDelete.name
      });
      
      await deleteCategory(currentUser.uid, categoryToDelete.id);
      
      logger.info('CategoriesPage', 'handleDeleteConfirm', 'Category deleted successfully');
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      
      // Notify user
      showSuccess('Catégorie supprimée avec succès');
      
      // Refresh categories
      forceRefresh();
      
    } catch (err) {
      logger.error('CategoriesPage', 'handleDeleteConfirm', 'Error deleting category', {
        error: err.message,
        stack: err.stack
      });
      showError('Échec de la suppression de la catégorie');
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleCancelForm = () => {
    resetForm();
  };

  // Toggle sorting method
  const toggleSorting = () => {
    setSortAlphabetically(prev => !prev);
  };

  // Apply sorting to categories
  const sortedCategories = useMemo(() => {
    if (sortAlphabetically) {
      // Alphabetical sorting
      return [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    } else {
      // Order field sorting
      return [...categories].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
    }
  }, [categories, sortAlphabetically]);

  return (
    <div className="page-container">
      <div className="category-page-header">
        <h1>Catégories</h1>
        <div className="category-page-actions">
          <button 
            className="btn btn-secondary sort-toggle"
            onClick={toggleSorting}
            style={{ marginRight: '10px' }}
          >
            {sortAlphabetically ? 'Trier par ordre personnalisé' : 'Trier par ordre alphabétique'}
          </button>
          {!showForm && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Ajouter une catégorie
            </button>
          )}
        </div>
      </div>
      
      {showForm && (
        <div className="simple-category-form">
          <form onSubmit={editMode ? handleUpdateCategory : handleAddCategory}>
            <h3>{editMode ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h3>
            
            <div className="form-group">
              <label 
                htmlFor="categoryName" 
                style={{ 
                  color: '#2F2F2F', 
                  display: 'block', 
                  marginBottom: '12px', 
                  position: 'static',
                  lineHeight: '1.4'
                }}
              >
                Nom de la catégorie <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Entrez le nom de la catégorie"
                className={`category-input ${formErrors.name ? 'input-error' : ''}`}
                autoFocus
                style={{ 
                  display: 'block', 
                  width: '100%',
                  boxSizing: 'border-box',
                  zIndex: 1,
                  position: 'relative',
                  color: '#2F2F2F',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(136, 131, 122, 0.3)',
                  marginTop: '0',
                  marginBottom: '8px'
                }}
              />
              {formErrors.name && <div className="error-text">{formErrors.name}</div>}
            </div>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label 
                htmlFor="categoryType" 
                style={{ 
                  color: '#2F2F2F', 
                  display: 'block', 
                  marginBottom: '16px', 
                  position: 'static'
                }}
              >
                Type <span className="required-mark">*</span>
              </label>
              
              <div className="type-selection" style={{ marginTop: '0' }}>
                <button
                  type="button"
                  className={`type-button ${categoryType === 'expense' ? 'type-button-selected' : ''}`}
                  onClick={() => setCategoryType('expense')}
                  style={{ color: categoryType === 'expense' ? 'white' : '#2F2F2F' }}
                >
                  Dépense
                </button>
                <button
                  type="button"
                  className={`type-button ${categoryType === 'income' ? 'type-button-selected' : ''}`}
                  onClick={() => setCategoryType('income')}
                  style={{ color: categoryType === 'income' ? 'white' : '#2F2F2F' }}
                >
                  Revenu
                </button>
              </div>
              {formErrors.type && <div className="error-text">{formErrors.type}</div>}
            </div>
            
            <div className="form-group">
              <label>Couleur</label>
              <div className="color-selection-container">
                {paletteV5.map(color => (
                  <div 
                    key={color}
                    className={`color-option ${categoryColor === color ? 'color-option-selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCategoryColor(color)}
                    title={color}
                    role="button"
                    aria-label={`Select color ${color}`}
                    aria-pressed={categoryColor === color}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCategoryColor(color);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancelForm}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn btn-success"
              >
                {editMode ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="loading-indicator">Chargement des catégories...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <p>Aucune catégorie pour le moment.</p>
          <p>Cliquez sur "Ajouter une catégorie" pour commencer.</p>
        </div>
      ) : (
        <div>
          <p className="category-count">{categories.length} catégorie(s) trouvée(s)</p>
          <ul className="category-list">
            {sortedCategories.map(category => {
              const categoryColor = category.color || defaultNewCategoryColor;
              
              return (
                <li 
                  key={category.id} 
                  className="category-item" 
                  style={{ '--color-dot-bg': categoryColor }}
                >
                  <span 
                    className="category-color-dot" 
                    style={{ backgroundColor: categoryColor }}
                  ></span>
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-type-tag">
                      {category.type === 'expense' ? 'Dépense' : 'Revenu'}
                    </span>
                  </div>
                  <div className="category-actions">
                    <button 
                      onClick={() => handleEditClick(category)}
                      className="category-edit-button"
                      aria-label="Edit category"
                      title="Modifier"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(category)}
                      className="category-delete-button"
                      aria-label="Delete category"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && categoryToDelete && (
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          title="Supprimer la catégorie"
          message={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete.name}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDestructive={true}
        />
      )}
    </div>
  );
}

export default CategoriesPage;