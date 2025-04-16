import React from 'react';
import PropTypes from 'prop-types';
import logger from '../../services/logger';

/**
 * ActionConfirm - A simple component to confirm an action with logging
 * 
 * @param {Object} props
 * @param {string} props.actionName - The name of the action (e.g., "Delete Transaction")
 * @param {Function} props.onConfirm - Callback function to execute when action is confirmed
 * @param {string} [props.itemId] - Optional identifier for the item being acted upon
 * @returns {JSX.Element} A confirmation button with action name
 */
const ActionConfirm = ({ actionName, onConfirm, itemId }) => {
  /**
   * Handle confirm button click
   * - Calls the onConfirm callback
   * - Logs the action with aiContext
   */
  const handleConfirm = () => {
    // Log the confirmation action with AI Context
    logger.aiContext('ActionConfirm', 'handleConfirm', `User confirmed action: ${actionName}`, {
      actionName,
      itemId: itemId || 'not_specified',
      timestamp: new Date().toISOString(),
      userIntent: `User intended to ${actionName.toLowerCase()}`
    });
    
    // Also log to console for testing visibility
    console.info(`[AI Context] Action confirmed: ${actionName}`, { itemId });
    
    // Call the provided callback function
    onConfirm();
  };

  return (
    <div 
      className="action-confirm" 
      role="region" 
      aria-label={`Confirm ${actionName}`}
    >
      <span className="action-name">{actionName}</span>
      <button
        type="button"
        className="btn-confirm"
        onClick={handleConfirm}
        aria-label={`Confirm ${actionName}`}
        style={{
          marginLeft: '8px',
          padding: '6px 12px',
          backgroundColor: '#0D6EFD',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Confirm
      </button>
    </div>
  );
};

ActionConfirm.propTypes = {
  actionName: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  itemId: PropTypes.string
};

export default ActionConfirm; 