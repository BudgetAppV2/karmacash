import React from 'react';
import { useToast } from '../../contexts/ToastContext';
// Toast.css is now imported in ToastContext.jsx, no need to import it here
// It's still not using any CSS classes from Toast.css

/**
 * Demo component for toast notifications
 * @returns {JSX.Element} Toast demo UI
 */
const ToastDemo = () => {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo 
  } = useToast();
  
  // Apply safer inline styles
  const pageContainerStyle = {
    padding: '32px',
    maxWidth: '800px',
    margin: '0 auto'
  };
  
  const buttonContainerStyle = {
    display: 'flex', 
    gap: '16px', 
    marginTop: '24px',
    flexWrap: 'wrap'
  };
  
  const sectionStyle = {
    marginTop: '32px'
  };
  
  const btnBaseStyle = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontWeight: '500'
  };
  
  return (
    <div style={pageContainerStyle}>
      <h1>Toast Notifications Demo</h1>
      <p>Click the buttons below to test different types of toast notifications.</p>
      
      <div style={buttonContainerStyle}>
        <button 
          onClick={() => showSuccess('Opération réussie!')}
          style={{...btnBaseStyle, backgroundColor: '#568E8D'}}
        >
          Success Toast
        </button>
        
        <button 
          onClick={() => showError('Une erreur est survenue!')}
          style={{...btnBaseStyle, backgroundColor: '#C17C74'}}
        >
          Error Toast
        </button>
        
        <button 
          onClick={() => showWarning('Attention requise!')}
          style={{...btnBaseStyle, backgroundColor: '#FFC107'}}
        >
          Warning Toast
        </button>
        
        <button 
          onClick={() => showInfo('Information importante!')}
          style={{...btnBaseStyle, backgroundColor: '#7A8D99'}}
        >
          Info Toast
        </button>
      </div>
      
      <div style={sectionStyle}>
        <h2>Durations</h2>
        <p>You can also specify different durations for toast notifications:</p>
        
        <div style={buttonContainerStyle}>
          <button 
            onClick={() => showSuccess('Toast court (2s)', 2000)}
            style={{...btnBaseStyle, backgroundColor: '#88837A'}}
          >
            Short (2s)
          </button>
          
          <button 
            onClick={() => showSuccess('Toast normal (3s)', 3000)}
            style={{...btnBaseStyle, backgroundColor: '#88837A'}}
          >
            Default (3s)
          </button>
          
          <button 
            onClick={() => showSuccess('Toast long (5s)', 5000)}
            style={{...btnBaseStyle, backgroundColor: '#88837A'}}
          >
            Long (5s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastDemo; 