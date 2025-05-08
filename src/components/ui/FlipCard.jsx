import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import '../../styles/auth.css'; // Ensure relevant styles are imported

/**
 * A component that wraps content in a card that can flip in 3D.
 * Manages the flip animation based on the isFlipped prop.
 * Addresses mirroring issues by applying rotation directly to faces.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.frontContent - Content for the front face.
 * @param {React.ReactNode} props.backContent - Content for the back face.
 * @param {boolean} props.isFlipped - State indicating if the card is flipped.
 * @param {string} [props.className] - Optional additional class names for the outer container.
 */
function FlipCard({ frontContent, backContent, isFlipped, className }) {
  const spring = {
    type: "spring",
    stiffness: 300,
    damping: 40,
  };

  // Common styles for card faces (managed by CSS, but can be extended here)
  // const commonFaceStyles = { 
  //   position: 'absolute',
  //   width: '100%',
  //   height: '100%',
  //   backfaceVisibility: 'hidden', // CSS handles vendor prefixes 
  // };

  return (
    <div className={`flip-card-container ${className || ''}`}>
      <div className="flip-card"> {/* This inner div now handles transform-style */}
        {/* Front Face */}
        <motion.div
          className="flip-card-front" // Use CSS for base styles
          animate={{ rotateY: isFlipped ? -180 : 0 }} // Flip front away when isFlipped
          transition={spring}
          style={{ zIndex: isFlipped ? 0 : 1 }} // Front is on top initially
        >
          {frontContent}
        </motion.div>

        {/* Back Face */}
        <motion.div
          className="flip-card-back" // Use CSS for base styles
          initial={{ rotateY: 180 }} // Start rotated
          animate={{ rotateY: isFlipped ? 0 : 180 }} // Flip back in when isFlipped
          transition={spring}
          style={{ zIndex: isFlipped ? 1 : 0 }} // Back is on top when flipped
        >
          {/* Content no longer needs manual rotation */}
          {backContent}
        </motion.div>
      </div>
    </div>
  );
}

FlipCard.propTypes = {
  frontContent: PropTypes.node.isRequired,
  backContent: PropTypes.node.isRequired,
  isFlipped: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default FlipCard; 