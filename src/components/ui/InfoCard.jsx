import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import logger from '../../services/logger';

/**
 * InfoCard - A reusable card component for displaying information messages
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the card
 * @param {string} props.message - The message content
 * @param {('info'|'warning'|'error')} props.variant - The style variant
 * @returns {JSX.Element} A styled information card
 */
const InfoCard = ({ title, message, variant = 'info' }) => {
  // Use ref to prevent duplicate logs in StrictMode
  const hasLogged = useRef(false);
  
  // Styles based on variant
  const styles = {
    info: {
      background: '#e3f2fd',
      border: '1px solid #2196f3',
      color: '#0d47a1'
    },
    warning: {
      background: '#fff3e0',
      border: '1px solid #ff9800',
      color: '#e65100'
    },
    error: {
      background: '#ffebee',
      border: '1px solid #f44336',
      color: '#b71c1c'
    }
  };

  // Check if variant is valid
  const validVariants = ['info', 'warning', 'error'];
  const isValidVariant = validVariants.includes(variant);

  useEffect(() => {
    // Prevent duplicate logs in StrictMode
    if (hasLogged.current) return;
    hasLogged.current = true;
    
    // Log component mount with props
    logger.debug('InfoCard', 'mount', 'InfoCard component mounted', {
      props: { title, message, variant }
    });

    // Log warning for invalid variant (with more emphasis)
    if (!isValidVariant) {
      // Log with our logger
      logger.warn('InfoCard', 'validateProps', `[WARNING] Invalid variant prop received: "${variant}"`, {
        receivedVariant: variant,
        allowedVariants: validVariants,
        title: title // Add title to help identify which card has the issue
      });
      
      // Also log directly to console for visibility during testing
      console.warn(`[InfoCard] Invalid variant "${variant}" for card "${title}". Valid variants are: ${validVariants.join(', ')}`);
    }
  }, [title, message, variant, isValidVariant]);

  // Card style - use default info style if variant is invalid
  const cardStyle = styles[variant] || styles.info;

  return (
    <div 
      className="info-card"
      style={{
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        ...cardStyle
      }}
      role="region"
      aria-labelledby="info-card-title"
    >
      <h3 
        id="info-card-title"
        style={{ 
          margin: '0 0 8px 0',
          fontSize: '18px'
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '14px' }}>
        {message}
      </p>
      
      {/* Show a visual indication when the variant is invalid (for testing purposes) */}
      {!isValidVariant && (
        <div style={{ 
          marginTop: '8px', 
          padding: '4px 8px', 
          fontSize: '12px', 
          backgroundColor: '#FFF3CD',
          color: '#856404',
          borderRadius: '4px',
          border: '1px solid #FFEEBA'
        }}>
          ⚠️ Warning: Invalid variant "{variant}" (check console logs)
        </div>
      )}
    </div>
  );
};

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['info', 'warning', 'error'])
};

export default InfoCard; 