import React from 'react';
import PropTypes from 'prop-types';
import './StatusMessage.css';

/**
 * StatusMessage - A reusable component for displaying status messages
 * Styled to match KarmaCash Zen/Tranquility Theme
 * 
 * @param {Object} props
 * @param {string} props.type - Type of message (info, success, warning, error, empty)
 * @param {string} props.message - The message to display
 * @param {string} [props.title] - Optional title for the message
 * @param {node} [props.icon] - Optional custom icon
 * @param {node} [props.action] - Optional action element (like a button)
 * @returns {JSX.Element} A styled status message component
 */
const StatusMessage = ({ type, message, title, icon, action }) => {
  // Default icons for different status types
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="status-icon success" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="status-icon warning" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="status-icon error" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        );
      case 'empty':
        return (
          <svg className="status-icon empty" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
          </svg>
        );
      default: // info
        return (
          <svg className="status-icon info" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2zm0 4h2v6h-2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`status-message status-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <div className="status-content">
        {icon || getDefaultIcon()}
        <div className="status-text">
          {title && <h4 className="status-title">{title}</h4>}
          <p className="status-message-text">{message}</p>
        </div>
      </div>
      {action && <div className="status-action">{action}</div>}
    </div>
  );
};

StatusMessage.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error', 'empty']).isRequired,
  message: PropTypes.string.isRequired,
  title: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node
};

export default StatusMessage; 