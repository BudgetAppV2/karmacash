import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Reusable BottomSheet component for mobile-friendly option selection
 */
const BottomSheet = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  getOptionLabel,
  getOptionValue,
  getOptionColor
}) => {
  const sheetRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Lock background scrolling when sheet is open (with iOS Safari support)
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
      
      return () => {
        // Restore original styles when sheet closes
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
  
  // Handle ESC key to close the sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Detect clicks outside the sheet to close it
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        isOpen && 
        sheetRef.current && 
        !sheetRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);
  
  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  const sheetVariants = {
    hidden: { y: '100%' },
    visible: { 
      y: 0,
      transition: { 
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    }
  };

  // Support for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    backdropVariants.visible = { opacity: 1, transition: { duration: 0.1 } };
    sheetVariants.visible = { y: 0, transition: { duration: 0.1 } };
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}
        >
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: -1
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />
          
          {/* Sheet Content */}
          <motion.div
            ref={sheetRef}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column'
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sheetVariants}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#2F2F2F'
              }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <XMarkIcon width={20} height={20} style={{ color: '#88837A' }} />
              </button>
            </div>
            
            {/* Options */}
            <div style={{ flex: 1 }}>
              {options && options.map((option) => {
                const value = getOptionValue ? getOptionValue(option) : option.id;
                const label = getOptionLabel ? getOptionLabel(option) : option.name;
                const color = getOptionColor ? getOptionColor(option) : option.color;
                const isSelected = selectedValue === value;
                
                return (
                  <div
                    key={value}
                    onClick={() => {
                      onSelect(value);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(145, 154, 127, 0.1)' : 'transparent',
                      margin: '4px 0',
                      minHeight: '44px', // Minimum touch target size for accessibility
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {/* Color indicator for categories */}
                    {color && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        marginRight: '12px',
                        flexShrink: 0
                      }} />
                    )}
                    
                    {/* Option label */}
                    <div style={{
                      flex: 1,
                      fontSize: '1rem',
                      color: '#2F2F2F'
                    }}>
                      {label}
                    </div>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <CheckIcon 
                        width={20} 
                        height={20} 
                        style={{ 
                          color: '#919A7F',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

BottomSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  selectedValue: PropTypes.any,
  onSelect: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func,
  getOptionValue: PropTypes.func,
  getOptionColor: PropTypes.func
};

export default BottomSheet; 