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
  addDoc,
  writeBatch
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
    console.log('🔍 getCategories: Starting fetch for userId:', userId);
    
    logger.debug('CategoryService', 'getCategories', 'Fetching categories', { 
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Query all categories for the user from the subcollection
    const path = `users/${userId}/categories`;
    console.log('🔍 ACCESSING CATEGORIES PATH:', path);
    const categoriesCollection = collection(db, path);
    const querySnapshot = await getDocs(categoriesCollection);
    
    logger.debug('CategoryService', 'getCategories', 'Query result', {
      count: querySnapshot.size,
      empty: querySnapshot.empty
    });
    
    // If collection is empty, return empty array early
    if (querySnapshot.empty) {
      logger.info('CategoryService', 'getCategories', 'No categories found for user', { userId });
      console.log('⚠️ NO CATEGORIES FOUND for user:', userId);
      return [];
    }
    
    // Convert to array and ensure all categories have an order field
    let categories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const category = {
        id: doc.id,
        ...data
      };
      
      // Ensure order field exists
      if (category.order === undefined || category.order === null) {
        // Log that we found a category without an order field
        console.log(`⚠️ Category without order field detected: ${category.id} (${category.name})`);
        
        // Assign a high order value to put it at the end
        category.order = 10000 + Date.now() % 1000;
        
        // Schedule an update to add the order field to the category in Firestore
        // This is done asynchronously and doesn't block the current operation
        updateCategoryOrderField(userId, category.id, category.order)
          .catch(err => logger.error('CategoryService', 'getCategories', 'Failed to update missing order field', {
            categoryId: category.id,
            error: err.message
          }));
      }
      
      return category;
    });
    
    // Convert Firebase timestamps to regular dates
    categories.forEach(category => {
      if (category.createdAt && typeof category.createdAt.toDate === 'function') {
        category.createdAt = category.createdAt.toDate();
      }
      if (category.updatedAt && typeof category.updatedAt.toDate === 'function') {
        category.updatedAt = category.updatedAt.toDate();
      }
    });
    
    // Sort by order
    categories.sort((a, b) => (a.order || 9999) - (b.order || 9999));
    
    logger.info('CategoryService', 'getCategories', 'Categories retrieved successfully', { 
      userId,
      count: categories.length,
      categoryNames: categories.map(c => c.name).join(', ')
    });
    
    console.log(`✅ SUCCESS: Found ${categories.length} categories`);
    return categories;
  } catch (error) {
    logger.error('CategoryService', 'getCategories', 'Failed to get categories', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId
    });
    
    console.log('❌ ERROR in getCategories:', error.message);
    return [];
  }
};

/**
 * Helper function to update the order field of a category
 * @param {string} userId - User ID
 * @param {string} categoryId - Category ID
 * @param {number} orderValue - Order value to set
 * @returns {Promise<void>}
 */
const updateCategoryOrderField = async (userId, categoryId, orderValue) => {
  try {
    const categoryRef = doc(db, `users/${userId}/categories`, categoryId);
    await updateDoc(categoryRef, { 
      order: orderValue,
      updatedAt: serverTimestamp()
    });
    
    logger.info('CategoryService', 'updateCategoryOrderField', 'Order field updated successfully', {
      userId,
      categoryId,
      orderValue
    });
  } catch (error) {
    logger.error('CategoryService', 'updateCategoryOrderField', 'Failed to update order field', {
      error: error.message,
      userId,
      categoryId
    });
    throw error;
  }
};

/**
 * Get a category by ID
 * @param {string} userId - User ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} - Category data
 */
export const getCategory = async (userId, categoryId) => {
  try {
    logger.debug('CategoryService', 'getCategory', 'Fetching category', { userId, categoryId });
    
    const docRef = doc(db, `users/${userId}/categories`, categoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('CategoryService', 'getCategory', 'Category not found', { 
        userId, 
        categoryId 
      });
      return null;
    }
    
    logger.info('CategoryService', 'getCategory', 'Category retrieved successfully', { 
      userId, 
      categoryId 
    });
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    logger.error('CategoryService', 'getCategory', 'Failed to get category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
      categoryId
    });
    throw error;
  }
};

/**
 * Create a new category
 * @param {string} userId - User ID
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} - Created category with ID
 */
