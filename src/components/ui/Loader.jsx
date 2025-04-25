import React from 'react';
import PropTypes from 'prop-types';
import './Loader.css';

/**
 * Loader - A reusable loading spinner component
 * Styled to match KarmaCash Zen/Tranquility Theme
 * 
 * @param {Object} props
 * @param {string} [props.size="medium"] - Size of the loader (small, medium, large)
 * @param {string} [props.color="primary"] - Color of the loader (primary, secondary, white)
 * @param {string} [props.text] - Optional text to display under the loader
 * @param {boolean} [props.fullPage=false] - Whether the loader should cover the full page
 * @returns {JSX.Element} A loading spinner component
 */
const Loader = ({ size, color, text, fullPage }) => {
  const loaderClasses = [
    'loader-spinner',
    `loader-${size}`,
    `loader-${color}`,
    fullPage ? 'loader-fullpage' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`loader-container ${fullPage ? 'loader-fullpage-container' : ''}`}>
      <div className={loaderClasses} aria-live="polite" role="status">
        <span className="visually-hidden">Chargement en cours</span>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  text: PropTypes.string,
  fullPage: PropTypes.bool
};

Loader.defaultProps = {
  size: 'medium',
  color: 'primary',
  text: '',
  fullPage: false
};

export default Loader; 