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
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';

/**
 * Get all categories for a budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise<Array>} - Array of categories
 */
export const getCategories = async (budgetId) => {
  try {
    console.log('🔍 getCategories: Starting fetch for budgetId:', budgetId);
    
    logger.debug('CategoryService', 'getCategories', 'Fetching categories', { 
      budgetId,
      timestamp: new Date().toISOString()
    });
    
    // Query all categories for the budget from the subcollection
    const path = `budgets/${budgetId}/categories`;
    console.log('🔍 ACCESSING CATEGORIES PATH:', path);
    const categoriesCollection = collection(db, path);
    const q = query(categoriesCollection, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    logger.debug('CategoryService', 'getCategories', 'Query result', {
      count: querySnapshot.size,
      empty: querySnapshot.empty
    });
    
    // If collection is empty, return empty array early
    if (querySnapshot.empty) {
      logger.info('CategoryService', 'getCategories', 'No categories found for budget', { budgetId });
      console.log('⚠️ NO CATEGORIES FOUND for budget:', budgetId);
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
        updateCategoryOrderField(budgetId, category.id, category.order)
          .catch(err => logger.error('CategoryService', 'getCategories', 'Failed to update missing order field', {
            budgetId,
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
    
    logger.info('CategoryService', 'getCategories', 'Categories retrieved successfully', { 
      budgetId,
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
      budgetId
    });
    
    console.log('❌ ERROR in getCategories:', error.message);
    return [];
  }
};

/**
 * Helper function to update the order field of a category
 * @param {string} budgetId - Budget ID
 * @param {string} categoryId - Category ID
 * @param {number} orderValue - Order value to set
 * @returns {Promise<void>}
 */
const updateCategoryOrderField = async (budgetId, categoryId, orderValue) => {
  try {
    const categoryRef = doc(db, `budgets/${budgetId}/categories`, categoryId);
    await updateDoc(categoryRef, { 
      order: orderValue,
      updatedAt: serverTimestamp()
    });
    
    logger.info('CategoryService', 'updateCategoryOrderField', 'Order field updated successfully', {
      budgetId,
      categoryId,
      orderValue
    });
  } catch (error) {
    logger.error('CategoryService', 'updateCategoryOrderField', 'Failed to update order field', {
      error: error.message,
      budgetId,
      categoryId
    });
    throw error;
  }
};

/**
 * Get a category by ID
 * @param {string} budgetId - Budget ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} - Category data
 */
export const getCategory = async (budgetId, categoryId) => {
  try {
    logger.debug('CategoryService', 'getCategory', 'Fetching category', { budgetId, categoryId });
    
    const docRef = doc(db, `budgets/${budgetId}/categories`, categoryId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.warn('CategoryService', 'getCategory', 'Category not found', { 
        budgetId, 
        categoryId 
      });
      return null;
    }
    
    logger.info('CategoryService', 'getCategory', 'Category retrieved successfully', { 
      budgetId, 
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
      budgetId,
      categoryId
    });
    throw error;
  }
};

/**
 * Create a new category
 * @param {string} budgetId - Budget ID
 * @param {string} userId - User ID of the creator
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} - Created category with ID
 */
export const createCategory = async (budgetId, userId, categoryData) => {
  try {
    logger.debug('CategoryService', 'createCategory', 'Creating new category', { 
      budgetId,
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
    const path = `budgets/${budgetId}/categories`;
    console.log('🔍 CREATING CATEGORY AT PATH:', path);
    const categoryRef = doc(collection(db, path));
    
    // Create category document with all required fields
    const fullCategoryData = {
      budgetId, // Denormalized for queries
      createdByUserId: userId,
      lastEditedByUserId: null, // Initially null since it's a new category
      isDefault: false, // Required by security rules, user-created categories are not default
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Ensure all required fields are present
    const requiredFields = ['name', 'type', 'color', 'order', 'isDefault'];
    const missingFields = requiredFields.filter(field => 
      fullCategoryData[field] === undefined || fullCategoryData[field] === null
    );
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required category fields: ${missingFields.join(', ')}`;
      console.error('❌ CATEGORY CREATION ERROR:', errorMsg);
      logger.error('CategoryService', 'createCategory', errorMsg, {
        budgetId,
        userId,
        missingFields
      });
      throw new Error(errorMsg);
    }
    
    logger.debug('CategoryService', 'createCategory', 'Full category data', { 
      data: JSON.stringify(fullCategoryData)
    });
    
    await setDoc(categoryRef, fullCategoryData);
    
    logger.info('CategoryService', 'createCategory', 'Category created successfully', { 
      budgetId,
      userId,
      categoryId: categoryRef.id,
      categoryName: categoryData.name
    });
    
    console.log('✅ CATEGORY CREATED:', categoryRef.id, 'at path:', path);
    
    // Return full category object with ID for immediate UI update
    return {
      id: categoryRef.id,
      ...categoryData,
      budgetId,
      createdByUserId: userId,
      lastEditedByUserId: null,
      isDefault: fullCategoryData.isDefault, // Include isDefault in the return value
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('❌ CATEGORY CREATION FAILED:', error.message, error.code || '', {
      budgetId,
      userId,
      categoryData: JSON.stringify(categoryData)
    });
    
    logger.error('CategoryService', 'createCategory', 'Failed to create category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      userId,
      categoryData: JSON.stringify(categoryData)
    });
    throw error;
  }
};

/**
 * Update a category
 * @param {string} budgetId - Budget ID
 * @param {string} categoryId - Category ID
 * @param {string} userId - User ID of the editor
 * @param {Object} categoryData - Category data to update
 * @returns {Promise<Object>} - Updated category
 */
export const updateCategory = async (budgetId, categoryId, userId, categoryData) => {
  try {
    logger.debug('CategoryService', 'updateCategory', 'Updating category', { 
      budgetId,
      userId,
      categoryId,
      categoryData 
    });
    
    const categoryRef = doc(db, `budgets/${budgetId}/categories`, categoryId);
    const docSnap = await getDoc(categoryRef);
    
    // Check if category exists
    if (!docSnap.exists()) {
      const error = new Error(`Category ${categoryId} not found`);
      logger.error('CategoryService', 'updateCategory', 'Category not found', { 
        budgetId,
        categoryId 
      });
      throw error;
    }
    
    // TODO: M4a - Implement full validation to ensure createdByUserId and createdAt are not modified
    
    // Prepare update data with user attribution
    const updateData = {
      ...categoryData,
      lastEditedByUserId: userId,
      updatedAt: serverTimestamp()
    };
    
    // Update in the budget's subcollection
    await updateDoc(categoryRef, updateData);
    
    logger.info('CategoryService', 'updateCategory', 'Category updated successfully', { 
      budgetId,
      userId,
      categoryId 
    });
    
    return {
      id: categoryId,
      ...docSnap.data(),
      ...categoryData,
      lastEditedByUserId: userId
    };
  } catch (error) {
    logger.error('CategoryService', 'updateCategory', 'Failed to update category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      userId,
      categoryId
    });
    throw error;
  }
};

/**
 * Delete a category
 * @param {string} budgetId - Budget ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<void>}
 */
export const deleteCategory = async (budgetId, categoryId) => {
  try {
    logger.debug('CategoryService', 'deleteCategory', 'Deleting category', { 
      budgetId,
      categoryId 
    });
    
    // Check if category exists
    const categoryRef = doc(db, `budgets/${budgetId}/categories`, categoryId);
    const docSnap = await getDoc(categoryRef);
    
    if (!docSnap.exists()) {
      logger.warn('CategoryService', 'deleteCategory', 'Category not found', { 
        budgetId,
        categoryId 
      });
      return; // Nothing to delete
    }
    
    // TODO: M4a - Add prevention for deleting default categories (isDefault: true)
    // Uncomment this code when ready to implement this check
    /*
    const categoryData = docSnap.data();
    if (categoryData.isDefault === true) {
      logger.warn('CategoryService', 'deleteCategory', 'Cannot delete default category', { 
        budgetId,
        categoryId 
      });
      throw new Error('Default categories cannot be deleted');
    }
    */
    
    // Delete the category
    await deleteDoc(categoryRef);
    logger.info('CategoryService', 'deleteCategory', 'Category deleted successfully', { 
      budgetId,
      categoryId 
    });
    
  } catch (error) {
    logger.error('CategoryService', 'deleteCategory', 'Failed to delete category', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId,
      categoryId
    });
    throw error;
  }
};

/**
 * Initialize default categories for a new budget
 * @param {string} budgetId - Budget ID
 * @param {string} userId - User ID of the creator
 * @returns {Promise<boolean>} - Success indicator
 */
export const initializeDefaultCategories = async (budgetId, userId) => {
  try {
    logger.debug('CategoryService', 'initializeDefaultCategories', 'Initializing default categories', { 
      budgetId,
      userId
    });
    
    // Check if budget already has categories
    const categoriesPath = `budgets/${budgetId}/categories`;
    console.log('🔍 CHECKING FOR EXISTING CATEGORIES at path:', categoriesPath);
    const categoriesCollection = collection(db, categoriesPath);
    const existingSnapshot = await getDocs(categoriesCollection);
    
    if (!existingSnapshot.empty) {
      logger.info('CategoryService', 'initializeDefaultCategories', 'Budget already has categories', {
        budgetId,
        count: existingSnapshot.size
      });
      console.log(`✅ Budget already has ${existingSnapshot.size} categories`);
      return true;
    }
    
    const defaultCategories = [
      // Expenses
      { name: 'Alimentation', icon: 'restaurant', color: '#7FB069', order: 1, type: 'expense', isDefault: true }, // Palette v5 - Brighter Leaf Green
      { name: 'Transport', icon: 'directions_car', color: '#709AC7', order: 2, type: 'expense', isDefault: true }, // Palette v5 - Stronger Slate Blue
      { name: 'Logement', icon: 'home', color: '#9A705A', order: 3, type: 'expense', isDefault: true },          // Palette v5 - Mid-Tone Brown
      { name: 'Divertissement', icon: 'movie', color: '#E0B470', order: 4, type: 'expense', isDefault: true },    // Palette v5 - Clear Gold/Ochre (Used for Resto/Loisirs)
      { name: 'Shopping', icon: 'shopping_cart', color: '#E8B4BC', order: 5, type: 'expense', isDefault: true }, // Palette v5 - Soft Pink
      { name: 'Services', icon: 'home_repair_service', color: '#3A5A78', order: 6, type: 'expense', isDefault: true }, // Palette v5 - Deep Navy/Indigo
      { name: 'Santé', icon: 'favorite', color: '#4FB0A5', order: 7, type: 'expense', isDefault: true },          // Palette v5 - Clear Aqua-Green
      { name: 'Éducation', icon: 'school', color: '#A08CBF', order: 8, type: 'expense', isDefault: true },        // Palette v5 - Clearer Lavender/Violet
      { name: 'Autres Dépenses', icon: 'more_horiz', color: '#C8AD9B', order: 9, type: 'expense', isDefault: true }, // Palette v5 - Neutral Tan/Beige
      // Income
      { name: 'Salaire', icon: 'work', color: '#7EB5D6', order: 1, type: 'income', isDefault: true },             // Palette v5 - Clear Sky Blue
      { name: 'Investissements', icon: 'trending_up', color: '#4A7856', order: 2, type: 'income', isDefault: true }, // Palette v5 - Darker Muted Green
      { name: 'Cadeaux', icon: 'card_giftcard', color: '#F4A97F', order: 3, type: 'income', isDefault: true },   // Palette v5 - Clear Peach/Orange
      { name: 'Autres Revenus', icon: 'more_horiz', color: '#C8AD9B', order: 4, type: 'income', isDefault: true }  // Palette v5 - Neutral Tan/Beige
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
        budgetId, // Include budgetId for denormalization
        createdByUserId: userId,
        lastEditedByUserId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    logger.info('CategoryService', 'initializeDefaultCategories', 'Default categories created successfully', {
      budgetId,
      userId,
      count: defaultCategories.length
    });
    
    console.log(`✅ CREATED ${defaultCategories.length} DEFAULT CATEGORIES for budget`);
    return true;
  } catch (error) {
    logger.error('CategoryService', 'initializeDefaultCategories', 'Failed to initialize default categories', {
      budgetId,
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
 * Migrate categories to ensure all have an order field - LEGACY FUNCTION
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Migration results with counts
 * @deprecated This was used for the old user-centric model migration
 */
export const migrateCategories = async (userId) => {
  // TODO: M4a - Replace with new budget-centric version if needed
  logger.warn('CategoryService', 'migrateCategories', 'Using deprecated user-centric function', { userId });
  
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

/**
 * Sets up a listener for categories within a specific budget.
 * @param {string} budgetId - The ID of the budget.
 * @param {function} callback - The function to call with the updated categories array.
 * @returns {function} - The unsubscribe function for the listener.
 */
export const getCategoriesListener = (budgetId, callback) => {
  try {
    logger.debug('CategoryService', 'getCategoriesListener', 'Setting up listener', { budgetId });
    const categoriesCollection = collection(db, `budgets/${budgetId}/categories`);
    // Order categories by the 'order' field
    const q = query(categoriesCollection, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categories = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const category = {
          id: doc.id,
          ...data,
        };
        // Ensure createdAt and updatedAt are Date objects if they exist
        if (category.createdAt && typeof category.createdAt.toDate === 'function') {
          category.createdAt = category.createdAt.toDate();
        }
        if (category.updatedAt && typeof category.updatedAt.toDate === 'function') {
          category.updatedAt = category.updatedAt.toDate();
        }
        // Handle missing order field defensively, although ideally updated by getCategories
        if (category.order === undefined || category.order === null) {
          logger.warn('CategoryService', 'getCategoriesListener', 'Category without order field detected in listener', {
            budgetId,
            categoryId: category.id,
            categoryName: category.name
          });
          // Assign a temporary high order value for sorting consistency in this snapshot
          category.order = Infinity; 
        }
        return category;
      });

      logger.debug('CategoryService', 'getCategoriesListener', 'Snapshot received', { budgetId, count: categories.length });
      callback(categories); // Pass the updated categories array to the callback
    }, (error) => {
      logger.error('CategoryService', 'getCategoriesListener', 'Listener error', {
        error: error.message,
        errorCode: error.code,
        stack: error.stack,
        budgetId
      });
      console.error("❌ ERROR in getCategoriesListener:", error);
      // Optionally, call the callback with an empty array or signal an error
      callback([]); // Or handle error state appropriately in the hook
    });

    return unsubscribe; // Return the unsubscribe function
  } catch (error) {
    logger.error('CategoryService', 'getCategoriesListener', 'Failed to set up listener', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      budgetId
    });
    console.error("❌ ERROR setting up getCategoriesListener:", error);
    // Return a no-op unsubscribe function in case of setup error
    return () => {};
  }
}; 