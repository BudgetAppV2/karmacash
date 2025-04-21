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
    console.log('🔍 getCategories: Starting fetch for userId:', userId);
    
    logger.debug('CategoryService', 'getCategories', 'Fetching categories', { 
      userId,
      timestamp: new Date().toISOString()
    });
    
    // First, check how many categories exist for this user (without ordering)
    const countQuery = query(
      collection(db, 'categories'),
      where('userId', '==', userId)
    );
    
    const countSnapshot = await getDocs(countQuery);
    
    // Log details of what we found
    console.log(`🔢 Found ${countSnapshot.size} categories for user ${userId}`);
    
    // Get a preview of the categories
    const previewCategories = countSnapshot.docs.map(doc => ({
      id: doc.id, 
      name: doc.data().name,
      type: doc.data().type,
      order: doc.data().order
    }));
    console.log('👀 Preview of categories found:', previewCategories);
    
    logger.debug('CategoryService', 'getCategories', 'Initial count query result', {
      count: countSnapshot.size,
      empty: countSnapshot.empty
    });
    
    // If collection is empty, return empty array early
    if (countSnapshot.empty) {
      logger.info('CategoryService', 'getCategories', 'No categories found for user', { userId });
      return [];
    }
    
    // Now try the query with ordering
    try {
      // Create a query to fetch categories by userId, ordered by the order field
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', userId),
        orderBy('order', 'asc')
      );
      
      logger.debug('CategoryService', 'getCategories', 'Executing Firestore query with ordering');
      const querySnapshot = await getDocs(q);
      
      // Compare results
      console.log(`🔄 Query with ordering returned ${querySnapshot.size} categories compared to ${countSnapshot.size} from count query`);
      
      if (querySnapshot.size < countSnapshot.size) {
        console.warn(`⚠️ Some categories were filtered out by the ordering query. This might be because some don't have an order field.`);
        
        // Check which categories are missing
        const orderedIds = new Set(querySnapshot.docs.map(doc => doc.id));
        const allCategoryIds = new Set(countSnapshot.docs.map(doc => doc.id));
        
        const missingIds = [...allCategoryIds].filter(id => !orderedIds.has(id));
        console.log(`❌ Missing categories by ID:`, missingIds);
        
        // Get details of missing categories
        const missingCategories = countSnapshot.docs
          .filter(doc => missingIds.includes(doc.id))
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`❓ Details of missing categories:`, missingCategories);
      }
      
      // Map documents to JavaScript objects
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if we need to add any missing categories
      if (querySnapshot.size < countSnapshot.size) {
        // Get the IDs of categories we already have
        const existingIds = new Set(categories.map(cat => cat.id));
        
        // Find categories from the count query that are missing
        const missingCategories = countSnapshot.docs
          .filter(doc => !existingIds.has(doc.id))
          .map(doc => {
            const data = doc.data();
            // Add default order if missing (using a very high number to put at end)
            if (!data.order) {
              data.order = 9999999;
            }
            return {
              id: doc.id,
              ...data
            };
          });
        
        console.log(`➕ Adding ${missingCategories.length} categories that were missing order fields`);
        
        // Add missing categories to our result
        categories.push(...missingCategories);
        
        // Sort all categories by order
        categories.sort((a, b) => {
          const orderA = a.order || 9999999;
          const orderB = b.order || 9999999;
          return orderA - orderB;
        });
      }
      
      // Convert Firebase timestamps to regular dates
      categories.forEach(category => {
        if (category.createdAt && typeof category.createdAt.toDate === 'function') {
          category.createdAt = category.createdAt.toDate();
        }
        if (category.updatedAt && typeof category.updatedAt.toDate === 'function') {
          category.updatedAt = category.updatedAt.toDate();
        }
      });
      
      logger.info('CategoryService', 'getCategories', 'Categories retrieved successfully with ordering', { 
        userId,
        count: categories.length,
        categoryNames: categories.map(c => c.name).join(', ')
      });
      
      return categories;
    } catch (orderError) {
      // If ordering fails, fall back to unordered query
      logger.warn('CategoryService', 'getCategories', 'Failed to fetch with ordering, using fallback', {
        error: orderError.message
      });
      
      // Map the results from our count query since we already have them
      const fallbackCategories = countSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Convert timestamps
      fallbackCategories.forEach(category => {
        if (category.createdAt && typeof category.createdAt.toDate === 'function') {
          category.createdAt = category.createdAt.toDate();
        }
        if (category.updatedAt && typeof category.updatedAt.toDate === 'function') {
          category.updatedAt = category.updatedAt.toDate();
        }
      });
      
      logger.info('CategoryService', 'getCategories', 'Categories retrieved using fallback', {
        count: fallbackCategories.length,
        categoryNames: fallbackCategories.map(c => c.name).join(', ')
      });
      
      return fallbackCategories;
    }
  } catch (error) {
    logger.error('CategoryService', 'getCategories', 'Failed to get categories', {
      error: error.message,
      errorCode: error.code,
      stack: error.stack,
      userId
    });
    
    // Try one last simple approach
    try {
      logger.info('CategoryService', 'getCategories', 'Attempting direct collection fetch as last resort');
      
      const simpleSnapshot = await getDocs(collection(db, 'categories'));
      
      // Filter for this user's categories directly in code
      const userCategories = simpleSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(cat => cat.userId === userId);
      
      logger.info('CategoryService', 'getCategories', 'Last resort query successful', {
        totalCount: simpleSnapshot.size,
        userCount: userCategories.length
      });
      
      return userCategories;
    } catch (lastError) {
      logger.error('CategoryService', 'getCategories', 'All attempts failed', {
        error: lastError.message
      });
      
      // If all else fails, return an error object
      return {
        error: true,
        message: 'Failed to retrieve categories after multiple attempts. Please try again later.'
      };
    }
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
      categoryName: categoryData.name,
      categoryData: JSON.stringify(categoryData)
    });
    
    // Ensure order field exists
    if (!categoryData.order) {
      categoryData.order = Date.now();
    }
    
    // Create a new document reference with auto-generated ID
    const categoryRef = doc(collection(db, 'categories'));
    
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
    
    // Return full category object with ID for immediate UI update
    return categoryRef.id;
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