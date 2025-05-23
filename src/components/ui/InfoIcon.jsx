import React from 'react';
import PropTypes from 'prop-types';

/**
 * Information icon component using Heroicon design
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS class for the icon
 * @param {number} props.size - Size of the icon in pixels
 * @returns {JSX.Element} Info icon component
 */
const InfoIconUI = ({ className = '', size = 20 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" 
      />
    </svg>
  );
};

InfoIconUI.propTypes = {
  className: PropTypes.string,
  size: PropTypes.number
};

export default InfoIconUI; 