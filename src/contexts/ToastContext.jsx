import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Toast from '../components/ui/Toast';
import '../components/ui/Toast.css';

// Create context
const ToastContext = createContext();

/**
 * Toast context provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Toast context provider
 */
export const ToastProvider = ({ children }) => {
  // First, check if there's already a ToastContext to prevent nesting issues
  const existingContext = useContext(ToastContext);
  
  // If this provider is nested inside another ToastProvider, just pass through
  if (existingContext) {
    return <>{children}</>;
  }
  
  const [toasts, setToasts] = useState([]);
  const [hasError, setHasError] = useState(false);
  
  // Error boundary effect
  useEffect(() => {
    if (hasError) {
      console.error('ToastProvider encountered an error, disabling toasts');
    }
  }, [hasError]);
  
  // Add a new toast
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    if (hasError) return -1;
    try {
      const id = Date.now();
      setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
      return id;
    } catch (error) {
      console.error('Error adding toast:', error);
      setHasError(true);
      return -1;
    }
  }, [hasError]);
  
  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    if (hasError) return;
    try {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    } catch (error) {
      console.error('Error removing toast:', error);
      setHasError(true);
    }
  }, [hasError]);
  
  // Convenience methods for different toast types
  const showSuccess = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);
  
  const showError = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);
  
  const showWarning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);
  
  const showInfo = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);
  
  // If we had an error, just render children without toast functionality
  if (hasError) {
    return <>{children}</>;
  }
  
  return (
    <ToastContext.Provider value={{ 
      addToast, 
      removeToast, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo 
    }}>
      {children}
      
      {/* Render toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            visible={true}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use toast context
 * @returns {Object} Toast context
 */
export const useToast = () => {
  try {
    const context = useContext(ToastContext);
    if (!context) {
      console.warn('useToast was called outside of ToastProvider');
      // Return no-op functions to avoid crashes
      return {
        addToast: () => -1,
        removeToast: () => {},
        showSuccess: () => -1,
        showError: () => -1,
        showWarning: () => -1,
        showInfo: () => -1
      };
    }
    return context;
  } catch (error) {
    console.error('Error in useToast:', error);
    // Return no-op functions to avoid crashes
    return {
      addToast: () => -1,
      removeToast: () => {},
      showSuccess: () => -1,
      showError: () => -1,
      showWarning: () => -1,
      showInfo: () => -1
    };
  }
};

export default ToastProvider; 