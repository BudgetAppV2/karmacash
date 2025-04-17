// src/services/authService.js

import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  resetPassword as firebaseResetPassword, 
  sendVerificationEmail as firebaseSendVerificationEmail,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  getCurrentUser as getFirebaseCurrentUser,
  auth
} from './firebase/auth';

// Re-exporting with more intuitive names for use in components
export const signUp = registerUser;
export const signIn = loginUser;
export const signOut = logoutUser;
export const resetPassword = firebaseResetPassword;
export const sendVerificationEmail = firebaseSendVerificationEmail;
export const updateProfile = updateUserProfile;
export const updateEmail = updateUserEmail;
export const updatePassword = updateUserPassword;
export const getCurrentUser = getFirebaseCurrentUser;

// Export auth instance
export { auth };

export default {
  signUp,
  signIn,
  signOut,
  resetPassword,
  sendVerificationEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  getCurrentUser,
  auth
}; 