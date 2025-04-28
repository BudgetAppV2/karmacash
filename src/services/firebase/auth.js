// src/services/firebase/auth.js

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail,
    sendEmailVerification, 
    updateProfile,
    updateEmail,
    updatePassword
  } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import logger from '../logger';
import { auth } from './firebaseInit';
import { db } from './firebaseInit';
  
/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} [displayName=''] - User display name (optional)
 * @returns {Promise<UserCredential>} - Firebase user credential
 */
export const registerUser = async (email, password, displayName = '') => {
  try {
    // Enhanced debugging
    console.log('AUTH EMULATOR DEBUG - registerUser called with:', { 
      email, 
      passwordLength: password.length, 
      displayName,
      authInstance: !!auth
    });
    
    logger.debug('AuthService', 'registerUser', 'Starting user registration', { email });
    
    // Add detailed context before calling the Firebase function
    console.log('AUTH EMULATOR DEBUG - About to call createUserWithEmailAndPassword with:',
      { email, passwordLength: password.length, authConfig: auth?.app?.options });
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('AUTH EMULATOR DEBUG - createUserWithEmailAndPassword succeeded:', {
      uid: userCredential.user.uid,
      emailVerified: userCredential.user.emailVerified
    });
    
    // Update profile with display name if provided
    if (displayName) {
      try {
        await updateProfile(userCredential.user, { displayName });
        console.log('AUTH EMULATOR DEBUG - updateProfile succeeded for user:', userCredential.user.uid);
      } catch (profileError) {
        // Log the error but continue with registration process
        logger.warn('AuthService', 'registerUser', 'Failed to set display name', { 
          userId: userCredential.user.uid,
          error: profileError.message
        });
        console.warn('AUTH EMULATOR DEBUG - updateProfile failed:', profileError.message);
        // We continue since this is not critical for account creation
      }
    }
    
    // Create user document in Firestore - wrap in separate try-catch
    try {
      const userId = userCredential.user.uid;
      const userDocRef = doc(db, 'users', userId);
      
      logger.debug('AuthService', 'registerUser', 'Creating user document in Firestore', { 
        userId: userId
      });
      
      // Prepare user document data following B5.2 schema
      const userData = {
        email: email,
        displayName: displayName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          currency: 'CAD' // Default currency as per requirements
        }
      };
      
      console.log('AUTH EMULATOR DEBUG - Creating Firestore document for user:', {
        userId,
        documentPath: `users/${userId}`,
        dataFields: Object.keys(userData)
      });
      
      // Create the document
      await setDoc(userDocRef, userData);
      
      logger.info('AuthService', 'registerUser', 'User document created in Firestore', { 
        userId: userId
      });
    } catch (firestoreError) {
      // Critical error - log detailed information
      logger.error('AuthService', 'registerUser', 'Failed to create user document in Firestore', {
        userId: userCredential.user.uid,
        error: firestoreError.message,
        code: firestoreError.code,
        stack: firestoreError.stack
      });
      
      console.error('AUTH EMULATOR DEBUG - Firestore document creation failed:', {
        userId: userCredential.user.uid,
        error: firestoreError.message,
        code: firestoreError.code
      });
      
      // This is a critical error as it will prevent proper app functioning
      // The user was created in Auth but not in Firestore which will cause issues later
      throw new Error(`User account created but profile setup failed: ${firestoreError.message}`);
    }
    
    // Send email verification - also wrap in try-catch to ensure it doesn't block completion
    try {
      await sendEmailVerification(userCredential.user);
      logger.info('AuthService', 'registerUser', 'Verification email sent', {
        userId: userCredential.user.uid
      });
    } catch (emailError) {
      // Non-critical error - log but continue
      logger.warn('AuthService', 'registerUser', 'Failed to send verification email', {
        userId: userCredential.user.uid,
        error: emailError.message
      });
      console.warn('AUTH EMULATOR DEBUG - Email verification sending failed:', emailError.message);
      // We continue since this is not critical for account creation
    }
    
    logger.info('AuthService', 'registerUser', 'User registered successfully', { 
      userId: userCredential.user.uid
    });
    
    return userCredential;
  } catch (error) {
    // Enhanced error logging
    console.error('AUTH EMULATOR DEBUG - Registration failed with details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: JSON.stringify(error)
    });
    
    logger.error('AuthService', 'registerUser', 'Registration failed', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Log in an existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>} - Firebase user credential
 */
