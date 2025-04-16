// src/services/firebase/categories.js

import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firestore';
import logger from '../logger';

/**
 * Get all categories for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of categories
 */
export const getCategories = async (userId) => {
  try {
    logger.debug('CategoryService', 'getCategories', 'Fetching categories', { userId });
    
    const q = query(
      collection(db, 'categories'),
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info('CategoryService', 'getCategories', 'Categories retrieved successfully', { 
      userId,
      count: categories.length
    });
    
    return categories;
  } catch (error) {
    logger.error('CategoryService', 'getCategories', 'Failed to get categories', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Get a category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} - Category data
 */
export const getCategory = async (categoryId) => {
  try {
    logger.debug('CategoryService', 'getCategory', 'Fetching category', { categoryId });
    
    const docRef = doc(db, 'categories', categoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('CategoryService', 'getCategory', 'Category not found', { categoryId });
      return null;
    }
    
    logger.info('CategoryService', 'getCategory', 'Category retrieved successfully');
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('CategoryService', 'getCategory', 'Failed to get category', {
      error: error.message,
      categoryId
    });
    throw error;
  }
};

/**
 * Create a new category
 * @param {string} userId - User ID
 * @param {Object} categoryData - Category data
 * @returns {Promise<string>} - Category ID
 */
export const createCategory = async (userId, categoryData) => {
  try {
    logger.debug('CategoryService', 'createCategory', 'Creating new category', { 
      userId,
      categoryName: categoryData.name
    });
    
    // Create a new document reference with auto-generated ID
    const categoryRef = doc(collection(db, 'categories'));
    
    // Create category document
    await setDoc(categoryRef, {
      userId,
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    logger.info('CategoryService', 'createCategory', 'Category created successfully', { 
      userId,
      categoryId: categoryRef.id
    });
    
    return categoryRef.id;
  } catch (error) {
    logger.error('CategoryService', 'createCategory', 'Failed to create category', {
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<void>}
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    logger.debug('CategoryService', 'updateCategory', 'Updating category', { categoryId });
    
    const categoryRef = doc(db, 'categories', categoryId);
    
    // Add updated timestamp
    const updatedData = {
      ...categoryData,
      updatedAt: serverTimestamp()
    };
    
    // Update category
    await updateDoc(categoryRef, updatedData);
    
    logger.info('CategoryService', 'updateCategory', 'Category updated successfully', { 
      categoryId 
    });
  } catch (error) {
    logger.error('CategoryService', 'updateCategory', 'Failed to update category', {
      error: error.message,
      categoryId
    });
    throw error;
  }
};

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 * @returns {Promise<void>}
 */
export const deleteCategory = async (categoryId) => {
  try {
    logger.debug('CategoryService', 'deleteCategory', 'Deleting category', { categoryId });
    
    await deleteDoc(doc(db, 'categories', categoryId));
    
    logger.info('CategoryService', 'deleteCategory', 'Category deleted successfully', { 
      categoryId 
    });
  } catch (error) {
    logger.error('CategoryService', 'deleteCategory', 'Failed to delete category', {
      error: error.message,
      categoryId
    });
    throw error;
  }
};

/**
 * Initialize default categories for a new user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const initializeDefaultCategories = async (userId) => {
  try {
    logger.debug('CategoryService', 'initializeDefaultCategories', 'Initializing default categories', { 
      userId 
    });
    
    const defaultCategories = [
      { name: 'Alimentation', icon: 'shopping-cart', color: '#4CAF50', order: 1, type: 'expense' },
      { name: 'Logement', icon: 'home', color: '#2196F3', order: 2, type: 'expense' },
      { name: 'Transport', icon: 'directions-car', color: '#FF9800', order: 3, type: 'expense' },
      { name: 'Loisirs', icon: 'local-movies', color: '#9C27B0', order: 4, type: 'expense' },
      { name: 'Santé', icon: 'favorite', color: '#F44336', order: 5, type: 'expense' },
      { name: 'Éducation', icon: 'school', color: '#795548', order: 6, type: 'expense' },
      { name: 'Services', icon: 'build', color: '#607D8B', order: 7, type: 'expense' },
      { name: 'Salaire', icon: 'work', color: '#00C853', order: 8, type: 'income' },
      { name: 'Cadeaux', icon: 'card-giftcard', color: '#AA00FF', order: 9, type: 'income' },
      { name: 'Autres Revenus', icon: 'attach-money', color: '#00BFA5', order: 10, type: 'income' }
    ];
    
    // Create batch operations for all default categories
    const batch = [];
    
    for (const category of defaultCategories) {
      batch.push(createCategory(userId, category));
    }
    
    // Execute all category creations in parallel
    await Promise.all(batch);
    
    logger.info('CategoryService', 'initializeDefaultCategories', 'Default categories initialized successfully', { 
      userId,
      count: defaultCategories.length
    });
  } catch (error) {
    logger.error('CategoryService', 'initializeDefaultCategories', 'Failed to initialize default categories', {
      error: error.message,
      userId
    });
    throw error;
  }
}; 