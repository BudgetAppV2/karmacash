import React, { useEffect, useRef } from 'react';
// No PropTypes in this project, using JSDoc as requested
import styles from './AllocationSlider.module.css';

/**
 * A custom styled range slider component for budget allocations.
 *
 * @param {{
 *   min?: number, // Defaults to 0
 *   max: number, // Required, will be dynamic
 *   value: number, // Required, controlled component
 *   onChange: (newValue: number) => void, // Required
 *   step?: number, // Defaults to 1
 *   ariaLabel: string, // Required, for accessibility, e.g., "Allocate {categoryName}"
 *   className?: string, // Optional, for additional styling from parent
 *   disabled?: boolean, // Optional, to disable the slider
 *   onInteractionStart?: () => void, // New prop
 *   onInteractionEnd?: () => void,    // New prop
 *   categoryColor?: string // New prop for category color
 * }} props
 */
const AllocationSlider = ({
  min = 0,
  max,
  value,
  onChange,
  step = 1,
  ariaLabel,
  className = '',
  disabled = false,
  onInteractionStart,
  onInteractionEnd,
  categoryColor, // Add new prop for category color
}) => {
  // Reference to the slider input element
  const sliderRef = useRef(null);
  // Track if touch is active to prevent duplicate events
  const touchActiveRef = useRef(false);

  // Update the CSS variable for WebKit browsers to show the filled track
  useEffect(() => {
    if (sliderRef.current) {
      // Calculate percentage fill based on current value
      const percentage = ((value - min) / (max - min)) * 100;
      // Set the CSS custom property for the filled track
      sliderRef.current.style.setProperty('--slider-percentage', `${percentage}%`);
      // Set the category color for the filled track if provided
      if (categoryColor) {
        sliderRef.current.style.setProperty('--slider-filled-color', categoryColor);
      } else {
        sliderRef.current.style.removeProperty('--slider-filled-color');
      }
    }
  }, [value, min, max, categoryColor]);

  const handleSliderChange = (event) => {
    const newValue = parseFloat(event.target.value);
    onChange(newValue);
  };

  const handleMouseDown = () => {
    onInteractionStart?.();
  };

  const handleTouchStart = (e) => {
    onInteractionStart?.();
  };

  const handleMouseUp = () => {
    onInteractionEnd?.();
  };

  const handleTouchEnd = () => {
    onInteractionEnd?.();
  };

  // onBlur might also be a good place to signal end of interaction, 
  // especially for keyboard users or if focus is lost.
  const handleBlur = () => {
    onInteractionEnd?.(); 
  };

  return (
    <div className={`${styles.sliderContainer} ${className}`}>
      <input
        ref={sliderRef}
        type="range"
        role="slider"
        className={styles.slider}
        min={min}
        max={max}
        value={value}
        step={step}
        onChange={handleSliderChange}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`$${value.toFixed(2)}`}
        disabled={disabled}
      />
    </div>
  );
};

export default AllocationSlider; 