import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SwipeActions.css';

/**
 * SwipeActions component - Reusable swipe-to-reveal actions for touch and mouse interactions
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children The content to wrap with swipe functionality
 * @param {Array} props.actions Array of action objects with { label, onClick, className?, ariaLabel? }
 * @param {string} props.itemId Unique identifier for this swipeable item
 * @param {number} props.swipeThreshold Pixels needed to trigger swipe (default: 70)
 * @param {boolean} props.disabled Disable swipe interactions
 * @param {Function} props.onSwipeStart Callback when swipe starts
 * @param {Function} props.onSwipeEnd Callback when swipe ends
 * @returns {JSX.Element} Swipeable wrapper component
 */
const SwipeActions = ({ 
  children, 
  actions = [], 
  itemId, 
  swipeThreshold = 70,
  disabled = false,
  onSwipeStart,
  onSwipeEnd
}) => {
  const [swipedItemId, setSwipedItemId] = useState(null);
  const touchStartXRef = useRef(0);
  const prefersReducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = () => {
      prefersReducedMotion.current = mediaQuery.matches;
    };
    
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // Handle swipe start
  const handleTouchStart = (e) => {
    if (disabled) return;
    
    // Close any previously swiped item when starting a new swipe
    if (swipedItemId && swipedItemId !== itemId) {
      setSwipedItemId(null);
    }
    
    touchStartXRef.current = e.touches[0].clientX;
    
    if (onSwipeStart) {
      onSwipeStart(itemId);
    }
  };
  
  // Handle swipe move - enhanced for smoother iOS-like feel
  const handleTouchMove = (e) => {
    if (disabled) return;
    
    if (swipedItemId && swipedItemId !== itemId) {
      return;
    }
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    // Use the provided threshold for more intentional swipes
    if (diff > swipeThreshold) {
      setSwipedItemId(itemId);
      // Add haptic feedback if available (iOS)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(10); // Subtle vibration
      }
    } else if (diff < -20) { // Lower threshold to close, for easier reset
      setSwipedItemId(null);
    }
  };
  
  // Handle touch end - allows for completing the swipe on release
  const handleTouchEnd = (e) => {
    if (disabled) return;
    
    if (onSwipeEnd) {
      onSwipeEnd(itemId, swipedItemId === itemId);
    }
  };
  
  // Mouse events for desktop users - enhanced for better experience
  const handleMouseDown = (e) => {
    if (disabled) return;
    
    // Close any previously swiped item when starting a new swipe
    if (swipedItemId && swipedItemId !== itemId) {
      setSwipedItemId(null);
    }
    
    touchStartXRef.current = e.clientX;
    
    if (onSwipeStart) {
      onSwipeStart(itemId);
    }
    
    const handleMouseMove = (moveEvent) => {
      const mouseMoveX = moveEvent.clientX;
      const diff = touchStartXRef.current - mouseMoveX;
      
      // Use same threshold as touch for consistency
      if (diff > swipeThreshold) {
        setSwipedItemId(itemId);
      } else if (diff < -20) { // Lower threshold to close
        setSwipedItemId(null);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (onSwipeEnd) {
        onSwipeEnd(itemId, swipedItemId === itemId);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Cancel swipe on click elsewhere
  const handlePageClick = (e) => {
    if (swipedItemId && !e.target.closest('.swipe-actions-wrapper')) {
      setSwipedItemId(null);
    }
  };
  
  useEffect(() => {
    document.addEventListener('click', handlePageClick);
    return () => {
      document.removeEventListener('click', handlePageClick);
    };
  }, [swipedItemId]);

  const isCurrentlySwipped = swipedItemId === itemId;

  return (
    <div
      className="swipe-actions-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Action Buttons (revealed on swipe) */}
      <div className={`swipe-actions-container ${isCurrentlySwipped ? 'visible' : 'hidden'}`}>
        {actions.map((action, index) => (
          <button
            key={index}
            className={`swipe-action-button ${action.className || ''}`}
            onClick={action.onClick}
            aria-label={action.ariaLabel || action.label}
            title={action.label}
          >
            {action.label}
          </button>
        ))}
      </div>
      
      {/* Main Content */}
      <div className={`swipe-content ${isCurrentlySwipped ? 'swiped' : ''}`}>
        {children}
      </div>
    </div>
  );
};

SwipeActions.propTypes = {
  children: PropTypes.node.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      className: PropTypes.string,
      ariaLabel: PropTypes.string
    })
  ),
  itemId: PropTypes.string.isRequired,
  swipeThreshold: PropTypes.number,
  disabled: PropTypes.bool,
  onSwipeStart: PropTypes.func,
  onSwipeEnd: PropTypes.func
};

export default SwipeActions;