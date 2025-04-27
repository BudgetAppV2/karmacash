import { 
  collection,
  query, 
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from './firebaseInit';
import logger from '../logger';

/**
 * Get all budgets a user belongs to by querying their budgetMemberships collection
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of budget membership objects
 */
export const getUserBudgets = async (userId) => {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
    
    logger.debug('UserService', 'getUserBudgets', 'Fetching user budgets', { userId });
    
    // Construct collection reference to user's budget memberships
    const membershipsRef = collection(db, 'users', userId, 'budgetMemberships');
    
    // Create query ordered by budget name (could also order by joinedAt for most recent first)
    const q = query(membershipsRef, orderBy('budgetName', 'asc'));
    
    // Execute the query
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      logger.info('UserService', 'getUserBudgets', 'No budgets found for user', { userId });
      return [];
    }
    
    // Map the query results to an array of budget membership objects
    const budgets = querySnapshot.docs.map(doc => ({
      id: doc.id, // This is the budgetId
      ...doc.data()
    }));
    
    logger.info('UserService', 'getUserBudgets', 'User budgets retrieved successfully', {
      userId,
      count: budgets.length,
      budgetIds: budgets.map(b => b.id).join(', ')
    });
    
    return budgets;
  } catch (error) {
    logger.error('UserService', 'getUserBudgets', 'Failed to get user budgets', {
      error: error.message,
      stack: error.stack,
      userId
    });
    
    // Return empty array on error rather than throwing
    // This allows the UI to handle the case of no budgets gracefully
    return [];
  }
}; 