export const loginUser = async (email, password) => {
  try {
    // Enhanced debugging
    console.log('AUTH EMULATOR DEBUG - loginUser called with:', { 
      email, 
      passwordLength: password.length,
      authInstance: !!auth
    });
    
    logger.debug('AuthService', 'loginUser', 'Attempting user login', { email });
    
    // Add detailed context before calling the Firebase function
    console.log('AUTH EMULATOR DEBUG - About to call signInWithEmailAndPassword with:',
      { email, passwordLength: password.length, authConfig: auth?.app?.options });
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('AUTH EMULATOR DEBUG - signInWithEmailAndPassword succeeded:', {
      uid: userCredential.user.uid,
      emailVerified: userCredential.user.emailVerified,
      tokenResult: userCredential?.user?.getIdToken ? 'available' : 'unavailable'
    });
    
    logger.info('AuthService', 'loginUser', 'User logged in successfully', { 
      userId: userCredential.user.uid,
      emailVerified: userCredential.user.emailVerified
    });
    
    return userCredential;
  } catch (error) {
    // Enhanced error logging
    console.error('AUTH EMULATOR DEBUG - Login failed with details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: JSON.stringify(error)
    });
    
    logger.error('AuthService', 'loginUser', 'Login failed', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Log out the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    logger.debug('AuthService', 'logoutUser', 'Logging out user');
    
    const userId = auth.currentUser?.uid;
    await signOut(auth);
    
    logger.info('AuthService', 'logoutUser', 'User logged out successfully', { 
      userId 
    });
  } catch (error) {
    logger.error('AuthService', 'logoutUser', 'Logout failed', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Send password reset email to user
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    logger.debug('AuthService', 'resetPassword', 'Sending password reset email', { email });
    
    await sendPasswordResetEmail(auth, email);
    
    logger.info('AuthService', 'resetPassword', 'Password reset email sent successfully', { 
      email 
    });
  } catch (error) {
    logger.error('AuthService', 'resetPassword', 'Password reset failed', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Send email verification to current user
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    logger.debug('AuthService', 'sendVerificationEmail', 'Sending verification email');
    
    await sendEmailVerification(auth.currentUser);
    
    logger.info('AuthService', 'sendVerificationEmail', 'Verification email sent successfully', { 
      userId: auth.currentUser.uid 
    });
  } catch (error) {
    logger.error('AuthService', 'sendVerificationEmail', 'Failed to send verification email', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Update the current user's profile
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.displayName] - New display name
 * @param {string} [profileData.photoURL] - New photo URL
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (profileData) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    logger.debug('AuthService', 'updateUserProfile', 'Updating user profile');
    
    await updateProfile(auth.currentUser, profileData);
    
    logger.info('AuthService', 'updateUserProfile', 'Profile updated successfully', { 
      userId: auth.currentUser.uid 
    });
  } catch (error) {
    logger.error('AuthService', 'updateUserProfile', 'Failed to update profile', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Update the current user's email
 * @param {string} newEmail - New email address
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (newEmail) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    logger.debug('AuthService', 'updateUserEmail', 'Updating user email');
    
    await updateEmail(auth.currentUser, newEmail);
    
    // Send verification email to the new address
    await sendEmailVerification(auth.currentUser);
    
    logger.info('AuthService', 'updateUserEmail', 'Email updated successfully', { 
      userId: auth.currentUser.uid 
    });
  } catch (error) {
    logger.error('AuthService', 'updateUserEmail', 'Failed to update email', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Update the current user's password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (newPassword) => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    
    logger.debug('AuthService', 'updateUserPassword', 'Updating user password');
    
    await updatePassword(auth.currentUser, newPassword);
    
    logger.info('AuthService', 'updateUserPassword', 'Password updated successfully', { 
      userId: auth.currentUser.uid 
    });
  } catch (error) {
    logger.error('AuthService', 'updateUserPassword', 'Failed to update password', { 
      error: error.message, 
      code: error.code
    });
    throw error;
  }
};
  
/**
 * Get the current user
 * @returns {User|null} - Current Firebase user or null if not signed in
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};
  
// Export auth instance for use in other modules if needed
export { auth };