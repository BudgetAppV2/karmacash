import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification as sendEmailVerificationToUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import logger from '../services/logger';

// Import our initialized Firebase instances
import { auth, db } from '../services/firebase/firebaseInit';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function signup(email, password) {
    const operation = 'signup';
    try {
      logger.info('AuthContext', operation, 'Starting user signup');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          currency: 'CAD',
          balanceDisplayMode: 'cumulative',
          lastAccessedBudgetId: null
        }
      };
      
      console.log('AUTH CONTEXT DEBUG - Creating user document:', {
        userId: userCredential.user.uid,
        documentPath: `users/${userCredential.user.uid}`,
        dataFields: Object.keys(userData)
      });
      
      try {
        await setDoc(userDocRef, userData);
        logger.info('AuthContext', operation, 'User document created in Firestore', {
          userId: userCredential.user.uid
        });
      } catch (firestoreError) {
        console.error('AUTH CONTEXT ERROR - Failed to create user document:', {
          userId: userCredential.user.uid,
          error: firestoreError.message,
          code: firestoreError.code,
          stack: firestoreError.stack
        });
        logger.error('AuthContext', operation, 'Failed to create user document', {
          userId: userCredential.user.uid,
          error: firestoreError.message,
          code: firestoreError.code,
          stack: firestoreError.stack
        });
        throw new Error(`User account created but profile setup failed: ${firestoreError.message}`);
      }
      
      logger.info('AuthContext', operation, 'User signup successful, awaiting auth state change', {
        userId: userCredential.user.uid
      });
      return userCredential.user;
    } catch (error) {
      logger.error('AuthContext', operation, 'Signup failed', { error });
      setError('Erreur lors de la création du compte: ' + error.message);
      throw error;
    }
  }

  async function login(email, password) {
    const operation = 'login';
    try {
      logger.info('AuthContext', operation, 'User login attempt');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      logger.info('AuthContext', operation, 'User login successful, awaiting auth state change', {
        userId: userCredential.user.uid
      });
      return userCredential.user;
    } catch (error) {
      logger.error('AuthContext', operation, 'Login failed', { error });
      setError('Erreur de connexion: ' + error.message);
      throw error;
    }
  }

  async function logout() {
    const operation = 'logout';
    try {
      logger.info('AuthContext', operation, 'User logout');
      await signOut(auth);
      logger.info('AuthContext', operation, 'User logout successful');
    } catch (error) {
      logger.error('AuthContext', operation, 'Logout failed', { error });
      setError('Erreur de déconnexion: ' + error.message);
      throw error;
    }
  }

  useEffect(() => {
    const operation = 'authStateChange';
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        logger.info('AuthContext', operation, 'User authenticated, fetching profile', { userId: user.uid });
        const userDocRef = doc(db, 'users', user.uid);
        let firestoreData = {};

        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            firestoreData = docSnap.data();
            logger.debug('AuthContext', operation, 'Firestore profile data fetched', { userId: user.uid, dataKeys: Object.keys(firestoreData) });
          } else {
            logger.warn('AuthContext', operation, 'Firestore user document not found!', { userId: user.uid });
          }
        } catch (firestoreError) {
          logger.error('AuthContext', operation, 'Error fetching Firestore user document', {
            userId: user.uid,
            error: firestoreError.message,
            stack: firestoreError.stack,
          });
          setError('Erreur lors de la récupération du profil utilisateur.');
        }

        const mergedUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          ...firestoreData,
          settings: firestoreData.settings || { currency: 'CAD', lastAccessedBudgetId: null }
        };

        logger.debug('AuthContext', operation, 'Setting merged currentUser state', { userId: user.uid, mergedKeys: Object.keys(mergedUser) });
        setCurrentUser(mergedUser);

      } else {
        logger.info('AuthContext', operation, 'User not authenticated');
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
        logger.debug('AuthContext', 'cleanup', 'Unsubscribing from auth state changes');
        unsubscribe();
    }
  }, []);

  async function sendPasswordReset(email) {
    const operation = 'sendPasswordReset';
    try {
      logger.info('AuthContext', operation, 'Sending password reset email');
      await sendPasswordResetEmail(auth, email);
      logger.info('AuthContext', operation, 'Password reset email sent');
      return true;
    } catch (error) {
      logger.error('AuthContext', operation, 'Failed to send password reset email', { error });
      setError('Erreur lors de l\'envoi du courriel de réinitialisation: ' + error.message);
      throw error;
    }
  }

  async function sendEmailVerification() {
    const operation = 'sendEmailVerification';
    try {
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      logger.info('AuthContext', operation, 'Sending verification email');
      await sendEmailVerificationToUser(currentUser);
      logger.info('AuthContext', operation, 'Verification email sent');
      return true;
    } catch (error) {
      logger.error('AuthContext', operation, 'Failed to send verification email', { error });
      setError('Erreur lors de l\'envoi du courriel de vérification: ' + error.message);
      throw error;
    }
  }

  const value = {
    currentUser,
    isLoading,
    error,
    setError,
    signup,
    login,
    logout,
    sendPasswordReset,
    sendEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}