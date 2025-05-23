import { useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import BudgetProvider from '../contexts/BudgetContext';

// Debug log
console.log('AppProviders.jsx: Initial load');

function AppProviders({ children }) {
  console.log('AppProviders.jsx: Component rendering');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AppProviders.jsx: useEffect running, setting loading timer');
    // Simulate initial app loading
    const timer = setTimeout(() => {
      console.log('AppProviders.jsx: Loading complete, setting isLoading=false');
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  console.log('AppProviders.jsx: isLoading =', isLoading);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner"></div>
        <p>Chargement de KarmaCash...</p>
      </div>
    );
  }

  console.log('AppProviders.jsx: Rendering providers');
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