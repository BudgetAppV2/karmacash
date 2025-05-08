import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/auth.css'; // Import styles to get Card styling

/**
 * A reusable card component with basic styling.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Content to render inside the card.
 * @param {string} [props.className] - Optional additional class names.
 */
function Card({ children, className }) {
  return (
    <div className={`auth-card ${className || ''}`}>
      {children}
      {/* Structure can be enhanced later for front/back faces */}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card; 