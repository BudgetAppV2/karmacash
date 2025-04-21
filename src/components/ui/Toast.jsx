import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

/**
 * Toast notification component
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {string} props.type - The type of toast ('success', 'error', 'info', 'warning')
 * @param {boolean} props.visible - Whether the toast is visible
 * @param {function} props.onClose - Function to call when the toast is closed
 * @param {number} props.duration - Duration in ms before auto-closing (default: 3000)
 * @returns {JSX.Element} Toast notification component
 */
const Toast = ({ message, type = 'info', visible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose, duration]);
  
  if (!visible) return null;
  
  // Get the appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };
  
  return (
    <div className={`toast toast-${type} visible`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button 
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number
};

export default Toast; 