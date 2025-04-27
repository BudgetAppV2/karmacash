import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';
import { initializeDefaultCategories } from './categories';

/**
 * Create a new budget with the current user as the owner
 * @param {Object} ownerUser - User object for the budget owner
 * @param {string} ownerUser.uid - User ID of the owner
 * @param {string} ownerUser.displayName - Display name of the owner
 * @param {string} ownerUser.email - Email of the owner
 * @param {Object} budgetData - Budget data
 * @param {string} budgetData.name - Budget name
 * @param {string} [budgetData.currency='CAD'] - Budget currency
 * @returns {Promise<string>} - The created budget ID
 */
export const createBudget = async (ownerUser, budgetData) => {
  try {
    // Input validation
    if (!ownerUser?.uid) {
      throw new Error('Owner user ID is required');
    }
    
    if (!budgetData?.name || budgetData.name.trim() === '') {
      throw new Error('Budget name is required');
    }
    
    // Ensure currency is valid or use default
    const currency = budgetData.currency || 'CAD';
    // TODO: Add validation for currency format (standard 3-letter code)
    
    logger.debug('BudgetService', 'createBudget', 'Creating new budget', {
      ownerId: ownerUser.uid,
      budgetName: budgetData.name,
      currency
    });
    
    // Initialize batch write for atomicity
    const batch = writeBatch(db);
    
    // Generate budget ID by creating a doc reference first
    const newBudgetRef = doc(collection(db, 'budgets'));
    const budgetId = newBudgetRef.id;
    
    // Prepare budget document data according to B5.2 schema
    const budgetDocData = {
      name: budgetData.name,
      ownerId: ownerUser.uid,
      members: {
        [ownerUser.uid]: {
          role: 'owner',
          displayName: ownerUser.displayName || 'Unknown',
          email: ownerUser.email || 'unknown@example.com',
          joinedAt: serverTimestamp()
        }
      },
      currency,
      settings: {
        isArchived: false
      },
      version: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add budget doc to batch
    batch.set(newBudgetRef, budgetDocData);
    
    // Prepare membership document data according to B5.2 schema
    const membershipDocData = {
      budgetId,
      budgetName: budgetData.name,
      role: 'owner',
      ownerId: ownerUser.uid,
      currency,
      joinedAt: serverTimestamp()
    };
    
    // Add membership doc to batch
    const membershipRef = doc(db, 'users', ownerUser.uid, 'budgetMemberships', budgetId);
    batch.set(membershipRef, membershipDocData);
    
    // Commit the batch
    await batch.commit();
    
    logger.info('BudgetService', 'createBudget', 'Budget created successfully', {
      budgetId,
      ownerId: ownerUser.uid,
      budgetName: budgetData.name
    });
    
    // Initialize default categories
    try {
      await initializeDefaultCategories(budgetId, ownerUser.uid);
      logger.info('BudgetService', 'createBudget', 'Default categories initialized', { budgetId });
    } catch (categoryError) {
      // Log the error but don't fail the entire operation
      logger.error('BudgetService', 'createBudget', 'Failed to initialize default categories', {
        budgetId,
        error: categoryError.message,
        stack: categoryError.stack
      });
      // We continue and return the budgetId even if category init fails
      // The categories can be created later if needed
    }
    
    return budgetId;
  } catch (error) {
    logger.error('BudgetService', 'createBudget', 'Failed to create budget', {
      error: error.message,
      stack: error.stack,
      ownerUserId: ownerUser?.uid,
      budgetName: budgetData?.name
    });
    throw error;
  }
};

/**
 * Add a member to a budget
 * @param {string} budgetId - Budget ID
 * @param {string} userIdToAdd - User ID to add
 * @param {string} role - Member role ('editor' or 'viewer')
 * @param {Object} userDetails - User details
 * @param {string} userDetails.displayName - User display name
 * @param {string} userDetails.email - User email
 * @returns {Promise<void>}
 */
export const addMember = async (budgetId, userIdToAdd, role, userDetails) => {
  console.warn('addMember not fully implemented yet');
  return Promise.resolve();
  
  // TODO: Implement full functionality:
  // 1. Validate role (must be 'editor' or 'viewer')
  // 2. Check if user exists
  // 3. Check if budget exists
  // 4. Check if user is already a member
  // 5. Create batch write:
  //    - Update budget.members map
  //    - Create membership document in user's collection
  // 6. Commit batch
};

/**
 * Remove a member from a budget
 * @param {string} budgetId - Budget ID
 * @param {string} userIdToRemove - User ID to remove
 * @returns {Promise<void>}
 */
export const removeMember = async (budgetId, userIdToRemove) => {
  console.warn('removeMember not fully implemented yet');
  return Promise.resolve();
  
  // TODO: Implement full functionality:
  // 1. Check if user is not the owner (owners can't be removed)
  // 2. Create batch write:
  //    - Remove user from budget.members map
  //    - Delete membership document from user's collection
  // 3. Commit batch
};

/**
 * Update a member's role in a budget
 * @param {string} budgetId - Budget ID
 * @param {string} userIdToUpdate - User ID to update
 * @param {string} newRole - New role ('editor' or 'viewer')
 * @returns {Promise<void>}
 */
export const updateMemberRole = async (budgetId, userIdToUpdate, newRole) => {
  console.warn('updateMemberRole not fully implemented yet');
  return Promise.resolve();
  
  // TODO: Implement full functionality:
  // 1. Validate role (must be 'editor' or 'viewer')
  // 2. Check if user is not the owner (owner role can't be changed)
  // 3. Create batch write:
  //    - Update role in budget.members map
  //    - Update role in user's membership document
  // 4. Commit batch
};

/**
 * Get all members of a budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise<Array>} - Array of members
 */
export const getBudgetMembers = async (budgetId) => {
  console.warn('getBudgetMembers not fully implemented yet');
  return Promise.resolve([]);
  
  // TODO: Implement full functionality:
  // 1. Get budget document
  // 2. Extract and transform members map to array
  // 3. Return array of members with ids
}; 