export const createCategory = async (userId, categoryData) => {
  try {
    logger.debug('CategoryService', 'createCategory', 'Creating new category', { 
      userId,
      categoryName: categoryData.name,
      categoryData: JSON.stringify(categoryData)
    });
    
    // Ensure order field exists and is a number
    if (categoryData.order === undefined || categoryData.order === null) {
      // Generate a timestamp-based order value
      // This ensures new categories are added at the end
      categoryData.order = Date.now();
    }
    
    // Create a new document reference with auto-generated ID
    const path = `users/${userId}/categories`;
    console.log('🔍 CREATING CATEGORY AT PATH:', path);
    const categoryRef = doc(collection(db, path));
    
    // Create category document with all required fields
    const fullCategoryData = {
      userId,
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    logger.debug('CategoryService', 'createCategory', 'Full category data', { 
      data: JSON.stringify(fullCategoryData)
    });
    
    await setDoc(categoryRef, fullCategoryData);
    
    logger.info('CategoryService', 'createCategory', 'Category created successfully', { 
      userId,
      categoryId: categoryRef.id,
      categoryName: categoryData.name
    });
    
    console.log('✅ CATEGORY CREATED:', categoryRef.id, 'at path:', path);
    
    // Return full category object with ID for immediate UI update
    return {
      id: categoryRef.id,
      ...categoryData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    logger.error('CategoryService', 'createCategory', 'Failed to create category', {
      error: error.message,
      stack: error.stack,
      userId
    });
    throw error;
  }
};

/**
 * Update a category
 * @param {string} userId - User ID
 * @param {string} categoryId - Category ID
 * @param {Object} categoryData - Category data to update
 * @returns {Promise<Object>} - Updated category
 */
export const updateCategory = async (userId, categoryId, categoryData) => {
  try {
    logger.debug('CategoryService', 'updateCategory', 'Updating category', { 
      userId,
      categoryId,
      categoryData 
    });
    
    const categoryRef = doc(db, `users/${userId}/categories`, categoryId);
    const docSnap = await getDoc(categoryRef);
    
    // Check if category exists
    if (!docSnap.exists()) {
      const error = new Error(`Category ${categoryId} not found`);
      logger.error('CategoryService', 'updateCategory', 'Category not found', { 
        userId,
        categoryId 
      });
      throw error;
    }
    
    // Update in the user's subcollection
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    
    logger.info('CategoryService', 'updateCategory', 'Category updated successfully', { 
      userId,
      categoryId 
    });
    
    return {
      id: categoryId,
      ...docSnap.data(),
      ...categoryData
    };
  } catch (error) {
    logger.error('CategoryService', 'updateCategory', 'Failed to update category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
      categoryId
    });
    throw error;
  }
};

/**
 * Delete a category
 * @param {string} userId - User ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<void>}
 */
export const deleteCategory = async (userId, categoryId) => {
  try {
    logger.debug('CategoryService', 'deleteCategory', 'Deleting category', { 
      userId,
      categoryId 
    });
    
    // Check if category exists
    const categoryRef = doc(db, `users/${userId}/categories`, categoryId);
    const docSnap = await getDoc(categoryRef);
    
    if (!docSnap.exists()) {
      logger.warn('CategoryService', 'deleteCategory', 'Category not found', { 
        userId,
        categoryId 
      });
      return; // Nothing to delete
    }
    
    // Delete the category
    await deleteDoc(categoryRef);
    logger.info('CategoryService', 'deleteCategory', 'Category deleted successfully', { 
      userId,
      categoryId 
    });
    
  } catch (error) {
    logger.error('CategoryService', 'deleteCategory', 'Failed to delete category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId,
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
    const categoriesPath = `users/${userId}/categories`;
    console.log('🔍 CHECKING FOR EXISTING CATEGORIES at path:', categoriesPath);
    const categoriesCollection = collection(db, categoriesPath);
    const existingSnapshot = await getDocs(categoriesCollection);
    
    if (!existingSnapshot.empty) {
      logger.info('CategoryService', 'initializeDefaultCategories', 'User already has categories', {
        userId,
        count: existingSnapshot.size
      });
      console.log(`✅ User already has ${existingSnapshot.size} categories`);
      return true;
    }
    
    const defaultCategories = [
      { name: 'Alimentation', icon: 'restaurant', color: '#919A7F', order: 1, type: 'expense' }, // Sage green
      { name: 'Transport', icon: 'directions_car', color: '#568E8D', order: 2, type: 'expense' }, // Muted teal
      { name: 'Logement', icon: 'home', color: '#919A7F', order: 3, type: 'expense' }, // Sage green
      { name: 'Divertissement', icon: 'movie', color: '#568E8D', order: 4, type: 'expense' }, // Muted teal
      { name: 'Shopping', icon: 'shopping_cart', color: '#919A7F', order: 5, type: 'expense' }, // Sage green
      { name: 'Services', icon: 'home_repair_service', color: '#568E8D', order: 6, type: 'expense' }, // Muted teal
      { name: 'Santé', icon: 'favorite', color: '#919A7F', order: 7, type: 'expense' }, // Sage green
      { name: 'Éducation', icon: 'school', color: '#568E8D', order: 8, type: 'expense' }, // Muted teal
      { name: 'Autres Dépenses', icon: 'more_horiz', color: '#919A7F', order: 9, type: 'expense' }, // Sage green
      { name: 'Salaire', icon: 'work', color: '#568E8D', order: 1, type: 'income' }, // Muted teal
      { name: 'Investissements', icon: 'trending_up', color: '#919A7F', order: 2, type: 'income' }, // Sage green
      { name: 'Cadeaux', icon: 'card_giftcard', color: '#568E8D', order: 3, type: 'income' }, // Muted teal
      { name: 'Autres Revenus', icon: 'more_horiz', color: '#919A7F', order: 4, type: 'income' } // Sage green
    ];
    
    console.log(`🔍 CREATING ${defaultCategories.length} DEFAULT CATEGORIES at path:`, categoriesPath);
    
    // Use a batch for better performance
    const batch = writeBatch(db);
    
    // Create all default categories in a batch
    defaultCategories.forEach(category => {
      const categoryDocRef = doc(collection(db, categoriesPath));
      
      // Add necessary fields to each category
      batch.set(categoryDocRef, {
        ...category,
        userId: userId, // Include userId for security rules
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    logger.info('CategoryService', 'initializeDefaultCategories', 'Default categories created successfully', {
      userId,
      count: defaultCategories.length
    });
    
    console.log(`✅ CREATED ${defaultCategories.length} DEFAULT CATEGORIES for user`);
    return true;
  } catch (error) {
    logger.error('CategoryService', 'initializeDefaultCategories', 'Failed to initialize default categories', {
      userId,
      error: error.message
    });
    console.error('❌ ERROR INITIALIZING DEFAULT CATEGORIES:', error.message);
    return false;
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

/**
 * Migrate categories to ensure all have an order field
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Migration results with counts
 */
export const migrateCategories = async (userId) => {
  try {
    logger.info('CategoryService', 'migrateCategories', 'Starting categories migration', { userId });
    
    // Get all categories for the user from their subcollection
    const categoriesPath = `users/${userId}/categories`;
    const categoriesCollection = collection(db, categoriesPath);
    const querySnapshot = await getDocs(categoriesCollection);
    
    if (querySnapshot.empty) {
      logger.info('CategoryService', 'migrateCategories', 'No categories found to migrate', { userId });
      return { total: 0, updated: 0, success: true };
    }
    
    // Find categories without an order field
    const categoriesToUpdate = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.order === undefined || data.order === null) {
        categoriesToUpdate.push({
          id: doc.id,
          name: data.name || 'Unknown'
        });
      }
    });
    
    logger.info('CategoryService', 'migrateCategories', 'Categories needing migration', { 
      total: querySnapshot.size,
      toUpdate: categoriesToUpdate.length,
      categories: categoriesToUpdate.map(c => c.name).join(', ')
    });
    
    if (categoriesToUpdate.length === 0) {
      return { 
        total: querySnapshot.size, 
        updated: 0, 
        success: true, 
        message: 'All categories already have order fields' 
      };
    }
    
    // Use batch update for efficiency
    const batch = writeBatch(db);
    const now = Date.now();
    
    // Add each category to the batch with an order value
    categoriesToUpdate.forEach((category, index) => {
      const categoryRef = doc(db, `users/${userId}/categories`, category.id);
      // Use base timestamp + index to ensure unique ordering
      batch.update(categoryRef, { 
        order: now + index,
        updatedAt: serverTimestamp()
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    logger.info('CategoryService', 'migrateCategories', 'Migration completed successfully', {
      updated: categoriesToUpdate.length
    });
    
    return {
      total: querySnapshot.size,
      updated: categoriesToUpdate.length,
      success: true,
      message: `Successfully updated ${categoriesToUpdate.length} categories`
    };
  } catch (error) {
    logger.error('CategoryService', 'migrateCategories', 'Failed to migrate categories', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to migrate categories'
    };
  }
}; 