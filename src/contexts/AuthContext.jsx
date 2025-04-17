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
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import logger from '../services/logger';
import { initializeDefaultCategories } from '../services/firebase/categories';

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
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date(),
        settings: {
          currency: 'CAD',
          balanceDisplayMode: 'cumulative'
        }
      });
      
      // Initialize default categories as a fallback to Cloud Functions
      try {
        logger.debug('AuthContext', operation, 'Checking if categories need initialization');
        
        // Check if categories already exist for the user
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('userId', '==', userCredential.user.uid)
        );
        
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        if (categoriesSnapshot.empty) {
          logger.info('AuthContext', operation, 'No categories found, initializing defaults', {
            userId: userCredential.user.uid
          });
          
          // Initialize default categories
          await initializeDefaultCategories(userCredential.user.uid);
        } else {
          logger.info('AuthContext', operation, 'Categories already exist for user', {
            userId: userCredential.user.uid,
            count: categoriesSnapshot.size
          });
        }
      } catch (categoryError) {
        // Log the error but continue with the signup process
        logger.error('AuthContext', operation, 'Error initializing categories', { 
          error: categoryError,
          userId: userCredential.user.uid
        });
      }
      
      logger.info('AuthContext', operation, 'User signup successful', {
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
      logger.info('AuthContext', operation, 'User login successful', {
        userId: userCredential.user.uid
      });
      
      // Check if user has a document in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date(),
          settings: {
            currency: 'CAD',
            balanceDisplayMode: 'cumulative'
          }
        });
      }
      
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
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        logger.info('AuthContext', operation, 'User authenticated', {
          userId: user.uid
        });
      } else {
        logger.info('AuthContext', operation, 'User not authenticated');
      }
      setCurrentUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
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

// Add these functions to the value object
const value = {
  currentUser,
  signup,
  login,
  logout,
  sendPasswordReset,
  sendEmailVerification,
  isLoading,
  error,
  setError
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}