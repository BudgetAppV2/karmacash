import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import logger from '../../services/logger';
import './ConfirmationDialog.css';

/**
 * ConfirmationDialog - A reusable confirmation dialog component
 * Based on KarmaCash Zen/Tranquility Theme defined in [B3.8]
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {Function} props.onConfirm - Called when confirm button is clicked
 * @param {Function} props.onCancel - Called when cancel button is clicked or dialog closed
 * @param {string} props.title - Dialog title (e.g., "Confirm Deletion")
 * @param {string} props.message - Dialog message content
 * @param {string} [props.confirmText="Confirm"] - Text for the confirm button
 * @param {string} [props.cancelText="Cancel"] - Text for the cancel button
 * @param {boolean} [props.isDestructive=false] - If true, styles confirm button as destructive action
 * @param {string} [props.itemId] - Optional identifier for logging purposes
 * @returns {JSX.Element} A modal dialog component
 */
const ConfirmationDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  itemId
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Lock background scrolling when dialog is open (with iOS Safari support)
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Store original body styles
      const originalStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        height: document.body.style.height
      };
      
      // Lock the body with position fixed to prevent background content shifting
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Set focus on the confirm button when dialog opens
      if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }
      
      return () => {
        // Restore original styles when dialog closes
        document.body.style.overflow = originalStyles.overflow;
        document.body.style.position = originalStyles.position;
        document.body.style.top = originalStyles.top;
        document.body.style.width = originalStyles.width;
        document.body.style.height = originalStyles.height;
        
        // Restore scroll position
        window.scrollTo(0, currentScrollY);
      };
    }
  }, [isOpen]);
  
  // Handle ESC key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  // Detect clicks outside the dialog to close it
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        handleCancel();
      }
    };
    
    // Add event listener directly to document for click outside detection
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const handleConfirm = () => {
    // Log the confirmation with AI Context
    logger.aiContext('ConfirmationDialog', 'handleConfirm', `User confirmed: ${title}`, {
      action: title,
      itemId: itemId || 'not_specified',
      timestamp: new Date().toISOString(),
      userIntent: `User confirmed ${title.toLowerCase()}`
    });
    
    onConfirm();
  };
  
  const handleCancel = () => {
    // Log the cancellation with AI Context
    logger.aiContext('ConfirmationDialog', 'handleCancel', `User cancelled: ${title}`, {
      action: title,
      itemId: itemId || 'not_specified',
      timestamp: new Date().toISOString(),
      userIntent: `User cancelled ${title.toLowerCase()}`
    });
    
    onCancel();
  };
  
  // Animation variants (respects prefers-reduced-motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const fadeVariants = {
    hidden: { 
      opacity: 0,
      transition: { 
        duration: prefersReducedMotion ? 0.1 : 0.25,
      }
    },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: prefersReducedMotion ? 0.1 : 0.25,
      }
    }
  };
  
  const dialogVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: 0.98, 
      transition: { 
        duration: prefersReducedMotion ? 0.1 : 0.25,
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1, 
      transition: { 
        duration: prefersReducedMotion ? 0.1 : 0.25,
      }
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          {/* Backdrop */}
          <motion.div 
            className="modal-backdrop"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeVariants}
          >
            {/* Dialog Box */}
            <motion.div
              ref={dialogRef}
              className="modal-container"
              role="dialog"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
              aria-modal="true"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dialogVariants}
            >
              <div className="modal-content">
                {/* Dialog Title */}
                <h3 
                  id="dialog-title"
                  className="modal-title"
                >
                  {title}
                </h3>
                
                {/* Dialog Message */}
                <p 
                  id="dialog-description"
                  className="modal-message"
                >
                  {message}
                </p>
                
                {/* Dialog Actions */}
                <div className="modal-actions">
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-cancel"
                  >
                    {cancelText}
                  </button>
                  
                  {/* Confirm Button */}
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    onClick={handleConfirm}
                    className={`btn-confirm ${isDestructive ? 'destructive' : ''}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  isDestructive: PropTypes.bool,
  itemId: PropTypes.string
};

export default ConfirmationDialog; 