import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions, firebaseAuth, isEmulatorMode } from './firebaseInit';
import logger from '../logger';

/**
 * Admin services for KarmaCash
 * 
 * This module provides functions for admin-specific operations,
 * primarily for testing and diagnostics.
 */

/**
 * Test auth context propagation in Firebase callable functions
 * @param {Object} options - Test options
 * @param {boolean} [options.forceManualVerification=false] - Force manual token verification
 * @returns {Promise<Object>} Results of the auth test
 */
export const testAuthContext = async (options = {}) => {
  try {
    console.log('Starting testAuthContext with options:', options);
    const testAuthContextFn = httpsCallable(firebaseFunctions, 'testAuthContext');
    
    // Get current user
    const user = firebaseAuth.currentUser;
    if (!user) {
      console.error('No authenticated user found for token retrieval');
      logger.error('testAuthContext', 'No authenticated user found for token retrieval');
      throw new Error('Authentication required');
    }
    
    console.log('Current user:', user.email, '(', user.uid, ')');
    
    // Prepare parameters
    const params = {
      userId: user.uid,
      isEmulator: isEmulatorMode
    };
    
    // Always get token when using emulators or when forced
    if (isEmulatorMode || options.forceManualVerification) {
      try {
        // Force token refresh to ensure it's up-to-date
        params.token = await user.getIdToken(true);
        console.log('Got fresh token of length:', params.token.length);
        logger.info('testAuthContext', 'Retrieved fresh token for auth test', {
          tokenLength: params.token.length,
          tokenPreview: params.token.substring(0, 20) + '...',
          forceManual: !!options.forceManualVerification,
          isEmulator: isEmulatorMode
        });
        
        if (!params.token) {
          console.error('Failed to get token - returned empty value');
          logger.error('testAuthContext', 'Failed to get token - returned empty value');
        }
      } catch (tokenError) {
        console.error('Error getting auth token:', tokenError);
        logger.error('testAuthContext', 'Error getting auth token', {
          error: tokenError.message,
          code: tokenError.code,
          stack: tokenError.stack
        });
        throw new Error(`Token retrieval failed: ${tokenError.message}`);
      }
    }
    
    // Set explicit flag if this is forced manual verification
    params.forceManualVerification = !!options.forceManualVerification;
    
    console.log('Calling function with params:', { 
      hasToken: !!params.token,
      tokenLength: params.token ? params.token.length : 0,
      userId: params.userId,
      isEmulator: params.isEmulator,
      forceManualVerification: params.forceManualVerification
    });
    
    logger.info('testAuthContext', 'Calling Firebase function with params', {
      hasToken: !!params.token,
      tokenLength: params.token ? params.token.length : 0,
      forceManualVerification: params.forceManualVerification,
      isEmulator: isEmulatorMode
    });
    
    // Call the function
    const result = await testAuthContextFn(params);
    console.log('Auth context test result:', result.data);
    
    // Log detailed information about the result
    logger.info('testAuthContext', 'Function result', { 
      authSource: result.data.authSource,
      contextAuthPresent: result.data.contextAuthPresent,
      manualTokenProvided: result.data.manualTokenProvided,
      userId: result.data.userId,
      success: result.data.success,
      environment: result.data.environment,
      isEmulator: result.data.isEmulator
    });
    
    return result.data;
  } catch (error) {
    console.error('Error testing auth context:', error);
    logger.error('testAuthContext', 'Error during auth context test', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Triggers the admin seed function to generate test data
 * @param {Object} params - Seeding parameters
 * @param {string} [params.targetMonth] - Target month in YYYY-MM format
 * @param {number} [params.recurringInstancesPct=30] - Percentage of recurring instances (0-100)
 * @param {boolean} [params.seedDemoUser=false] - Whether to seed for demo user instead of current user
 * @param {boolean} [params.skipCategories=false] - Skip category creation
 * @param {boolean} [params.skipTransactions=false] - Skip transaction creation
 * @param {boolean} [params.skipRules=false] - Skip recurring rule creation
 * @param {boolean} [params.skipAllocations=false] - Skip monthly allocation creation
 * @param {string} [params.budgetId] - Optional specific budget ID to use
 * @returns {Promise<Object>} Results of the seeding operation
 */
export const triggerAdminSeedService = async (params = {}) => {
  try {
    // Log params with cleaned up budgetId value
    const logParams = { 
      ...params, 
      budgetId: params.budgetId || 'unspecified (will create new)'
    };
    logger.info('triggerAdminSeedService', 'Starting seed data generation with params', logParams);
    
    // Get reference to the callable function
    const triggerSeedFn = httpsCallable(firebaseFunctions, 'triggerAdminSeed');
    
    // Get current user
    const user = firebaseAuth.currentUser;
    if (!user) {
      const error = new Error('Authentication required');
      logger.error('triggerAdminSeedService', 'No authenticated user found', error);
      throw error;
    }
    
    // Get fresh ID token (especially important for emulator environments)
    const idToken = await user.getIdToken(true);
    
    logger.info('triggerAdminSeedService', 'Retrieved auth token for user', {
      uid: user.uid,
      email: user.email,
      tokenLength: idToken.length
    });
    
    // Prepare payload with auth token and other parameters
    const payload = {
      data: {
        authToken: idToken,
        targetMonth: params.targetMonth || null,
        recurringInstancesPct: params.recurringInstancesPct || 30,
        seedDemoUser: !!params.seedDemoUser,
        skipCategories: !!params.skipCategories,
        skipTransactions: !!params.skipTransactions,
        skipRules: !!params.skipRules,
        skipAllocations: !!params.skipAllocations,
        budgetId: params.budgetId || null
      }
    };
    
    logger.info('triggerAdminSeedService', 'Calling Firebase function', {
      hasAuthToken: !!payload.data.authToken,
      tokenLength: payload.data.authToken ? payload.data.authToken.length : 0,
      targetMonth: payload.data.targetMonth,
      recurringInstancesPct: payload.data.recurringInstancesPct,
      budgetId: payload.data.budgetId || 'new (unspecified)'
    });
    
    // Call the function
    const result = await triggerSeedFn(payload);
    
    logger.info('triggerAdminSeedService', 'Seed operation completed successfully', {
      success: result.data.success,
      details: result.data.details
    });
    
    return result.data;
  } catch (error) {
    logger.error('triggerAdminSeedService', 'Seed operation failed', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export default {
  testAuthContext,
  triggerAdminSeedService
}; 