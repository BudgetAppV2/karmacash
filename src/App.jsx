// src/App.jsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRoutes from './app/AppRoutes';
import { auth } from './services/firebase/firebaseInit';
import { syncUserProfile } from './services/firebase/firestore';
import logger from './services/logger';

// Import styles
import './styles/reset.css';
import './styles/theme.css';
import './styles/index.css';

const App = () => {
  // Set up auth state change listener to sync user profile with Firestore
  useEffect(() => {
    logger.debug('App', 'init', 'Initializing app');
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        logger.info('App', 'authStateChanged', 'User authenticated, syncing profile');
        try {
          await syncUserProfile(user);
        } catch (error) {
          logger.error('App', 'authStateChanged', 'Failed to sync user profile', {
            error: error.message
          });
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <AuthProvider>
        {/* Keep ToastProvider at app level to ensure toast functionality for public routes */}
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;