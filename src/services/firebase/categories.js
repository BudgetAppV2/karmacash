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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from './firebaseInit';
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
    return handleMissingIndex(error);
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
 * @returns {Promise<boolean>} - Success indicator
 */
export const initializeDefaultCategories = async (userId) => {
  try {
    logger.debug('CategoryService', 'initializeDefaultCategories', 'Initializing default categories', { 
      userId 
    });
    
    // Check if user already has categories
    const existingCategoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', userId)
    );
    
    const existingSnapshot = await getDocs(existingCategoriesQuery);
    
    if (!existingSnapshot.empty) {
      logger.info('CategoryService', 'initializeDefaultCategories', 'User already has categories', {
        userId,
        count: existingSnapshot.size
      });
      return true;
    }
    
    const defaultCategories = [
      { name: 'Alimentation', icon: 'restaurant', color: '#919A7F', order: 1, type: 'expense' }, // Sage green
      { name: 'Transport', icon: 'directions_car', color: '#568E8D', order: 2, type: 'expense' }, // Muted teal
      { name: 'Logement', icon: 'home', color: '#919A7F', order: 3, type: 'expense' }, // Sage green
      { name: 'Divertissement', icon: 'movie', color: '#568E8D', order: 4, type: 'expense' }, // Muted teal
      { name: 'Shopping', icon: 'shopping_cart', color: '#919A7F', order: 5, type: 'expense' }, // Sage green
      { name: 'Services', icon: 'power', color: '#568E8D', order: 6, type: 'expense' }, // Muted teal
      { name: 'Santé', icon: 'favorite', color: '#C17C74', order: 7, type: 'expense' }, // Soft terra cotta
      { name: 'Éducation', icon: 'school', color: '#A58D7F', order: 8, type: 'expense' }, // Taupe
      { name: 'Salaire', icon: 'work', color: '#568E8D', order: 9, type: 'income' }, // Muted teal
      { name: 'Cadeaux', icon: 'card_giftcard', color: '#919A7F', order: 10, type: 'income' }, // Sage green
      { name: 'Investissements', icon: 'trending_up', color: '#568E8D', order: 11, type: 'income' }, // Muted teal
      { name: 'Autres Revenus', icon: 'attach_money', color: '#919A7F', order: 12, type: 'income' } // Sage green
    ];
    
    // Create batch operations for all default categories
    const batch = [];
    
    for (const category of defaultCategories) {
      batch.push(
        addDoc(collection(db, 'categories'), {
          ...category,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
    }
    
    // Execute all category creations in parallel
    await Promise.all(batch);
    
    logger.info('CategoryService', 'initializeDefaultCategories', 'Default categories initialized successfully', { 
      userId,
      count: defaultCategories.length
    });
    
    return true;
  } catch (error) {
    logger.error('CategoryService', 'initializeDefaultCategories', 'Failed to initialize default categories', {
      error: error.message,
      userId
    });
    return handleMissingIndex(error);
  }
};

// Add a function to handle missing indexes by providing clear instructions
export const handleMissingIndex = (error) => {
  if (error.code === 'failed-precondition' || error.message.includes('requires an index')) {
    console.error('Firebase index error detected. Please create the required index by:');
    console.error('1. Going to the Firebase console');
    console.error('2. Click on the link in the error message below:');
    console.error(error.message);
    console.error('3. Click "Create Index" in the Firebase console');
    
    return {
      error: true,
      message: 'Firebase database index needs to be created. Please see console for instructions.',
      indexUrl: error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0] || null
    };
  }
  
  return {
    error: true,
    message: error.message
  };
}; 