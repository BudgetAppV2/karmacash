import React from 'react';
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
 *   onInteractionEnd?: () => void    // New prop
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
}) => {

  const handleSliderChange = (event) => {
    const newValue = parseFloat(event.target.value);
    onChange(newValue);
  };

  const handleMouseDown = () => {
    onInteractionStart?.();
  };

  const handleTouchStart = () => {
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
  }

  return (
    <div className={`${styles.sliderContainer} ${className}`}>
      <input
        type="range"
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
        onBlur={handleBlur} // Added onBlur for interaction end
        aria-label={ariaLabel}
        disabled={disabled}
      />
    </div>
  );
};

export default AllocationSlider; 