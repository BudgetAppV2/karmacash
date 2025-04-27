import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import BudgetProvider from '../contexts/BudgetContext';

function AppProviders({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner"></div>
        <p>Chargement de KarmaCash...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BudgetProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}

export default AppProviders;