import { createContext, useContext, useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import logger from '../services/logger';
import { db } from '../services/firebase/firebaseInit';

const SettingsContext = createContext();

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    currency: 'CAD',
    balanceDisplayMode: 'cumulative',
    selectedPeriod: {
      start: new Date(),
      end: new Date(),
      viewMode: 'week'
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings from Firestore when user changes
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const operation = 'loadSettings';
    logger.info('SettingsContext', operation, 'Loading user settings', {
      userId: currentUser.uid
    });

    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        if (userData.settings) {
          logger.info('SettingsContext', operation, 'User settings loaded');
          setSettings(prevSettings => ({
            ...prevSettings,
            ...userData.settings
          }));
        }
      }
      setIsLoading(false);
    }, (error) => {
      logger.error('SettingsContext', operation, 'Error loading settings', { error });
      setIsLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Update settings in Firestore
  const updateSettings = async (newSettings) => {
    if (!currentUser) return;

    const operation = 'updateSettings';
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Merge with existing settings
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Update in Firestore
      await updateDoc(userRef, {
        'settings': updatedSettings
      });
      
      logger.info('SettingsContext', operation, 'Settings updated successfully');
    } catch (error) {
      logger.error('SettingsContext', operation, 'Error updating settings', { error });
    }
  };

  const value = {
    settings,
    updateSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}