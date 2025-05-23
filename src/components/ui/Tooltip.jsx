import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Tooltip.css';
import cn from '../../utils/cn';

/**
 * Accessible tooltip component that displays additional information when hovering or focusing on an element
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The element to trigger the tooltip
 * @param {string} props.content - The content to display in the tooltip
 * @param {string} props.position - The position of the tooltip (top, right, bottom, left)
 * @param {string} props.className - Additional CSS class for the tooltip container
 * @param {string} props.tooltipClassName - Additional CSS class for the tooltip content
 * @param {boolean} props.showOnClick - Whether to show the tooltip on click (for mobile)
 * @returns {JSX.Element} Tooltip component
 */
const Tooltip = ({ 
  children, 
  content, 
  position = 'top', 
  className,
  tooltipClassName,
  showOnClick = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close the tooltip when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isVisible && 
        tooltipRef.current && 
        triggerRef.current &&
        !tooltipRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isVisible]);

  // Handle keyboard escape key to close tooltip
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (isVisible && event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150); // Small delay to prevent flickering when moving from trigger to tooltip
  };

  const toggleTooltip = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <div 
      className={cn("tooltip-container", className)} 
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      ref={triggerRef}
    >
      <div 
        onClick={showOnClick ? toggleTooltip : undefined}
        className="tooltip-trigger"
        aria-describedby={isVisible ? "tooltip-content" : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className={cn("tooltip", `tooltip-${position}`, tooltipClassName)}
        >
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  className: PropTypes.string,
  tooltipClassName: PropTypes.string,
  showOnClick: PropTypes.bool
};

export default Tooltip; 