import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Simple form state
  const [showForm, setShowForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  
  // Deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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

  const resetForm = () => {
    setCategoryName('');
    setCategoryType('expense');
    setShowForm(false);
  };

  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      showError('Le nom de la catégorie ne peut pas être vide');
      return;
    }
    
    try {
      logger.info('CategoriesPage', 'handleAddCategory', 'Creating new category', {
        name: categoryName.trim(),
        type: categoryType
      });
      
      const categoryData = {
        name: categoryName.trim(),
        type: categoryType,
        // Default colors based on type
        color: categoryType === 'expense' ? '#C17C74' : '#568E8D',
        // Default icon based on type
        icon: categoryType === 'expense' ? 'shopping-cart' : 'wallet',
        // Adding an order field to ensure it appears in ordered queries
        order: Date.now() // Use timestamp as a simple ordering mechanism
      };
      
      const newCategoryId = await createCategory(currentUser.uid, categoryData);
      
      logger.info('CategoriesPage', 'handleAddCategory', 'Category created successfully', {
        categoryId: newCategoryId
      });
      
      // Reset form
      resetForm();
      
      // Notify user
      showSuccess('Catégorie créée avec succès');
      
      // Manually create full category object
      const newCategory = { 
        id: newCategoryId, 
        ...categoryData,
        userId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
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

  return (
    <div className="page-container">
      <div className="category-page-header">
        <h1>Catégories</h1>
        <div className="category-page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annuler' : 'Ajouter une catégorie'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="simple-category-form">
          <form onSubmit={handleAddCategory}>
            <div className="form-row">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nom de la catégorie"
                required
                className="category-input"
                autoFocus
              />
              
              <select 
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
                className="category-select"
              >
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
              
              <button type="submit" className="btn btn-success">
                Ajouter
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
            {categories.map(category => (
              <li key={category.id} className="category-item">
                <span 
                  className="category-color-dot" 
                  style={{
                    backgroundColor: category.type === 'expense' ? '#C17C74' : '#568E8D'
                  }}
                ></span>
                <span className="category-name">{category.name}</span>
                <span className="category-type-tag">
                  {category.type === 'expense' ? 'Dépense' : 'Revenu'}
                </span>
                <button 
                  onClick={() => handleDeleteClick(category)}
                  className="category-delete-button"
                  aria-label="Delete category"
                >
                  ×
                </button>
              </li>
            ))}
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