import React, { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './KarmaCashCard.css';

/**
 * KarmaCash Card Component
 * Implements actual KarmaCash design standards (B2.1, B3.4, B3.8, B3.11)
 * 
 * Philosophy: every interaction feels meaningful
 * Trust: no hidden costs or consequences
 * Inclusion: WCAG 2.1 AA minimum
 */

export interface KarmaCashCardProps {
  /** Card content variant affects visual hierarchy */
  variant?: 'compact' | 'standard' | 'prominent';
  
  /** Karma-driven state affects user feedback */
  karmaState?: 'neutral' | 'positive' | 'growth' | 'attention';
  
  /** Trust-building features */
  showProgress?: boolean;
  transparentActions?: boolean;
  
  /** Content with clear purpose */
  title?: string;
  description?: string;
  value?: string | number;
  
  /** Meaningful interactions */
  onAction?: () => void;
  actionLabel?: string;
  
  /** Emotional intelligence */
  errorState?: {
    message: string;
    suggestion?: string;
    recovery?: () => void;
  };
  
  /** Accessibility enhancement */
  ariaLabel?: string;
  reducedMotion?: boolean;
  
  children?: React.ReactNode;
  className?: string;
}

const KarmaCashCard = memo<KarmaCashCardProps>(({
  variant = 'standard',
  karmaState = 'neutral',
  showProgress = false,
  transparentActions = true,
  title,
  description,
  value,
  onAction,
  actionLabel,
  errorState,
  ariaLabel,
  reducedMotion,
  children,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Respect user motion preferences (B3.11 requirement)
  const prefersReducedMotion = reducedMotion ?? 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Karma-driven animation variants (B3.11)
  const cardVariants = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
      scale: 1
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.4, 0, 0.2, 1] // cubic-bezier(0.4, 0, 0.2, 1)
      }
    },
    hover: {
      y: prefersReducedMotion ? 0 : -2,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    pressed: {
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: {
        duration: 0.1,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  // Generate meaningful classes based on KarmaCash standards
  const cardClasses = [
    'karmacash-card',
    `karmacash-card--${variant}`,
    `karmacash-card--${karmaState}`,
    transparentActions && 'karmacash-card--transparent',
    errorState && 'karmacash-card--error',
    className
  ].filter(Boolean).join(' ');

  // Emotional intelligence in error handling (B2.1)
  const renderError = () => {
    if (!errorState) return null;
    
    return (
      <motion.div 
        className="karmacash-card__error"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="karmacash-card__error-message">
          {errorState.message}
        </div>
        {errorState.suggestion && (
          <div className="karmacash-card__error-suggestion">
            💡 {errorState.suggestion}
          </div>
        )}
        {errorState.recovery && (
          <button 
            className="karmacash-card__error-recovery"
            onClick={errorState.recovery}
          >
            Try again
          </button>
        )}
      </motion.div>
    );
  };

  // Trust-building progress indicator
  const renderProgress = () => {
    if (!showProgress) return null;
    
    return (
      <div className="karmacash-card__progress">
        <div className="karmacash-card__progress-bar">
          <motion.div 
            className="karmacash-card__progress-fill"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      ref={cardRef}
      className={cardClasses}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={!prefersReducedMotion ? "hover" : undefined}
      whileTap={!prefersReducedMotion ? "pressed" : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onClick={onAction}
      role={onAction ? "button" : "article"}
      tabIndex={onAction ? 0 : undefined}
      aria-label={ariaLabel || title}
      aria-pressed={onAction && isPressed ? true : undefined}
      // WCAG 2.1 AA compliance (B2.1)
      onKeyDown={(e) => {
        if (onAction && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAction();
        }
      }}
    >
      {/* Trust indicator */}
      <div className="karmacash-card__trust-indicator" />
      
      {/* Main content area */}
      <div className="karmacash-card__content">
        {title && (
          <h3 className="karmacash-card__title">
            {title}
          </h3>
        )}
        
        {description && (
          <p className="karmacash-card__description">
            {description}
          </p>
        )}
        
        {value && (
          <div className="karmacash-card__value">
            {value}
          </div>
        )}
        
        {children}
        
        {renderProgress()}
        {renderError()}
      </div>
      
      {/* Action area with transparent intentions */}
      {onAction && actionLabel && (
        <div className="karmacash-card__action">
          <span className="karmacash-card__action-label">
            {actionLabel}
          </span>
          <motion.div
            className="karmacash-card__action-indicator"
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.div>
        </div>
      )}
      
      {/* Karma feedback indicator */}
      <div className="karmacash-card__karma-indicator">
        <AnimatePresence>
          {karmaState === 'positive' && (
            <motion.div
              className="karmacash-card__karma-positive"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3, ease: 'backOut' }}
            >
              ✨
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

KarmaCashCard.displayName = 'KarmaCashCard';

export default KarmaCashCard;
