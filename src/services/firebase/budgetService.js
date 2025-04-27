import { 
  collection,
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  deleteField
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
 * @param {string} currentUserId - ID of the user performing the action (should be owner)
 * @param {string} userIdToAdd - User ID to add as a member
 * @param {Object} userDetails - User details for the new member
 * @param {string} userDetails.displayName - User display name
 * @param {string} userDetails.email - User email
 * @param {string} role - Member role ('editor' or 'viewer')
 * @returns {Promise<boolean>} - True if successful
 */
export const addMember = async (budgetId, currentUserId, userIdToAdd, userDetails, role) => {
  try {
    // TODO: M4a - Add server-side check/rule to ensure currentUserId is the owner of budgetId
    
    logger.debug('BudgetService', 'addMember', 'Adding member to budget', { 
      budgetId, 
      currentUserId,
      userIdToAdd, 
      role 
    });
    
    // Validate role
    if (role !== 'editor' && role !== 'viewer') {
      throw new Error(`Invalid role: ${role}. Must be 'editor' or 'viewer'`);
    }
    
    // Validate user details
    if (!userDetails?.displayName || !userDetails?.email) {
      throw new Error('User details (displayName and email) are required');
    }
    
    // Fetch the budget to verify owner and check if user is already a member
    const budgetRef = doc(db, 'budgets', budgetId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (!budgetSnap.exists()) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    const budgetData = budgetSnap.data();
    
    // Verify current user is the owner
    if (budgetData.ownerId !== currentUserId) {
      logger.warn('BudgetService', 'addMember', 'Non-owner attempting to add member', {
        budgetId,
        currentUserId,
        ownerId: budgetData.ownerId
      });
      throw new Error('Only the budget owner can add members');
    }
    
    // Check if user is already a member
    if (budgetData.members[userIdToAdd]) {
      logger.warn('BudgetService', 'addMember', 'User is already a member', {
        budgetId,
        userIdToAdd
      });
      throw new Error(`User ${userIdToAdd} is already a member of this budget`);
    }
    
    // Initialize batch write
    const batch = writeBatch(db);
    
    // Prepare budget members update
    const newMemberInfo = {
      role,
      displayName: userDetails.displayName,
      email: userDetails.email,
      joinedAt: serverTimestamp()
    };
    
    // Update budget document - use dot notation for nested map update
    const budgetUpdate = {
      [`members.${userIdToAdd}`]: newMemberInfo,
      updatedAt: serverTimestamp()
    };
    
    batch.update(budgetRef, budgetUpdate);
    
    // Create membership document for the user
    const membershipRef = doc(db, 'users', userIdToAdd, 'budgetMemberships', budgetId);
    const membershipData = {
      budgetId,
      budgetName: budgetData.name,
      role,
      ownerId: budgetData.ownerId,
      currency: budgetData.currency,
      joinedAt: serverTimestamp()
    };
    
    batch.set(membershipRef, membershipData);
    
    // Commit the batch
    await batch.commit();
    
    logger.info('BudgetService', 'addMember', 'Member added successfully', {
      budgetId,
      userIdToAdd,
      role
    });
    
    return true;
  } catch (error) {
    logger.error('BudgetService', 'addMember', 'Failed to add member', {
      error: error.message,
      stack: error.stack,
      budgetId,
      userIdToAdd
    });
    throw error;
  }
};

/**
 * Remove a member from a budget
 * @param {string} budgetId - Budget ID
 * @param {string} currentUserId - ID of the user performing the action (should be owner)
 * @param {string} userIdToRemove - User ID to remove from the budget
 * @returns {Promise<boolean>} - True if successful
 */
export const removeMember = async (budgetId, currentUserId, userIdToRemove) => {
  try {
    // TODO: M4a - Add server-side check/rule to ensure currentUserId is the owner of budgetId
    
    logger.debug('BudgetService', 'removeMember', 'Removing member from budget', { 
      budgetId, 
      currentUserId,
      userIdToRemove
    });
    
    // Fetch the budget to verify owner and check member exists
    const budgetRef = doc(db, 'budgets', budgetId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (!budgetSnap.exists()) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    const budgetData = budgetSnap.data();
    
    // Verify current user is the owner
    if (budgetData.ownerId !== currentUserId) {
      logger.warn('BudgetService', 'removeMember', 'Non-owner attempting to remove member', {
        budgetId,
        currentUserId,
        ownerId: budgetData.ownerId
      });
      throw new Error('Only the budget owner can remove members');
    }
    
    // Check if user is trying to remove the owner (not allowed)
    if (userIdToRemove === budgetData.ownerId) {
      logger.warn('BudgetService', 'removeMember', 'Attempting to remove owner', {
        budgetId,
        userIdToRemove
      });
      throw new Error('Cannot remove the budget owner');
    }
    
    // Check if user is a member
    if (!budgetData.members[userIdToRemove]) {
      logger.warn('BudgetService', 'removeMember', 'User is not a member', {
        budgetId,
        userIdToRemove
      });
      throw new Error(`User ${userIdToRemove} is not a member of this budget`);
    }
    
    // Initialize batch write
    const batch = writeBatch(db);
    
    // Update budget document - remove user from members map
    const budgetUpdate = {
      [`members.${userIdToRemove}`]: deleteField(),
      updatedAt: serverTimestamp()
    };
    
    batch.update(budgetRef, budgetUpdate);
    
    // Delete membership document for the user
    const membershipRef = doc(db, 'users', userIdToRemove, 'budgetMemberships', budgetId);
    batch.delete(membershipRef);
    
    // Commit the batch
    await batch.commit();
    
    logger.info('BudgetService', 'removeMember', 'Member removed successfully', {
      budgetId,
      userIdToRemove
    });
    
    return true;
  } catch (error) {
    logger.error('BudgetService', 'removeMember', 'Failed to remove member', {
      error: error.message,
      stack: error.stack,
      budgetId,
      userIdToRemove
    });
    throw error;
  }
};

/**
 * Update a member's role in a budget
 * @param {string} budgetId - Budget ID
 * @param {string} currentUserId - ID of the user performing the action (should be owner)
 * @param {string} userIdToUpdate - User ID whose role will be updated
 * @param {string} newRole - New role ('editor' or 'viewer')
 * @returns {Promise<boolean>} - True if successful
 */
export const updateMemberRole = async (budgetId, currentUserId, userIdToUpdate, newRole) => {
  try {
    // TODO: M4a - Add server-side check/rule to ensure currentUserId is the owner of budgetId
    
    logger.debug('BudgetService', 'updateMemberRole', 'Updating member role', { 
      budgetId, 
      currentUserId,
      userIdToUpdate,
      newRole
    });
    
    // Validate role
    if (newRole !== 'editor' && newRole !== 'viewer') {
      throw new Error(`Invalid role: ${newRole}. Must be 'editor' or 'viewer'`);
    }
    
    // Fetch the budget to verify owner and check member exists
    const budgetRef = doc(db, 'budgets', budgetId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (!budgetSnap.exists()) {
      throw new Error(`Budget ${budgetId} not found`);
    }
    
    const budgetData = budgetSnap.data();
    
    // Verify current user is the owner
    if (budgetData.ownerId !== currentUserId) {
      logger.warn('BudgetService', 'updateMemberRole', 'Non-owner attempting to update member role', {
        budgetId,
        currentUserId,
        ownerId: budgetData.ownerId
      });
      throw new Error('Only the budget owner can update member roles');
    }
    
    // Check if user is trying to update the owner's role (not allowed)
    if (userIdToUpdate === budgetData.ownerId) {
      logger.warn('BudgetService', 'updateMemberRole', 'Attempting to change owner role', {
        budgetId,
        userIdToUpdate
      });
      throw new Error("Cannot change the owner's role");
    }
    
    // Check if user is a member
    if (!budgetData.members[userIdToUpdate]) {
      logger.warn('BudgetService', 'updateMemberRole', 'User is not a member', {
        budgetId,
        userIdToUpdate
      });
      throw new Error(`User ${userIdToUpdate} is not a member of this budget`);
    }
    
    // Check if the role is already set to the requested value
    if (budgetData.members[userIdToUpdate].role === newRole) {
      logger.info('BudgetService', 'updateMemberRole', 'Role is already set to the requested value', {
        budgetId,
        userIdToUpdate,
        role: newRole
      });
      return true; // No update needed
    }
    
    // Initialize batch write
    const batch = writeBatch(db);
    
    // Update budget document - update role in members map
    const budgetUpdate = {
      [`members.${userIdToUpdate}.role`]: newRole,
      updatedAt: serverTimestamp()
    };
    
    batch.update(budgetRef, budgetUpdate);
    
    // Update membership document for the user
    const membershipRef = doc(db, 'users', userIdToUpdate, 'budgetMemberships', budgetId);
    batch.update(membershipRef, { role: newRole });
    
    // Commit the batch
    await batch.commit();
    
    logger.info('BudgetService', 'updateMemberRole', 'Member role updated successfully', {
      budgetId,
      userIdToUpdate,
      newRole
    });
    
    return true;
  } catch (error) {
    logger.error('BudgetService', 'updateMemberRole', 'Failed to update member role', {
      error: error.message,
      stack: error.stack,
      budgetId,
      userIdToUpdate,
      newRole
    });
    throw error;
  }
};

/**
 * Get all members of a budget
 * @param {string} budgetId - Budget ID
 * @returns {Promise<Object>} - Members map from budget document with user IDs as keys
 */
export const getBudgetMembers = async (budgetId) => {
  try {
    logger.debug('BudgetService', 'getBudgetMembers', 'Fetching budget members', { budgetId });
    
    const budgetRef = doc(db, 'budgets', budgetId);
    const budgetSnap = await getDoc(budgetRef);
    
    if (!budgetSnap.exists()) {
      logger.warn('BudgetService', 'getBudgetMembers', 'Budget not found', { budgetId });
      return null;
    }
    
    const budgetData = budgetSnap.data();
    
    // Return the members map (already has user IDs as keys)
    logger.info('BudgetService', 'getBudgetMembers', 'Budget members retrieved', { 
      budgetId,
      memberCount: Object.keys(budgetData.members || {}).length
    });
    
    return budgetData.members || {};
  } catch (error) {
    logger.error('BudgetService', 'getBudgetMembers', 'Failed to get budget members', {
      error: error.message,
      stack: error.stack,
      budgetId
    });
    throw error;
  }
}; 