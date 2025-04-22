import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/firebase/categories';
import logger from '../../services/logger';
import './CategoriesPage.css';

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

  // Color palette following Zen/Tranquility theme
  const colorPalette = {
    // Core colors
    primarySage: "#919A7F",     // Primary expense
    secondaryTaupe: "#A58D7F",  // Secondary expense
    positiveTeal: "#568E8D",    // Primary income
    negativeTerra: "#C17C74",   // Expense/warning
    informationSlate: "#7A8D99", // Neutral
    
    // Extended palette - Expense colors
    sageVariation1: "#7D8A6F",
    sageVariation2: "#A5B095",
    taupeVariation1: "#8C7369",
    taupeVariation2: "#BDAA9C",
    softOlive: "#A3A68C",
    clay: "#B59A8C",
    softMoss: "#7A8C76",
    terracottaVariation1: "#A66962",
    terracottaVariation2: "#D59A94",
    mutedBrick: "#A57570",
    
    // Extended palette - Income colors
    tealVariation1: "#488C8B",
    tealVariation2: "#79A8A7",
    softBlueGreen: "#6A9A98",
    
    // Neutral/shared colors
    mutedLavender: "#9C8AA5",
    dustyBlue: "#8C9BA9",
    mutedOchre: "#BEA678"
  };
  
  // Define color sets for expense and income categories
  const expenseColors = [
    { id: colorPalette.negativeTerra, name: 'Terra Cotta' },
    { id: colorPalette.primarySage, name: 'Sage Green' },
    { id: colorPalette.secondaryTaupe, name: 'Taupe' },
    { id: colorPalette.sageVariation1, name: 'Dark Sage' },
    { id: colorPalette.sageVariation2, name: 'Light Sage' },
    { id: colorPalette.taupeVariation1, name: 'Dark Taupe' },
    { id: colorPalette.taupeVariation2, name: 'Light Taupe' },
    { id: colorPalette.softOlive, name: 'Soft Olive' },
    { id: colorPalette.clay, name: 'Clay' },
    { id: colorPalette.softMoss, name: 'Soft Moss' },
    { id: colorPalette.terracottaVariation1, name: 'Dark Terra Cotta' },
    { id: colorPalette.terracottaVariation2, name: 'Light Terra Cotta' },
    { id: colorPalette.mutedBrick, name: 'Muted Brick' }
  ];
  
  const incomeColors = [
    { id: colorPalette.positiveTeal, name: 'Teal' },
    { id: colorPalette.tealVariation1, name: 'Dark Teal' },
    { id: colorPalette.tealVariation2, name: 'Light Teal' },
    { id: colorPalette.softBlueGreen, name: 'Soft Blue Green' },
    { id: colorPalette.mutedLavender, name: 'Muted Lavender' },
    { id: colorPalette.dustyBlue, name: 'Dusty Blue' },
    { id: colorPalette.mutedOchre, name: 'Muted Ochre' }
  ];
  
  // Get active color set based on current category type
  const activeColorSet = useMemo(() => 
    categoryType === 'expense' ? expenseColors : incomeColors,
  [categoryType]);

  // Function to get the next available color for a new category
  const getNextAvailableColor = useCallback((type) => {
    const colorSet = type === 'expense' ? expenseColors : incomeColors;
    const existingCategories = categories.filter(cat => cat.type === type);
    
    // Extract colors already in use
    const usedColors = new Set(existingCategories.map(cat => cat.color));
    
    // Find first color not in use
    const availableColor = colorSet.find(color => !usedColors.has(color.id));
    
    // If all colors are used, pick one with the least usage
    if (!availableColor) {
      const colorCounts = {};
      existingCategories.forEach(cat => {
        colorCounts[cat.color] = (colorCounts[cat.color] || 0) + 1;
      });
      
      // Find color with minimum usage
      let minUsage = Infinity;
      let leastUsedColor = colorSet[0].id;
      
      Object.entries(colorCounts).forEach(([color, count]) => {
        if (count < minUsage) {
          minUsage = count;
          leastUsedColor = color;
        }
      });
      
      return leastUsedColor;
    }
    
    return availableColor.id;
  }, [categories]);

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

  // Default color based on category type
  useEffect(() => {
    if (!editMode) {
      // For new categories, automatically assign the next available color
      setCategoryColor(getNextAvailableColor(categoryType));
    }
  }, [categoryType, editMode, getNextAvailableColor]);

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
      color: categoryColor || getNextAvailableColor(categoryType),
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
    setCategoryColor(category.color || (category.type === 'expense' ? colorPalette.negativeTerra : colorPalette.positiveTeal));
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
      color: categoryColor || getNextAvailableColor(categoryType),
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
        categoryId: categoryToDelete.id
      });
      
      await deleteCategory(categoryToDelete.id);
      
      // Reset state
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      
      // Force a refresh of the categories
      forceRefresh();
      
      // Fallback: Manually remove the category from state
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      
      // Notify user
      showSuccess('Catégorie supprimée avec succès');
    } catch (err) {
      logger.error('CategoriesPage', 'handleDeleteConfirm', 'Error deleting category', {
        error: err.message,
        stack: err.stack,
        categoryId: categoryToDelete?.id
      });
      showError('Échec de la suppression de la catégorie');
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
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label 
                htmlFor="categoryColor" 
                style={{ 
                  color: '#2F2F2F', 
                  display: 'block', 
                  marginBottom: '16px', 
                  position: 'static'
                }}
              >
                Couleur <span className="required-mark">*</span>
              </label>
              
              <div className="color-selection-container" style={{ marginTop: '0' }}>
                {activeColorSet.map(color => (
                  <div 
                    key={color.id}
                    className={`color-option ${categoryColor === color.id ? 'color-option-selected' : ''}`}
                    style={{ backgroundColor: color.id }}
                    onClick={() => setCategoryColor(color.id)}
                    title={color.name}
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
              const categoryColor = category.color || 
                (category.type === 'expense' ? colorPalette.negativeTerra : colorPalette.positiveTeal);
              
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
      
      {showDeleteConfirm && categoryToDelete && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Supprimer la catégorie</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la catégorie <strong>{categoryToDelete.name}</strong>?
            </p>
            <p className="warning">
              Cette action est irréversible et pourrait affecter les transactions associées à cette catégorie.
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

export default CategoriesPage;