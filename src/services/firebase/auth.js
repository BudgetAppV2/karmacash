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
  import logger from '../logger';
  import { auth } from './firebaseInit';
  
  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - User display name
   * @returns {Promise<UserCredential>} - Firebase user credential
   */
  export const registerUser = async (email, password, displayName) => {
    try {
      logger.debug('AuthService', 'registerUser', 'Starting user registration', { email });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      logger.info('AuthService', 'registerUser', 'User registered successfully', { 
        userId: userCredential.user.uid
      });
      
      return userCredential;
    } catch (error) {
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
      logger.debug('AuthService', 'loginUser', 'Attempting user login', { email });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      logger.info('AuthService', 'loginUser', 'User logged in successfully', { 
        userId: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified
      });
      
      return userCredential;
    } catch (error) {
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